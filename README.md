# Sistema de Agendamento — Clínica Dental

Full-stack dentist clinic booking management system built with Next.js, PostgreSQL, and Tailwind CSS. University project.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router, TypeScript) |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v5 (credentials + JWT) |
| Styling | Tailwind CSS v4 |
| Notifications | Evolution API (WhatsApp) |
| Drag & Drop | dnd-kit |
| Testing | Jest + React Testing Library |
| CI | GitHub Actions |

## Features

- **Monthly Calendar** — appointment density view with status color-coding, filter by dentist
- **Day View** — Google Calendar-style hourly grid per dentist, click to view/update appointments
- **Kanban Board** — drag-and-drop status management (Requested → Scheduled → In Progress → Completed / Cancelled)
- **Patient Portal** — patients request appointments, track status
- **Admin Panel** — user management, role assignment, activation/deactivation
- **WhatsApp Notifications** — confirmation, status updates, reminders via Evolution API
- **Role-based Access** — ADMIN / DENTIST / RECEPTIONIST / PATIENT with middleware enforcement

## Local Setup

### Prerequisites

- Node.js 20+
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

# Optional — WhatsApp notifications
EVOLUTION_API_URL="http://localhost:8080"
EVOLUTION_API_KEY="your-api-key"
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

## Running Tests

```bash
npm test                                    # All tests
npm test -- --testPathPattern=StatusBadge   # Single file
npm run test:coverage                       # With coverage report
```

## Database Commands

```bash
npm run db:generate    # Regenerate Prisma client after schema changes
npm run db:migrate     # Run pending migrations (dev)
npm run db:seed        # Reseed sample data
npm run db:studio      # Open Prisma Studio GUI
```

## CI Pipeline

GitHub Actions runs on every push/PR to `main`:

1. **Install** dependencies
2. **Generate** Prisma client
3. **Lint** with ESLint
4. **Test** with Jest
5. **Build** production bundle

See `.github/workflows/ci.yml`.

## Project Structure

```
src/
  app/
    (auth)/        # Login and register pages
    (app)/         # Authenticated app shell with Navbar
      dashboard/   # Monthly calendar
      day/         # Hourly day view
      kanban/      # Kanban board
      portal/      # Patient portal
      admin/       # Admin panel
    api/           # REST API routes
  components/
    ui/            # Shared components (Navbar, StatusBadge)
    calendar/      # MonthlyCalendar
    kanban/        # KanbanBoard, KanbanColumn, KanbanCard
    appointments/  # AppointmentModal
  lib/             # Prisma client, auth helpers
  services/        # notification.ts (WhatsApp / Evolution API)
  types/           # Shared TypeScript types and constants
  __tests__/       # Unit and component tests
prisma/
  schema.prisma    # Data model
  seed.ts          # Sample data
```
