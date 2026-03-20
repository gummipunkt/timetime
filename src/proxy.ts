import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@/i18n/routing";

export default function proxy(req: Request) {
  const middleware = createMiddleware({
    locales: [...locales],
    defaultLocale,
    localePrefix: "always",
  });

  // next-intl middleware erwartet ein NextRequest-ähnliches Objekt; in Next 16 Proxy
  // wird automatisch passend adaptiert.
  // Wir rufen die erzeugte Middleware-Funktion hier einfach durch.
  // @ts-expect-error – Typen von next-intl sind noch auf Middleware benannt
  return middleware(req);
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|docs|.*\\..*).*)",
  ],
};

