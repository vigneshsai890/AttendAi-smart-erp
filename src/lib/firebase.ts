import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC-3yV4Daj2xshEtGZJVzNs2Z9IXz-rv9o",
  authDomain: "attend-ai-299fc.firebaseapp.com",
  projectId: "attend-ai-299fc",
  storageBucket: "attend-ai-299fc.firebasestorage.app",
  messagingSenderId: "594589016295",
  appId: "1:594589016295:web:9733c8137b0f0c53144242",
  measurementId: "G-Z4VSVBLCBY"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
