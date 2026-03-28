# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Next.js version note

This project uses **Next.js 16.2.1** with **React 19**. APIs, conventions, and file structure may differ from what you know. Before writing code, check `node_modules/next/dist/docs/` for the relevant guide and heed any deprecation notices.

## Commands

```bash
npm run dev      # Start dev server on 0.0.0.0:3000
npm run build    # Production build
npm run lint     # ESLint (next core-web-vitals + typescript rules)

# Database
npx prisma migrate dev   # Apply migrations
npx prisma generate      # Regenerate Prisma client after schema changes
npx prisma db seed       # Seed with tsx prisma/seed.ts
npx prisma studio        # GUI to inspect DB
```

## Architecture

**Smart ERP** is a college management system built with Next.js (App Router), Prisma ORM, PostgreSQL, and NextAuth.js. It manages attendance, courses, exams, and notifications for three roles: `ADMIN`, `FACULTY`, and `STUDENT`.

### Auth & routing

- NextAuth with JWT sessions + credentials provider (`src/lib/auth.ts`)
- Optional TOTP 2FA via `otplib`; login throws `"2FA_REQUIRED"` if enabled but no token supplied
- Middleware in `src/middleware.ts` enforces role-based route protection:
  - `/admin/*` → ADMIN only
  - `/faculty/*` → FACULTY or ADMIN
  - `/student/*` → STUDENT or ADMIN
  - `/settings/*` → any authenticated user
- `session.user` is extended with `id` and `role` (declared in `src/types/next-auth.d.ts`)

### Data model (`prisma/schema.prisma`)

Core entities and their relationships:
- **User** → has one `Student` or `Faculty` profile (role string: `ADMIN | HOD | FACULTY | STUDENT`)
- **Department** → has many Students, Faculty, Courses, Sections
- **Section** → groups students by department + year + batchYear (e.g. "CSE A")
- **Course** → belongs to Department; types: `LECTURE | LAB | TUTORIAL | PRACTICAL | WORKSHOP | STUDIO`
- **CourseAssignment** → links Faculty to Course per academic year/semester
- **Enrollment** → links Student to Course; tracks grade + status
- **Schedule** → maps Course+Section to a day/time/room slot
- **AttendanceSession** → created by faculty per class; supports QR codes and geo-fencing (lat/lon/radius)
- **AttendanceRecord** → per-student record in a session; includes `riskScore` and `flagged` for proxy detection
- **ProxyAlert** → raised on suspicious attendance; types: `TIMING | LOCATION | BUDDY_PATTERN | DEVICE | VELOCITY`
- **Exam / ExamResult** — exam tracking with grade/marks
- **Notification, AuditLog** — system-wide messaging and action logging

### API routes (`src/app/api/`)

| Prefix | Purpose |
|---|---|
| `auth/[...nextauth]` | NextAuth handler |
| `auth/2fa/` | 2FA setup/verify |
| `admin/courses`, `admin/departments`, `admin/faculty`, `admin/students` | Admin CRUD |
| `attendance/session/` | Faculty creates/manages sessions |
| `attendance/mark/` | Students mark attendance (QR + geo) |
| `student/dashboard/`, `student/reports/` | Student data views |
| `faculty/dashboard/` | Faculty data views |
| `network-ip/` | Utility for capturing client IP |

### Page routes

- `/login` — credential + optional 2FA login
- `/admin/` — admin dashboard (2FA setup at `/admin/2fa-setup`)
- `/faculty/dashboard` — faculty view
- `/student/dashboard` — student view
- `/settings` — user settings
- `/attend` — QR-based attendance marking page

### Key shared utilities

- `src/lib/prisma.ts` — singleton PrismaClient (global cache in dev)
- `src/lib/auth.ts` — `authOptions` (import this in API routes with `getServerSession`)
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `src/components/` — `Navbar`, `Toast`, `Background` shared UI components

### Environment variables

| Variable | Purpose |
|---|---|
| `PRISMA_DATABASE_URL` | Pooled PostgreSQL connection (Prisma) |
| `DATABASE_URL` | Direct PostgreSQL connection (migrations) |
| `NEXTAUTH_SECRET` | JWT signing secret |
| `NEXTAUTH_URL` | App base URL |
