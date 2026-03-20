export interface LocaleSettings {
  language: string;
  region: string;
}

export const DEFAULT_LOCALE: LocaleSettings = {
  language: 'en',
  region: 'US',
};

export interface TranslationLanguage {
  code: string;
  name: string;
  targets?: string[];
}

export const TRANSLATION_LANGUAGES: TranslationLanguage[] = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: 'Chinese' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
];

export function normalizeLanguageCode(value: unknown): string {
  if (typeof value !== 'string') {
    return DEFAULT_LOCALE.language;
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed || DEFAULT_LOCALE.language;
}

export function normalizeRegionCode(value: unknown): string {
  if (typeof value !== 'string') {
    return DEFAULT_LOCALE.region;
  }

  const trimmed = value.trim().toUpperCase();
  return trimmed || DEFAULT_LOCALE.region;
}

export function normalizeLocale(input: Partial<LocaleSettings> | null | undefined): LocaleSettings {
  const language = normalizeLanguageCode(input?.language);
  const region = normalizeRegionCode(input?.region);

  return { language, region };
}

export function getLanguageLabel(code: string, catalog?: TranslationLanguage[]): string {
  const normalized = normalizeLanguageCode(code);
  const match = catalog?.find((lang) => normalizeLanguageCode(lang.code) === normalized);
  return match?.name || normalized.toUpperCase();
}
