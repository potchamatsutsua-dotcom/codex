export const locales = ["ja", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ja";

const translations: Record<Locale, Record<string, unknown>> = {
  ja: {},
  en: {},
};

export async function loadMessages(locale: Locale) {
  if (Object.keys(translations[locale]).length === 0) {
    try {
      translations[locale] = (await import(`../../messages/${locale}.json`)).default;
    } catch {
      translations[locale] = {};
    }
  }
  return translations[locale];
}

export function t(messages: Record<string, unknown>, key: string): string {
  const parts = key.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return key;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : key;
}
