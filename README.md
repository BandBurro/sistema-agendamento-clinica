# Sistema de Agendamento — Clínica Dental

Full-stack dental clinic scheduling and management system built with Next.js, PostgreSQL, and Tailwind CSS. University project.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.3 (App Router, TypeScript, Turbopack) |
| Runtime | React 19.2.4 |
| Database | PostgreSQL + Prisma ORM 7.7.0 |
| Auth | NextAuth.js v5 beta (credentials + JWT, role-based) |
| Validation | Zod v4 (shared client/server schemas) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts 3 |
| Animations | Framer Motion 12 |
| Notifications | Evolution API (WhatsApp) |
| Drag & Drop | dnd-kit |
| Toasts | Sonner |
| Testing | Jest 30 + React Testing Library 16 |
| CI | GitHub Actions (lint → test → build) |

## Features

- **Monthly Calendar** — appointment density view with status color-coding, filter by dentist
- **Day View** — Google Calendar-style hourly grid per dentist, click to create or update appointments
- **Kanban Board** — drag-and-drop status management (Requested → Scheduled → In Progress → Completed / Cancelled)
- **Analytics Dashboard** — appointment stats, status breakdown charts, recent activity
- **Patient Portal** — patients request appointments and track their own status history
- **Admin Panel** — user management, role assignment, activation/deactivation
- **WhatsApp Notifications** — confirmation, status updates, and day-before reminders via Evolution API
- **Role-based Access** — ADMIN / DENTIST / RECEPTIONIST / PATIENT enforced in middleware and API routes
- **Email Verification** — new accounts are inactive until a verification link is clicked (mock in dev, real provider in prod)
- **Rate Limiting** — in-memory sliding window on registration (5/15 min per IP) and login (10/15 min per email)

## Local Setup

### Prerequisites

- Node.js 22+
- PostgreSQL running locally

### 1. Clone and install

```bash
git clone <repo-url>
cd sistema-agendamento-clinica
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/clinica_db?schema=public"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional — WhatsApp notifications (Evolution API)
EVOLUTION_API_URL="http://localhost:8080"
EVOLUTION_API_KEY="your-api-key"

# Optional — cron job auth for /api/cron/reminders
CRON_SECRET="your-cron-secret"
```

### 3. Set up the database

```bash
npm run db:migrate    # Apply schema migrations
npm run db:seed       # Seed with sample data
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Sample Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@clinica.com | password123 |
| Dentist | dr.silva@clinica.com | password123 |
| Dentist | dr.costa@clinica.com | password123 |
| Receptionist | recepcao@clinica.com | password123 |
| Patient | joao.lima@email.com | password123 |
| Patient | camila.ferreira@email.com | password123 |
| Patient | rafael.mendes@email.com | password123 |

> **Note:** Seeded accounts bypass email verification and are pre-activated.

## Running Tests

```bash
npm test                                    # All tests
npm run test:watch                          # Watch mode
npm run test:coverage                       # With coverage report
npm test -- --testPathPattern=StatusBadge   # Single file
```

## Available Scripts

```bash
npm run dev           # Start dev server (Turbopack)
npm run build         # Production build
npm run start         # Start production server
npm run type-check    # TypeScript check without emitting
npm run lint          # ESLint
npm run format        # Prettier (write)
npm run format:check  # Prettier (check only, used in CI)
```

## Database Commands

```bash
npm run db:generate    # Regenerate Prisma client after schema changes
npm run db:migrate     # Run pending migrations (dev)
npm run db:push        # Push schema without migration (prototyping)
npm run db:seed        # Reseed sample data
npm run db:studio      # Open Prisma Studio GUI
```

## WhatsApp Notifications

Notifications are sent via [Evolution API](https://github.com/EvolutionAPI/evolution-api) (a WhatsApp Business API wrapper). Three events trigger messages:

| Event | Function | Trigger |
|-------|----------|---------|
| Appointment confirmed | `sendAppointmentConfirmation` | Status → `SCHEDULED` |
| Status changed | `sendStatusUpdate` | Any other status transition |
| Day-before reminder | `sendReminder` | Cron job at 08:00 BRT |

All sends are fire-and-forget (non-blocking). Success/failure is logged to the `Notification` table in Postgres.

### Reminder Cron Job

`GET /api/cron/reminders` queries all `SCHEDULED` appointments for tomorrow and sends reminder messages. It is protected by the `Authorization: Bearer <CRON_SECRET>` header.

**Vercel deployment** (configured in `vercel.json`):
```
Schedule: 0 11 * * *  (08:00 BRT / 11:00 UTC)
```

**Manual trigger:**
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/reminders
```

If `CRON_SECRET` is not set, the endpoint is unprotected — safe for local dev, not for production.

## CI Pipeline

GitHub Actions runs on every push/PR to `main`:

1. **Install** — `npm ci`
2. **Generate** — Prisma client (`prisma generate`)
3. **Lint** — ESLint
4. **Test** — Jest (`--ci --passWithNoTests`)
5. **Build** — `next build` (includes TypeScript check)

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Appointment Status Flow

```
REQUESTED → SCHEDULED → IN_PROGRESS → COMPLETED
                    ↘              ↘
                   CANCELLED    CANCELLED
```

All valid transitions are defined in `src/types/index.ts` (`VALID_TRANSITIONS`) and enforced server-side in the PATCH `/api/appointments/[id]` route.

## Project Structure

```
src/
  app/
    (auth)/
      login/           # Login page
      register/        # Patient registration (Zod validation, strength meter)
      verify-email/    # Email verification landing page
    (app)/             # Authenticated shell (Navbar, layout)
      dashboard/       # Monthly calendar + analytics
      day/             # Hourly day view per dentist
      kanban/          # Drag-and-drop kanban board
      portal/          # Patient portal
      admin/           # Admin user management panel
    api/
      appointments/    # GET (list), POST (create), PATCH/DELETE (by id)
      auth/
        register/      # POST — create account with email verification
        verify-email/  # GET — redeem verification token
      cron/
        reminders/     # GET — send day-before WhatsApp reminders
      dentists/        # Dentist listing and management
      patients/        # Patient listing
      users/           # User management (admin)
      stats/           # Dashboard analytics data
  components/
    ui/                # Shared primitives (Navbar, StatusBadge, dialog, sonner)
    calendar/          # MonthlyCalendar, WeekCalendar, DayDetailView
    kanban/            # KanbanBoard, KanbanColumn, KanbanCard
    appointments/      # AppointmentModal, NewAppointmentModal, AppointmentDetailPanel
    dashboard/         # DashboardAnalytics (Recharts)
  lib/
    prisma.ts          # Prisma client singleton (PrismaAdapter + PrismaPg)
    auth-helpers.ts    # requireAuth() server helper
    rate-limit.ts      # In-memory sliding window rate limiter
    time.ts            # Server-time hook utilities
    validations/
      auth.ts          # Zod schemas (registerSchema, loginSchema)
  services/
    notification.ts    # Evolution API (WhatsApp) integration
    email.ts           # Email service (mock in dev, Resend/SendGrid stub for prod)
  hooks/
    useServerTime.ts   # Polling hook for current server time
  types/
    index.ts           # Shared TS types, STATUS_COLORS, VALID_TRANSITIONS
  __tests__/
    unit/              # registerValidation, statusTransitions
    components/        # StatusBadge, KanbanCard
prisma/
  schema.prisma        # Data model (User, Patient, Dentist, Appointment, Notification)
  seed.ts              # Sample data (admin, dentists, receptionist, patients, appointments)
  migrations/          # Prisma migration history
```
