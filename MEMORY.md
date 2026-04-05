# Session Memory: AttendAi-smart-erp

## Project State (as of 5 April 2026)
- **Architecture**: Decoupled Next.js 16.2.1 (Frontend) + Express/MongoDB (Backend).
- **Recent Fixes**: 
  - Wildcard origin trusting for Better Auth/CORS.
  - Cookie-based middleware to resolve edge-runtime crashes.
  - Role protection moved to client layouts to avoid redirect loops.
- **Current Issue**: Users report a "reload" error during login. Root cause identified as conflicting auth providers (NextAuth and Better Auth co-existing).
- **Recent Findings**:
  - `AuthProvider.tsx` and `Navbar.tsx` are still using `next-auth/react` while the rest of the app uses `better-auth`.
  - `src/proxy.ts` exists but is not being called because `src/middleware.ts` is missing.
  - Redirection loops or invalid session states are likely caused by `NextAuth`'s `SessionProvider` trying to find a session that doesn't exist in its format.

## Tasks & Investigations
- [x] Investigate "reload" error during login. (Root cause: Auth conflict)
- [x] Remove `next-auth` dependency and replace all imports with `better-auth` / `authClient`.
- [x] Create `src/middleware.ts` to call `proxy.ts`.
- [x] Update `AuthProvider.tsx` to a simple wrapper.
- [x] Fix `Navbar.tsx` to use `authClient` for session and sign out.
- [x] Improve `ENV.frontendUrl` robustness to avoid origin mismatch errors.
