"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

// Define a unified User type that matches what the app expects
export type SessionUser = {
  id: string; // The MongoDB ID
  firebaseUid: string;
  email: string;
  name: string;
  role: string;
  isProfileComplete: boolean;
};

interface AuthContextType {
  user: SessionUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
});

/**
 * Get the current Firebase ID token for API calls.
 * Returns null if user is not signed in.
 */
export async function getAuthToken(): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  try {
    return await currentUser.getIdToken();
  } catch (error) {
    console.error("[AUTH] Failed to get ID token:", error);
    return null;
  }
}

/**
 * Helper to create auth headers for fetch calls.
 * Usage: const headers = await getAuthHeaders();
 *        fetch("/api/something", { headers })
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  if (!token) return { "Content-Type": "application/json" };
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

export const useSession = () => {
  const context = useContext(AuthContext);
  return {
    data: context.user ? { user: context.user } : null,
    firebaseUser: context.firebaseUser,
    loading: context.loading,
    status: context.loading 
      ? "loading" 
      : (context.user || context.firebaseUser) 
        ? "authenticated" 
        : "unauthenticated",
  };
};

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.error("[AUTH_DEBUG] Firebase Auth is not initialized properly!");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      console.log("[AUTH_DEBUG] Firebase Auth State Changed:", currentFirebaseUser?.email);
      setFirebaseUser(currentFirebaseUser);
      
      if (currentFirebaseUser) {
        setLoading(true);
        try {
          const token = await currentFirebaseUser.getIdToken();
          console.log("[AUTH_DEBUG] Fetching MongoDB profile...");
          
          // Add a safety controller to avoid infinite hang
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          try {
            const res = await fetch("/api/auth/me", {
              headers: {
                "Authorization": `Bearer ${token}`
              },
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (res.ok) {
              const data = await res.json();
              console.log("[AUTH_DEBUG] MongoDB Profile sync success:", data.user?.email);
              setUser(data.user);
            } else {
              const errData = await res.json().catch(() => ({}));
              console.error("[AUTH_DEBUG] Failed to sync Firebase user with MongoDB profile. Status:", res.status, errData);
              // If 404 — user just signed up via Firebase and the MongoDB record may not exist yet.
              // This is expected during signup flow — the signup page will create the record.
              if (res.status === 404) {
                console.log("[AUTH_DEBUG] User not in MongoDB yet (new signup). Setting minimal user from Firebase.");
                setUser(null); // Keep null — signup page will handle creation
              } else {
                setUser(null);
              }
            }
          } catch (fetchErr: any) {
            if (fetchErr.name === 'AbortError') {
              console.error("[AUTH_DEBUG] Profile fetch timed out after 10s");
            } else {
              console.error("[AUTH_DEBUG] Profile fetch error:", fetchErr);
            }
            setUser(null);
          } finally {
            clearTimeout(timeoutId);
          }
        } catch (error) {
          console.error("[AUTH_DEBUG] Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
      console.log("[AUTH_DEBUG] Auth initialization complete. Loading: false");
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
