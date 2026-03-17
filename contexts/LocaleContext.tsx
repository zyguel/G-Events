"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_LOCALE,
  LocaleSettings,
  normalizeLanguageCode,
  normalizeLocale,
  TranslationLanguage,
} from '@/lib/i18n';

const LOCALE_STORAGE_KEY = 'g_events_locale_settings';

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

async function fetchBatchTranslations(payload: { texts: string[]; source?: string; target: string }) {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return {} as Record<string, string>;
  }

  const data = await response.json();
  return (data?.data ?? {}) as Record<string, string>;
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
  const [availableLanguages, setAvailableLanguages] = useState<TranslationLanguage[]>([
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fil', name: 'Filipino' },
  ]);
  const observerRef = useRef<MutationObserver | null>(null);
  const translationCacheRef = useRef<Map<string, Map<string, string>>>(new Map());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LocaleSettings>;
        setLocale(normalizeLocale(parsed));
      }
    } catch {
    }

    const loadServerLocale = async () => {
      try {
        const [localeResponse, languagesResponse] = await Promise.all([
          fetch('/api/user/locale', { cache: 'no-store' }),
          fetch('/api/translate/languages', { cache: 'no-store' }),
        ]);

        if (localeResponse.ok) {
          const localePayload = await localeResponse.json();
          const nextLocale = normalizeLocale(localePayload?.data);
          setLocale(nextLocale);
          localStorage.setItem(LOCALE_STORAGE_KEY, JSON.stringify(nextLocale));
        }

        if (languagesResponse.ok) {
          const languagesPayload = await languagesResponse.json();
          const list = Array.isArray(languagesPayload?.data)
            ? (languagesPayload.data as Array<{ code?: unknown; name?: unknown; targets?: unknown }>)
            : [];
          const normalized = list
            .filter((item) => typeof item?.code === 'string' && typeof item?.name === 'string')
            .map((item) => {
              const targets = Array.isArray(item.targets)
                ? item.targets.filter((target): target is string => typeof target === 'string').map((target) => normalizeLanguageCode(target))
                : undefined;

              return {
                code: normalizeLanguageCode(item.code),
                name: String(item.name),
                targets,
              };
            });

          if (!normalized.find((lang: TranslationLanguage) => lang.code === 'en')) {
            normalized.unshift({ code: 'en', name: 'English' });
          }

          setAvailableLanguages(normalized);
        }
      } catch {
      } finally {
        setIsLoadingLocale(false);
      }
    };

    loadServerLocale();
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale.language;
    localStorage.setItem(LOCALE_STORAGE_KEY, JSON.stringify(locale));

    let cancelled = false;

    const translateNow = async () => {
      await applyTranslations(locale.language, translationCacheRef.current);
    };

    translateNow();

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new MutationObserver(() => {
      if (cancelled) {
        return;
      }
      applyTranslations(locale.language, translationCacheRef.current);
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
      return true;
    } catch {
      return false;
    }
  };

  const value = useMemo<LocaleContextType>(
    () => ({
      locale,
      isLoadingLocale,
      availableLanguages,
      saveLocale,
      t: (text: string) => text,
    }),
    [availableLanguages, isLoadingLocale, locale]
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
