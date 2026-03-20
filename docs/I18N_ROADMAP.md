# Internationalisierung (i18n) – Roadmap

Stand: Fortlaufend. Sprachen: `de`, `en`, `fr`, `es` (next-intl, Nachrichten unter `src/messages/`).

## Erledigt

- Globale Shell: `common`, `nav`, `auth`, `errors`, `landing`
- Dashboard-Begrüßung (`dashboard.greeting`)
- Startseite `[locale]/page.tsx` vollständig
- Login
- **Urlaub (komplett UI-Texte)**: `leave/page.tsx` (inkl. `generateMetadata`), `leave/new`, `LeaveBalanceCard`, `LeaveRequestsList`, `PendingApprovals` — Namespaces `leave.*`, `toast.*`, `common.cancel` / `common.close`
- `date-fns`-Locales an App-Locale gekoppelt (`src/lib/date-fns-locale.ts` → `getDateFnsLocale`, `getIntlLocale` für Uhrzeiten)
- **Dashboard-Kacheln** – `dashboard-stats.tsx` (`dashboard.stats.*`)
- **Zeiterfassung** – `time/page.tsx` (`generateMetadata`), `TimeClockWidget`, `TodayOverview`, `FlexBalanceCard`, `MonthlyTimesheet` — Namespace `time.*`

## Als Nächstes

1. **Zeitkorrekturen (Team)** – `time-correction-list.tsx` (Supervisor-Ansicht)
2. **Team** – `team/page.tsx`, `team-calendar.tsx`, `team/time-corrections/page.tsx`
3. **Berichte & Profil** – `reports/page.tsx`, `profile/page.tsx`
4. **Benachrichtigungen** – `notification-center.tsx`
5. **Admin-Bereich** (großer Block) – alle Seiten unter `admin/*`
6. **Metadaten** – weitere Routen mit `generateMetadata` + übersetzte Titel
7. **API-/Server-Fehlermeldungen** – nur wo sie im UI erscheinen
8. **Dokumentation** – `app/docs/page.tsx`

## Konventionen

- **Server-Komponenten**: `getTranslations({ locale, namespace: '…' })` aus `next-intl/server`
- **Client-Komponenten**: `useTranslations('…')`
- **Datumsformatierung**: `format(..., { locale: getDateFnsLocale(useLocale()) })`; Uhrzeit: `toLocaleTimeString(getIntlLocale(useLocale()), …)`
- **Neue Texte**: zuerst Schlüssel in allen vier JSON-Dateien anlegen, dann Komponente anbinden

## Pfad-Hinweis

Routen leben unter `/[locale]/…`. Links und `redirect()` immer mit `/${locale}/…` bzw. `useLocale()`.
