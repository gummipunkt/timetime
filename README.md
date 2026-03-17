# TimeTracker

Self‑hosted time tracking and leave management for small and mid‑sized companies.

Readme was generated with Cursor. Thanks.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)

## 🚀 Features

### Time tracking
- ⏱️ Clock in / clock out / breaks
- 📊 Live calculation of daily working time
- 📈 Automatic flex time balance
- 🗓️ Automatic public holiday handling (per German state)

### Leave management
- 📝 Request & approval workflow (employee → supervisor / HR / admin)
- 📅 Team calendar with overlaps and department colors
- 🧮 Automatic leave day calculation (incl. weekends/holidays handling)
- 📋 Multiple leave types (vacation, sick, unpaid, special leave, etc.)

### Roles & permissions
- 👑 **Admin**: Full access, user & department management, manual corrections, reporting
- 👔 **Supervisor**: Team overview, approval of leave and time correction requests
- 👤 **User**: Personal time tracking, leave requests, personal reports

### Reporting & audit
- 📊 Monthly and yearly overviews per employee
- 📁 CSV export of monthly timesheets (admin)
- 📝 Audit log for administrative changes

## 🛠️ Tech stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **UI**: Tailwind CSS + shadcn/ui
- **Auth**: NextAuth.js (credentials)
- **Deployment**: Docker & Docker Compose

## 📦 Local development

### Requirements

- Node.js 20+
- PostgreSQL 16+ (or Docker)
- npm / pnpm / yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/timetracker.git
   cd timetracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # then adjust .env.local (DATABASE_URL, NEXTAUTH_SECRET, etc.)
   ```

4. **Start a local PostgreSQL via Docker (optional)**
   ```bash
   docker run -d \
     --name timetracker-db \
     -e POSTGRES_USER=timetracker \
     -e POSTGRES_PASSWORD=timetracker_secure_password \
     -e POSTGRES_DB=timetracker \
     -p 5432:5432 \
     postgres:16-alpine
   ```

5. **Apply the database schema**
   ```bash
   npm run db:push
   ```

6. **Seed demo data**
   ```bash
   npm run db:seed
   ```

7. **Start the dev server**
   ```bash
   npm run dev
   ```

8. **Open the app**  
   `http://localhost:3000`

## 🐳 Docker deployment

1. **Create `.env` for production**
   ```bash
   cp .env.example .env
   # adjust: NEXTAUTH_SECRET (32+ chars), POSTGRES_PASSWORD, NEXTAUTH_URL, etc.
   ```

2. **Start services**
   ```bash
   docker compose up -d
   ```

3. **Run migrations + seed (one‑time setup)**
   ```bash
   docker compose --profile setup run migrate
   ```

4. **Open the app**  
   `http://localhost:3000` (or behind your reverse proxy, e.g. `https://timetime.ecow.dev`)

## 🔐 Demo users

After running `npm run db:seed` you get the following demo accounts:

### Management & HR

| Role        | Description   | Email                     | Password   |
|------------|---------------|---------------------------|------------|
| Admin (CEO) | Management    | `ceo@timetracker.local`   | `admin123` |
| Admin (HR)  | HR / People   | `hr@timetracker.local`    | `admin123` |

### Development department

| Role        | Description                  | Email                        | Password |
|-------------|------------------------------|------------------------------|----------|
| Supervisor  | Head of Development          | `lead.dev@timetracker.local` | `user123` |
| User (FT)   | Developer full‑time          | `anna.dev@timetracker.local` | `user123` |
| User (PT)   | Developer part‑time          | `ben.dev@timetracker.local`  | `user123` |
| User (PT)   | Developer part‑time          | `cora.dev@timetracker.local` | `user123` |

### Sales department

| Role        | Description                  | Email                          | Password |
|-------------|------------------------------|---------------------------------|----------|
| Supervisor  | Head of Sales                | `lead.sales@timetracker.local` | `user123` |
| User (FT)   | Sales full‑time              | `david.sales@timetracker.local`| `user123` |
| User (PT)   | Sales part‑time              | `eva.sales@timetracker.local`  | `user123` |
| User (PT)   | Sales part‑time              | `finn.sales@timetracker.local` | `user123` |

**Demo data notes:**

- All users have sample time entries for the last weeks and a mix of pending and approved leave requests in the **current year**.
- Supervisors can approve **leave requests** and **time correction requests** for their team members (and for delegated users via the delegation rules).
- All approvals/rejections/cancellations of leave and time-correction requests are written to the central **Audit Log** and visible on the `/admin/audit` page.
- Admins (CEO/HR) have full access, including CSV export under `Reports` → **Export (CSV)** and the full audit history.

## 📁 Project structure

```text
timetracker/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Demo data seeding
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/        # Auth routes (login)
│   │   ├── (dashboard)/   # Dashboard routes
│   │   └── api/           # API routes
│   ├── components/        # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── layout/        # Layout components
│   │   ├── time/          # Time tracking components
│   │   └── leave/         # Leave management components
│   ├── lib/               # Services, utilities (auth, time, leave, admin)
│   ├── hooks/             # React hooks
│   └── types/             # TypeScript types
├── docker-compose.yml     # Docker Compose configuration
├── Dockerfile             # Production Dockerfile (standalone Next.js)
└── README.md
```

## 🔧 Configuration

### Environment variables

| Variable          | Description                         | Default                 |
|-------------------|-------------------------------------|-------------------------|
| `DATABASE_URL`    | PostgreSQL connection string        | –                       |
| `NEXTAUTH_SECRET` | Secret for NextAuth                 | –                       |
| `NEXTAUTH_URL`    | Public app URL                      | `http://localhost:3000` |
| `TZ`              | Time zone                           | `Europe/Berlin`         |
| `DEFAULT_REGION`  | Default region for holidays (DE-XX) | `DE-BY`                 |
| `DEFAULT_ANNUAL_LEAVE_DAYS` | Default leave entitlement | `30`                    |

### Holidays (Germany)

Supported federal states (ISO 3166‑2 codes) for automatic holiday calculation:

- DE-BW, DE-BY, DE-BE, DE-BB, DE-HB, DE-HH, DE-HE,
- DE-MV, DE-NI, DE-NW, DE-RP, DE-SL, DE-SN, DE-ST, DE-SH, DE-TH

## 📝 API overview (selected)

### Health check

```http
GET /api/health
```

### Auth (NextAuth)

```http
POST /api/auth/signin    # login
POST /api/auth/signout   # logout
GET  /api/auth/session   # current session
```

### Time tracking

```http
POST /api/time/clock           # clock in/out, start/end break
GET  /api/time/status          # today's status (entries, totals, flex)
GET  /api/time/summary         # monthly daily summaries
GET  /api/time/entries         # raw time entries for a period
GET  /api/time/corrections     # own correction requests
GET  /api/time/corrections/pending     # pending corrections for supervisor/admin
POST /api/time/corrections     # create correction request
POST /api/time/corrections/:id/approve # approve correction
POST /api/time/corrections/:id/reject  # reject correction
```

### Leave management

```http
GET  /api/leave                # own leave requests
POST /api/leave                # create leave request
GET  /api/leave/:id            # request details
POST /api/leave/:id/approve    # approve (supervisor/admin)
POST /api/leave/:id/reject     # reject (supervisor/admin)
GET  /api/leave/balance        # current leave balance
GET  /api/leave/calendar       # team calendar
GET  /api/leave/pending        # pending approvals for supervisor/admin
```

## 🤝 Contributing

Contributions are welcome!  
Feel free to open an issue or a pull request if you find bugs or want to add features.

## 📄 License

This project is licensed under the **GNU General Public License v3.0 (GPL‑3.0)**.  
See [`LICENSE`](LICENSE) for the full license text.

---

Built with ❤️ for modern, transparent time tracking.
