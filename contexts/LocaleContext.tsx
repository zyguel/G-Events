"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_LOCALE,
  LocaleSettings,
  normalizeLocale,
  TranslationLanguage,
  TRANSLATION_LANGUAGES,
} from '@/lib/i18n';
import { getStaticTranslation } from '@/lib/staticTranslations';

const LOCALE_STORAGE_KEY = 'g_events_locale_settings';
const LOCALE_SYNC_STORAGE_KEY = 'g_events_locale_last_sync_at';
const LOCALE_SYNC_TTL_MS = 10 * 60 * 1000;
const ADMIN_ROOTS = ['/dashboard', '/admin/events', '/management', '/profile', '/settings'];

function isAdminAppRoute(pathname: string) {
  return ADMIN_ROOTS.some((root) => pathname === root || pathname.startsWith(`${root}/`));
}

interface LocaleContextType {
  locale: LocaleSettings;
  isLoadingLocale: boolean;
  availableLanguages: TranslationLanguage[];
  saveLocale: (next: { language: string; region: string }) => Promise<boolean>;
  t: (text: string) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const originalTextMap = new WeakMap<Text, string>();
const translatedByNode = new WeakMap<Text, string>();

function unwrapText(rawText: string) {
  const leading = rawText.match(/^\s*/)?.[0] ?? '';
  const trailing = rawText.match(/\s*$/)?.[0] ?? '';
  const trimmed = rawText.trim();

  return { leading, trailing, trimmed };
}

function wrapText(source: string, translated: string): string {
  const { leading, trailing, trimmed } = unwrapText(source);

  if (!trimmed) {
    return source;
  }

  return `${leading}${translated}${trailing}`;
}

function isInsideEditableOrNoTranslate(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent) {
    return false;
  }

  return !!parent.closest(
    '[contenteditable="true"], .ProseMirror, input, textarea, [translate="no"], [data-no-translate="true"], .notranslate'
  );
}

async function fetchBatchTranslations(payload: { texts: string[]; source?: string; target: string }) {
  const result: Record<string, string> = {};

  for (const text of payload.texts) {
    const staticTranslation = getStaticTranslation(text, payload.target);
    result[text] = staticTranslation ?? text;
  }

  return result;
}

async function applyTranslations(
  language: string,
  cacheByLanguage: Map<string, Map<string, string>>,
  sourceLanguage = 'en'
) {
  if (typeof document === 'undefined') {
    return;
  }

  const languageCache = cacheByLanguage.get(language) ?? new Map<string, string>();
  cacheByLanguage.set(language, languageCache);

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  const missing: string[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parentTag = node.parentElement?.tagName;

    if (!parentTag || parentTag === 'SCRIPT' || parentTag === 'STYLE' || parentTag === 'NOSCRIPT') {
      continue;
    }

    if (isInsideEditableOrNoTranslate(node)) {
      continue;
    }

    const currentValue = node.nodeValue ?? '';
    if (!originalTextMap.has(node)) {
      originalTextMap.set(node, currentValue);
    }

    const source = originalTextMap.get(node) ?? currentValue;
    const { trimmed } = unwrapText(source);
    if (!trimmed) {
      continue;
    }

    nodes.push(node);

    if (!languageCache.has(trimmed) && language !== 'en') {
      missing.push(trimmed);
    }
  }

  if (missing.length && language !== 'en') {
    const uniqueMissing = [...new Set(missing)];
    const translated = await fetchBatchTranslations({
      texts: uniqueMissing,
      source: sourceLanguage,
      target: language,
    });

    uniqueMissing.forEach((text) => {
      languageCache.set(text, translated[text] ?? text);
    });
  }

  nodes.forEach((node) => {
    const source = originalTextMap.get(node) ?? node.nodeValue ?? '';
    const { trimmed } = unwrapText(source);

    const translatedTrimmed = language === 'en' ? trimmed : languageCache.get(trimmed) ?? trimmed;
    const nextValue = wrapText(source, translatedTrimmed);

    if (translatedByNode.get(node) !== nextValue) {
      node.nodeValue = nextValue;
      translatedByNode.set(node, nextValue);
    }
  });
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<LocaleSettings>(DEFAULT_LOCALE);
  const [isLoadingLocale, setIsLoadingLocale] = useState(true);
  const availableLanguages = TRANSLATION_LANGUAGES;
  const observerRef = useRef<MutationObserver | null>(null);
  const translationQueuedRef = useRef(false);
  const translationCacheRef = useRef<Map<string, Map<string, string>>>(new Map());

  useEffect(() => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const shouldLoadServerLocale = isAdminAppRoute(pathname);
    let hasLocalLocale = false;

    try {
      const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LocaleSettings>;
        setLocale(normalizeLocale(parsed));
        hasLocalLocale = true;
      }
    } catch {
    }

    const lastSyncedAt = Number(localStorage.getItem(LOCALE_SYNC_STORAGE_KEY) || '0');
    const hasFreshServerLocale =
      Number.isFinite(lastSyncedAt) &&
      lastSyncedAt > 0 &&
      Date.now() - lastSyncedAt <= LOCALE_SYNC_TTL_MS;

    if (!shouldLoadServerLocale || (hasLocalLocale && hasFreshServerLocale)) {
      setIsLoadingLocale(false);
      return;
    }

    if (hasLocalLocale) {
      // Keep UI responsive using cached locale while refreshing in the background.
      setIsLoadingLocale(false);
    }

    const loadServerLocale = async () => {
      try {
        const localeResponse = await fetch('/api/user/locale');

        if (localeResponse.ok) {
          const localePayload = await localeResponse.json();
          const nextLocale = normalizeLocale(localePayload?.data);
          setLocale(nextLocale);
          localStorage.setItem(LOCALE_STORAGE_KEY, JSON.stringify(nextLocale));
          localStorage.setItem(LOCALE_SYNC_STORAGE_KEY, String(Date.now()));
        }
      } catch {
      } finally {
        if (!hasLocalLocale) {
          setIsLoadingLocale(false);
        }
      }
    };

    loadServerLocale();
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale.language;
    localStorage.setItem(LOCALE_STORAGE_KEY, JSON.stringify(locale));

    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const shouldApplyDomTranslations = locale.language !== 'en' && isAdminAppRoute(pathname);

    if (!shouldApplyDomTranslations) {
      observerRef.current?.disconnect();
      return;
    }

    let cancelled = false;

    const translateNow = async () => {
      await applyTranslations(locale.language, translationCacheRef.current);
    };

    void translateNow();

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new MutationObserver(() => {
      if (cancelled) {
        return;
      }

      if (translationQueuedRef.current) {
        return;
      }

      translationQueuedRef.current = true;
      requestAnimationFrame(() => {
        translationQueuedRef.current = false;
        if (!cancelled) {
          void applyTranslations(locale.language, translationCacheRef.current);
        }
      });
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      cancelled = true;
      observerRef.current?.disconnect();
    };
  }, [locale]);

  const saveLocale = async (next: { language: string; region: string }) => {
    const normalized = normalizeLocale(next);

    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const shouldPersistServerLocale = isAdminAppRoute(pathname);

    if (!shouldPersistServerLocale) {
      setLocale(normalized);
      localStorage.setItem(LOCALE_STORAGE_KEY, JSON.stringify(normalized));
      return true;
    }

    try {
      const response = await fetch('/api/user/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      });

      if (!response.ok) {
        return false;
      }

      const payload = await response.json();
      const fromServer = normalizeLocale(payload?.data);
      setLocale(fromServer);
      localStorage.setItem(LOCALE_STORAGE_KEY, JSON.stringify(fromServer));
      localStorage.setItem(LOCALE_SYNC_STORAGE_KEY, String(Date.now()));
      return true;
    } catch {
      return false;
    }
  };

  const translateText = useCallback(
    (text: string) => {
      if (!text || locale.language === 'en') {
        return text;
      }

      return getStaticTranslation(text, locale.language) ?? text;
    },
    [locale.language]
  );

  const value = useMemo<LocaleContextType>(
    () => ({
      locale,
      isLoadingLocale,
      availableLanguages,
      saveLocale,
      t: translateText,
    }),
    [availableLanguages, isLoadingLocale, locale, translateText]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
