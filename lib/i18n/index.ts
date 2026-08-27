import { en, type TranslationKey } from "./locales/en";
import { zh } from "./locales/zh";

export type { TranslationKey } from "./locales/en";

export type Locale = "en" | "zh";
export type TranslationParams = Record<string, string | number>;

export const LOCALE_STORAGE_KEY = "moanachat-locale";
export const translations = { en, zh } as const;

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "zh";
}

export function detectLocale(
  saved: unknown,
  browserLanguages: readonly string[]
): Locale {
  if (isLocale(saved)) {
    return saved;
  }

  return browserLanguages.some((language) =>
    language.toLowerCase().startsWith("zh")
  )
    ? "zh"
    : "en";
}

export function createTranslator(locale: Locale) {
  return (key: TranslationKey, params: TranslationParams = {}) => {
    const template = translations[locale][key] ?? en[key] ?? key;

    return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
      params[name] === undefined ? match : String(params[name])
    );
  };
}

export function getClientTranslator() {
  if (typeof window === "undefined") {
    return createTranslator("en");
  }

  let saved: string | null = null;
  try {
    saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    // Preference storage is optional.
  }

  const browserLanguages = [
    navigator.language,
    ...(navigator.languages ?? []),
  ].filter(Boolean);

  return createTranslator(detectLocale(saved, browserLanguages));
}
