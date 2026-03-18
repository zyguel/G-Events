import { normalizeLanguageCode, TranslationLanguage, TRANSLATION_LANGUAGES } from '@/lib/i18n';
import { getStaticTranslation } from '@/lib/staticTranslations';

const SUPPORTED_TS_LANGUAGES: TranslationLanguage[] = TRANSLATION_LANGUAGES;

const languageCodes = new Set(SUPPORTED_TS_LANGUAGES.map((language) => language.code));

function ensureSupportedLanguage(code: string): string {
  const normalized = normalizeLanguageCode(code);
  if (!languageCodes.has(normalized)) {
    throw new Error(`Unsupported language: ${normalized}`);
  }
  return normalized;
}

/**
 * Translate text using only static translations (no ML model)
 * Returns original text if no static translation exists
 */
export function translateWithStaticOnly(text: string, target: string): string {
  const targetLanguage = ensureSupportedLanguage(target);
  
  if (targetLanguage === 'en') {
    return text;
  }

  return getStaticTranslation(text, targetLanguage) ?? text;
}

/**
 * Batch translate texts using only static translations
 * Returns original text for any entries not in static dictionary
 */
export async function translateBatchWithTsEngine(params: {
  texts: string[];
  source?: string;
  target: string;
}): Promise<Record<string, string>> {
  const targetLanguage = ensureSupportedLanguage(params.target);
  const uniqueTexts = [...new Set(params.texts.filter((text) => typeof text === 'string' && text.trim().length > 0))];

  if (!uniqueTexts.length) {
    return {};
  }

  const result: Record<string, string> = {};
  
  for (const text of uniqueTexts) {
    result[text] = translateWithStaticOnly(text, targetLanguage);
  }

  return result;
}

export function getTsSupportedLanguages(): TranslationLanguage[] {
  return SUPPORTED_TS_LANGUAGES;
}

export function getTsEngineHealth() {
  return {
    loaded: true,
    initializing: false,
    staticOnly: true,
    supportedLanguages: getTsSupportedLanguages(),
  };
}
