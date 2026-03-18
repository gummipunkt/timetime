"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { locales, defaultLocale, isLocale, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getLocaleFromPathname(pathname: string): Locale {
  const seg = pathname.split("/")[1] || "";
  return isLocale(seg) ? seg : defaultLocale;
}

function switchLocale(pathname: string, nextLocale: Locale): string {
  const parts = pathname.split("/");
  const current = parts[1] || "";
  if (isLocale(current)) {
    parts[1] = nextLocale;
    return parts.join("/") || `/${nextLocale}`;
  }
  return `/${nextLocale}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

const labels: Record<Locale, string> = {
  de: "DE",
  en: "EN",
  fr: "FR",
  es: "ES",
};

export function LanguageSwitcher() {
  const pathname = usePathname() || "/";
  const router = useRouter();

  const current = useMemo(() => getLocaleFromPathname(pathname), [pathname]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="font-medium">
          {labels[current]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => {
              router.push(switchLocale(pathname, loc));
              router.refresh();
            }}
          >
            {labels[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

