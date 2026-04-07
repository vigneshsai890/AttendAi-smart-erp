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

export const useSession = () => {
  const context = useContext(AuthContext);
  return {
    data: context.user ? { user: context.user } : null,
    firebaseUser: context.firebaseUser,
    status: context.loading ? "loading" : context.user ? "authenticated" : "unauthenticated",
  };
};

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      console.log("[AUTH_DEBUG] Firebase Auth State Changed:", currentFirebaseUser?.email);
      setFirebaseUser(currentFirebaseUser);
      
      if (currentFirebaseUser) {
        setLoading(true);
        // Now fetch the MongoDB profile using the Firebase token
        try {
          const token = await currentFirebaseUser.getIdToken();
          console.log("[AUTH_DEBUG] Fetching MongoDB profile...");
          // We need an API route to securely fetch the MongoDB user profile 
          // based on the Firebase token.
          const res = await fetch("/api/auth/me", {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          
          if (res.ok) {
            const data = await res.json();
            console.log("[AUTH_DEBUG] MongoDB Profile sync success:", data.user?.email);
            setUser(data.user);
          } else {
            console.error("[AUTH_DEBUG] Failed to sync Firebase user with MongoDB profile. Status:", res.status);
            setUser(null);
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
