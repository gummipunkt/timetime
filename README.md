# TimeTracker

Eine selbst hostbare Zeiterfassungs- und Urlaubsplanungs-Software für Unternehmen.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)

## 🚀 Features

### Zeiterfassung
- ⏱️ Echtzeit-Stempeln (Kommen/Gehen/Pause)
- 📊 Live-Berechnung der Arbeitszeit
- 📈 Automatische Gleitzeit-Saldo Berechnung
- 🗓️ Automatische Feiertags-Berücksichtigung

### Urlaubsverwaltung
- 📝 Antragswesen mit Genehmigungsworkflow
- 📅 Team-Kalender Visualisierung
- 🧮 Automatische Urlaubstage-Berechnung
- 📋 Verschiedene Urlaubsarten (Urlaub, Krankheit, Sonderurlaub)

### Rollen & Rechte
- 👑 **Admin**: Vollzugriff, User-Verwaltung, Korrekturen
- 👔 **Supervisor**: Team-Übersicht, Genehmigung von Anträgen
- 👤 **User**: Eigene Zeiterfassung und Anträge

### Reporting
- 📊 Monats- und Jahresübersichten
- 📝 Audit-Log für alle Änderungen
- 📈 Statistiken und Auswertungen

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Sprache**: TypeScript
- **Datenbank**: PostgreSQL
- **ORM**: Prisma
- **UI**: Tailwind CSS + Shadcn/UI
- **Auth**: NextAuth.js
- **Deployment**: Docker & Docker Compose

## 📦 Installation

### Voraussetzungen

- Node.js 20+
- PostgreSQL 16+ (oder Docker)
- pnpm/npm/yarn

### Lokale Entwicklung

1. **Repository klonen**
   ```bash
   git clone https://github.com/your-repo/timetracker.git
   cd timetracker
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**
   ```bash
   cp .env.example .env.local
   # Dann .env.local anpassen
   ```

4. **Datenbank starten (mit Docker)**
   ```bash
   docker run -d \
     --name timetracker-db \
     -e POSTGRES_USER=timetracker \
     -e POSTGRES_PASSWORD=timetracker \
     -e POSTGRES_DB=timetracker \
     -p 5432:5432 \
     postgres:16-alpine
   ```

5. **Datenbank-Schema erstellen**
   ```bash
   npm run db:migrate
   ```

6. **Testdaten laden (optional)**
   ```bash
   npm run db:seed
   ```

7. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```

8. **Öffnen**: http://localhost:3000

### 🐳 Docker Deployment

1. **Umgebungsvariablen erstellen**
   ```bash
   cp .env.example .env
   # Anpassen: NEXTAUTH_SECRET, POSTGRES_PASSWORD, etc.
   ```

2. **Container starten**
   ```bash
   docker-compose up -d
   ```

3. **Datenbank initialisieren**
   ```bash
   docker-compose --profile setup run migrate
   ```

4. **Öffnen**: http://localhost:3000

## 🔐 Demo-Zugangsdaten

Nach `npm run db:seed` stehen folgende Testaccounts zur Verfügung:

### Management & HR

| Rolle       | Beschreibung        | E-Mail                    | Passwort |
|------------|---------------------|---------------------------|----------|
| Admin (CEO) | Geschäftsführung    | `ceo@timetracker.local`   | `admin123` |
| Admin (HR)  | HR / Personal       | `hr@timetracker.local`    | `admin123` |

### Abteilung Entwicklung

| Rolle        | Beschreibung               | E-Mail                       | Passwort |
|-------------|----------------------------|------------------------------|----------|
| Supervisor  | Leitung Entwicklung        | `lead.dev@timetracker.local` | `user123` |
| User (VZ)   | Entwickler Vollzeit        | `anna.dev@timetracker.local` | `user123` |
| User (TZ)   | Entwickler Teilzeit        | `ben.dev@timetracker.local`  | `user123` |
| User (TZ)   | Entwickler Teilzeit        | `cora.dev@timetracker.local` | `user123` |

### Abteilung Vertrieb

| Rolle        | Beschreibung               | E-Mail                         | Passwort |
|-------------|----------------------------|--------------------------------|----------|
| Supervisor  | Leitung Vertrieb           | `lead.sales@timetracker.local` | `user123` |
| User (VZ)   | Vertrieb Vollzeit          | `david.sales@timetracker.local`| `user123` |
| User (TZ)   | Vertrieb Teilzeit          | `eva.sales@timetracker.local`  | `user123` |
| User (TZ)   | Vertrieb Teilzeit          | `finn.sales@timetracker.local` | `user123` |

**Hinweise zu den Demo-Daten:**

- Alle Benutzer haben beispielhafte Urlaubsanträge (genehmigt und noch offen) sowie Stempelzeiten der letzten Tage.
- Die Supervisor*innen können Urlaubs- und Zeitkorrektur-Anträge ihres Teams (und – über Vertretungsregeln – der jeweils delegierten Mitarbeitenden) genehmigen.
- Die Admins (CEO/HR) haben Vollzugriff auf alle Bereiche, inkl. Reporting-Export (CSV) unter `Berichte` → **Export (CSV)**.

## 📁 Projektstruktur

```
timetracker/
├── prisma/
│   ├── schema.prisma      # Datenbankschema
│   └── seed.ts            # Testdaten
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/        # Auth-Routen (Login)
│   │   ├── (dashboard)/   # Dashboard-Routen
│   │   └── api/           # API-Routen
│   ├── components/        # React-Komponenten
│   │   ├── ui/            # Shadcn/UI Komponenten
│   │   ├── layout/        # Layout-Komponenten
│   │   ├── time/          # Zeiterfassungs-Komponenten
│   │   └── leave/         # Urlaubs-Komponenten
│   ├── lib/               # Utilities
│   ├── hooks/             # React Hooks
│   └── types/             # TypeScript Types
├── docker-compose.yml     # Docker Compose Config
├── Dockerfile             # Production Dockerfile
└── README.md
```

## 🔧 Konfiguration

### Umgebungsvariablen

| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| `DATABASE_URL` | PostgreSQL Connection String | - |
| `NEXTAUTH_SECRET` | Secret für NextAuth | - |
| `NEXTAUTH_URL` | App URL | http://localhost:3000 |
| `TZ` | Zeitzone | Europe/Berlin |
| `DEFAULT_REGION` | Bundesland für Feiertage | DE-BY |

### Feiertage

Unterstützte Bundesländer für automatische Feiertagsberechnung:
- DE-BW (Baden-Württemberg)
- DE-BY (Bayern)
- DE-BE (Berlin)
- DE-BB (Brandenburg)
- DE-HB (Bremen)
- DE-HH (Hamburg)
- DE-HE (Hessen)
- DE-MV (Mecklenburg-Vorpommern)
- DE-NI (Niedersachsen)
- DE-NW (Nordrhein-Westfalen)
- DE-RP (Rheinland-Pfalz)
- DE-SL (Saarland)
- DE-SN (Sachsen)
- DE-ST (Sachsen-Anhalt)
- DE-SH (Schleswig-Holstein)
- DE-TH (Thüringen)

## 📝 API-Dokumentation

### Health Check
```
GET /api/health
```

### Auth
```
POST /api/auth/signin   # Login
POST /api/auth/signout  # Logout
GET  /api/auth/session  # Session abrufen
```

### Time Tracking (geplant)
```
POST /api/time/clock    # Ein-/Ausstempeln
GET  /api/time/today    # Heutige Einträge
GET  /api/time/summary  # Zusammenfassung
```

### Leave Management (geplant)
```
GET  /api/leave                # Eigene Anträge
POST /api/leave                # Neuer Antrag
GET  /api/leave/:id            # Antrag Details
POST /api/leave/:id/approve    # Genehmigen (Supervisor)
POST /api/leave/:id/reject     # Ablehnen (Supervisor)
```

## 🤝 Beitragen

Contributions sind willkommen! Bitte erstellen Sie einen Issue oder Pull Request.

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE)

---

Entwickelt mit ❤️ für moderne Zeiterfassung
