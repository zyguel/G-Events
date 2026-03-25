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
  nativeName?: string;
  aliases?: string[];
  targets?: string[];
}

export const TRANSLATION_LANGUAGES: TranslationLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', aliases: ['ingilizce'] },
  { code: 'zh', name: 'Chinese', nativeName: '中文', aliases: ['mandarin', '汉语', '漢語'] },
  { code: 'es', name: 'Spanish', nativeName: 'Español', aliases: ['castellano'] },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', aliases: ['にほんご', 'nihongo'] },
  { code: 'ko', name: 'Korean', nativeName: '한국어', aliases: ['조선말', 'hangul'] },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
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
