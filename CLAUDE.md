# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Next.js version note

This project uses **Next.js 16.2.1** with **React 19**. APIs, conventions, and file structure may differ from what you know. Before writing code, check `node_modules/next/dist/docs/` for the relevant guide and heed any deprecation notices.

## Commands

```bash
npm run dev      # Start dev server on 0.0.0.0:3000
npm run build    # Production build
npm run lint     # ESLint (next core-web-vitals + typescript rules)

# Backend (Express/MongoDB) — run from backend/ directory
cd backend && npm run dev    # Start backend dev server on port 5000
cd backend && npm run build  # Compile TypeScript
```

## Architecture

**Smart ERP** is a college management system with a **decoupled architecture**:
- **Frontend**: Next.js (App Router) + NextAuth.js — handles auth and proxies API calls
- **Backend**: Express + Mongoose + MongoDB + Socket.io — handles all DB operations
- The Next.js API routes act as **auth-aware proxies**: they verify the session via NextAuth, then forward requests to the Express backend at `http://localhost:5000`

### Auth & routing

- NextAuth with JWT sessions + credentials provider (`src/lib/auth.ts`)
- Auth calls Express backend at `/api/auth/login` for credential verification
- Optional TOTP 2FA via `otplib` (handled by backend)
- Proxy in `src/proxy.ts` enforces role-based route protection:
  - `/admin/*` → ADMIN only
  - `/faculty/*` → FACULTY or ADMIN
  - `/student/*` → STUDENT or ADMIN
  - `/settings/*` → any authenticated user
- `session.user` is extended with `id` and `role` (declared in `src/types/next-auth.d.ts`)

### Data model (MongoDB/Mongoose — `backend/src/models/`)

Core entities:
- **User** — name, email, role (ADMIN|FACULTY|STUDENT), passwordHash, 2FA fields
- **Student** — rollNumber, regNumber, year, semester, linked to User/Department/Section
- **Faculty** — employeeId, designation, linked to User/Department
- **Department** — code, name, description
- **Section** — name, year, batchYear, linked to Department
- **Course** — code, name, credits, courseType, department
- **CourseAssignment** — links Faculty to Course per academic year/semester
- **Enrollment** — links Student to Course; tracks status + grade
- **Schedule** — maps Course+Section to a day/time/room slot
- **AttendanceSession** — created by faculty; supports QR codes and geo-fencing
- **AttendanceRecord** — per-student record; includes riskScore and flagged
- **ProxyAlert** — raised on suspicious attendance (TIMING|LOCATION|BUDDY_PATTERN|DEVICE)
- **Exam / ExamResult** — exam tracking with grade/marks
- **Notification** — system-wide messaging

### API routes (`src/app/api/`) — Auth-aware proxy layer

All API routes authenticate via `getServerSession(authOptions)` then proxy to the Express backend using `@/lib/backend` (axios).

| Prefix | Backend target | Purpose |
|---|---|---|
| `auth/[...nextauth]` | — | NextAuth handler (no proxy) |
| `auth/2fa/` | `/dashboard/2fa/*` | 2FA setup/verify |
| `admin/*` | `/admin/*` | Admin CRUD |
| `attendance/session/*` | `/attendance/session/*` | Session lifecycle |
| `attendance/mark` | `/attendance/mark` | Mark attendance (QR + geo) |
| `attendance/live` | `/attendance/live` | Live attendance feed |
| `student/dashboard` | `/dashboard/student` | Student dashboard |
| `faculty/dashboard` | `/dashboard/faculty` | Faculty dashboard |
| `faculty/reports` | `/dashboard/faculty/reports` | CSV export |
| `network-ip/` | — | Client IP utility (no proxy) |

### Page routes

- `/login` — credential + optional 2FA login
- `/admin/` — admin dashboard (2FA setup at `/admin/2fa-setup`)
- `/faculty/dashboard` — faculty view
- `/student/dashboard` — student view
- `/settings` — user settings
- `/attend` — QR-based attendance marking page

### Key shared utilities

- `src/lib/backend.ts` — axios instance pointing to Express backend (BACKEND_URL)
- `src/lib/auth.ts` — `authOptions` (NextAuth config, calls backend for login)
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `src/lib/rate-limit.ts` — in-memory sliding window rate limiter
- `src/lib/socket.ts` — Socket.io client-side utilities
- `src/components/` — `Navbar`, `Toast`, `Background` shared UI components

### Environment variables

| Variable | Purpose |
|---|---|
| `NEXTAUTH_SECRET` | JWT signing secret |
| `NEXTAUTH_URL` | App base URL (default: http://localhost:3000) |
| `BACKEND_URL` | Express backend URL (default: http://localhost:5000) |
| `MONGO_URI` | MongoDB connection (backend, default: mongodb://127.0.0.1:27017/attendance_db) |
