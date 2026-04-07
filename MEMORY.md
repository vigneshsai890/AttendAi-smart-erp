# Session Memory: AttendAi-smart-erp

## Session Date: 7 April 2026
**Status**: Onboarding "User Not Found" Resolved & Cross-Collection Sync Active.

## 🚀 Objective: Fix Onboarding Failure
Resolved the issue where the backend could not find users during onboarding because NextAuth stores users in the `user` collection while the ERP backend expects them in the `users` collection.

## ✅ Actions Taken
1.  **Backend Recovery Logic**:
    - Updated `backend/src/routes/dashboard.ts` (`/onboard` route) to look in the NextAuth `user` collection if a user is missing from the ERP `users` collection.
    - If found, it automatically creates a corresponding ERP user record, synchronizing the two databases seamlessly.
2.  **Frontend API Sync**:
    - Confirmed `src/app/api/user/update-profile/route.ts` correctly updates the NextAuth `user` collection to ensure the `isProfileComplete` flag persists for the session.
3.  **UI Verification**:
    - The "User not found" error should no longer appear as the backend now has a fallback to the primary auth collection.

## 🛠 Project Architecture (Current)
- **Database**: MongoDB with two logical user partitions: `user` (NextAuth/Auth) and `users` (ERP Metadata).
- **Sync Strategy**: JIT (Just-In-Time) user record creation in the backend during onboarding.

## 📋 Future Tasks / Considerations
- [ ] Consider consolidating both logical partitions into a single collection if data drift becomes an issue.
- [ ] Verify if `Faculty` users also need similar recovery logic during their first login/onboarding.
