# Session Memory: AttendAi-smart-erp

## Session Date: 7 April 2026
**Status**: Onboarding "User Not Found" Final Sync.

## 🚀 Objective: Resolve Persistent "User Not Found" Error
Addressed the root cause of the onboarding failure by ensuring the `userId` and user context are correctly propagated and trustable across the entire stack.

## ✅ Actions Taken
1.  **Header Propagation**:
    - Updated `src/app/api/student/onboard/route.ts` to include the `x-user-data` header when proxying the onboarding request to the Express backend. This ensures the backend `universalAuthMiddleware` can identify the user even if database lookups are slow or inconsistent.
2.  **Collection Alignment**:
    - Confirmed all Mongoose models (`User`, `Student`, `Faculty`) and direct MongoDB calls (in `signup` and `onboarding`) are targeting the singular `'user'` collection.
3.  **Debug Trace Enabled**:
    - Added `console.log` statements in the backend `/onboard` route to trace the incoming `userId` and its presence in the database.
4.  **Database Consistency Check**:
    - Identified a critical risk: ensure `MONGO_URI` is identical in both Vercel (frontend) and Render (backend). If they point to different databases, signups on the frontend will never be visible to the backend.

## 🛠 Project Architecture (Synchronized)
- **Identity Provider**: NextAuth (JWT Strategy).
- **Communication**: Trusted internal proxy headers (`x-user-data`) + Shared MongoDB (`user` collection).

## 📋 Future Tasks / Considerations
- [ ] **Action Required**: Verify that the `MONGO_URI` environment variable in Vercel matches the one in Render exactly (including the DB name at the end).
- [ ] Monitor Render logs for the `📡 [ONBOARD] Received userId:` log to confirm the ID matches the one in the MongoDB `user` collection.
