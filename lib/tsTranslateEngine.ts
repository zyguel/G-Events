import { normalizeLanguageCode, TranslationLanguage } from '@/lib/i18n';

type TranslationPipeline = (input: string, options?: Record<string, unknown>) => Promise<Array<{ translation_text?: string; generated_text?: string }> | { translation_text?: string; generated_text?: string }>;

const SUPPORTED_TS_LANGUAGES: TranslationLanguage[] = [
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

const MODEL_ID = process.env.TS_TRANSLATION_MODEL?.trim() || 'Xenova/m2m100_418M';

const languageCodes = new Set(SUPPORTED_TS_LANGUAGES.map((language) => language.code));
const cache = new Map<string, string>();

let pipelinePromise: Promise<TranslationPipeline> | null = null;
let engineLoaded = false;

function getKey(source: string, target: string, text: string): string {
  return `${source}__${target}__${text}`;
}

function ensureSupportedLanguage(code: string): string {
  const normalized = normalizeLanguageCode(code);
  if (!languageCodes.has(normalized)) {
    throw new Error(`Unsupported language: ${normalized}`);
  }
  return normalized;
}

async function getPipeline(): Promise<TranslationPipeline> {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const transformersModule = await import('@xenova/transformers');
      const built = await transformersModule.pipeline('translation', MODEL_ID);
      engineLoaded = true;
      return built as TranslationPipeline;
    })();
  }

  return pipelinePromise;
}

function extractTranslatedText(result: Array<{ translation_text?: string; generated_text?: string }> | { translation_text?: string; generated_text?: string }): string {
  if (Array.isArray(result)) {
    const first = result[0];
    return first?.translation_text || first?.generated_text || '';
  }

  return result.translation_text || result.generated_text || '';
}

async function translateOneTs(text: string, source: string, target: string): Promise<string> {
  const sourceLanguage = ensureSupportedLanguage(source);
  const targetLanguage = ensureSupportedLanguage(target);

  if (sourceLanguage === targetLanguage) {
    return text;
  }

  const key = getKey(sourceLanguage, targetLanguage, text);
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const translate = await getPipeline();
  const result = await translate(text, {
    src_lang: sourceLanguage,
    tgt_lang: targetLanguage,
    source_lang: sourceLanguage,
    target_lang: targetLanguage,
  });

  const translated = extractTranslatedText(result) || text;
  cache.set(key, translated);
  return translated;
}

export function getTsSupportedLanguages(): TranslationLanguage[] {
  return SUPPORTED_TS_LANGUAGES;
}

export function getTsEngineHealth() {
  return {
    model: MODEL_ID,
    loaded: engineLoaded,
    initializing: !!pipelinePromise && !engineLoaded,
    cacheEntries: cache.size,
    supportedLanguages: getTsSupportedLanguages(),
  };
}

export async function translateBatchWithTsEngine(params: {
  texts: string[];
  source?: string;
  target: string;
}): Promise<Record<string, string>> {
  const targetLanguage = ensureSupportedLanguage(params.target);
  const requestedSource = normalizeLanguageCode(params.source ?? 'en');
  const sourceLanguage = requestedSource === 'auto' ? 'en' : ensureSupportedLanguage(requestedSource);
  const uniqueTexts = [...new Set(params.texts.filter((text) => typeof text === 'string' && text.trim().length > 0))];

  if (!uniqueTexts.length) {
    return {};
  }

  const translatedPairs = await Promise.all(
    uniqueTexts.map(async (text) => {
      const translated = await translateOneTs(text, sourceLanguage, targetLanguage);
      return [text, translated] as const;
    })
  );

  return Object.fromEntries(translatedPairs);
}
