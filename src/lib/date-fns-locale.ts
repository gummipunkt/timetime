import { de, enUS, es, fr } from "date-fns/locale";
import { isLocale, type Locale } from "@/i18n/routing";

const byAppLocale: Record<Locale, typeof de> = {
  de,
  en: enUS,
  fr,
  es,
};

export function getDateFnsLocale(locale: string) {
  return isLocale(locale) ? byAppLocale[locale] : de;
}

/** BCP 47 für `Intl` / `toLocaleTimeString` */
export function getIntlLocale(locale: string): string {
  if (!isLocale(locale)) return "de-DE";
  const m: Record<Locale, string> = {
    de: "de-DE",
    en: "en-GB",
    fr: "fr-FR",
    es: "es-ES",
  };
  return m[locale];
}
