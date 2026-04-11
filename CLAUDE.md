s # CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev           # Start dev server (localhost:3000)
npm run build         # Production build
npm run lint          # ESLint
npm run format        # Prettier

# Testing
npm test                                          # All tests
npm test -- --testPathPattern=<file>             # Single test file

# Database (Prisma)
npx prisma migrate dev        # Apply migrations (dev)
npx prisma migrate deploy     # Apply migrations (prod)
npx prisma db seed            # Seed with sample data
npx prisma studio             # GUI database browser
npx prisma generate           # Regenerate Prisma client after schema changes
```

## Architecture

**Next.js 14+ App Router** (TypeScript) full-stack app with:
- **Database:** PostgreSQL + Prisma ORM (`prisma/schema.prisma`)
- **Auth:** NextAuth.js credentials provider, JWT sessions, role-based access control
- **Styling:** Tailwind CSS
- **Notifications:** Evolution API (WhatsApp) behind an abstraction in `src/services/notification.ts`
- **Testing:** Jest + React Testing Library
- **CI:** GitHub Actions — lint → test → build on push/PR

### Roles & Access

Four roles: `ADMIN`, `DENTIST`, `RECEPTIONIST`, `PATIENT`. Route protection is enforced in `middleware.ts` based on role from the JWT session. UI elements are conditionally shown/hidden by role.

- **ADMIN** — full access including user management and system settings
- **RECEPTIONIST** — full kanban + scheduling operations, register patients
- **DENTIST** — own calendar/schedule, update appointment status
- **PATIENT** — request appointments, view own history

### Appointment Status Flow

`REQUESTED` → `SCHEDULED` → `IN_PROGRESS` → `COMPLETED` | `CANCELLED`

Status changes trigger WhatsApp notifications via the notification service. The same status-to-color mapping is used across all views (calendar, kanban, day view).

### Notification Service

`src/services/notification.ts` is the single integration point for WhatsApp (Evolution API). Key methods:
- `sendAppointmentConfirmation(appointment)` — fired when status → SCHEDULED
- `sendStatusUpdate(appointment, newStatus)` — fired on any status transition
- `sendReminder(appointment)` — day-before reminder hook

If the Evolution API is unreachable, log the error and continue — never break the appointment flow.

## Folder Structure

```
src/
  app/
    (auth)/        # /login, /register pages
    dashboard/     # Monthly calendar view (main screen post-login)
    day/           # Day view — hourly schedule per dentist
    kanban/        # Kanban board — drag-and-drop status columns
    portal/        # Patient portal — request appointment, view own schedule
    admin/         # Admin panel — user/dentist management
    api/           # API route handlers
  components/      # Shared UI components
  lib/             # Prisma client singleton, NextAuth config, utility functions
  services/        # notification.ts and other external service integrations
  hooks/           # Custom React hooks
  types/           # Shared TypeScript types/interfaces
prisma/
  schema.prisma    # Data model
  seed.ts          # Sample data: admin, dentists, receptionist, patients, appointments
```

## Environment Variables

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
```
