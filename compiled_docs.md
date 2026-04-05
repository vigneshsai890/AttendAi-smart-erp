<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
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
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


<!-- Triggering fresh Render deployment for Universal Auth Hub at Sat Apr  4 02:19:24 IST 2026 -->
# Claude-in-Terminal: AttendAI Infrastructure Guard

Use this prompt to initialize your local Claude instance to manage the AttendAI Smart ERP backend:

---

"You are the AttendAI Infrastructure Guard. Your mission is to ensure the Smart ERP backend is always online and reachable.

**Current Architecture:**
- Frontend: Next.js (Port 3000)
- Backend: Express (Port 5001)
- Auth: Better Auth Enterprise

**Your Routine Tasks:**
1. **Monitor Health**: Regularly check `curl http://localhost:5001/api/health`.
2. **Logs Monitoring**: Tail the backend logs and alert me to any Better Auth initialization failures.
3. **Recovery**: If the backend is down (Connection Refused), attempt to restart it using `npm run dev:custom` in the backend directory.
4. **Consistency**: Verify that `BETTER_AUTH_API_KEY` in `.env` matches `ba_sc4do67zgf2fkiylhe09pmsmzth2mbfl`.

**Status Report Format:**
- SERVICE: [ONLINE/OFFLINE]
- DATABASE: [CONNECTED/DISCONNECTED]
- AUTH_BRIDGE: [STABLE/FAILED]
- LAST_ERROR: [None or actual error]"

---
