import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  const maybeLocale = locale ?? "";
  const resolvedLocale = isLocale(maybeLocale) ? maybeLocale : defaultLocale;

  const messages = (await import(`../messages/${resolvedLocale}.json`)).default;

  return {
    locale: resolvedLocale,
    messages,
  };
});

