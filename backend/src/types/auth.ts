export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  name?: string;
  firebaseUid?: string;
  isProfileComplete?: boolean;
}
