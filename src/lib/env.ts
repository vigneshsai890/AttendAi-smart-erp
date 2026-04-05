/**
 * AttendAI - Industry-Grade Environment Resolver
 * Manages production vs development URLs for Better Auth and Backend proxying.
 */

const isProduction = process.env.NODE_ENV === "production" || !!process.env.RENDER;

// Final production URLs for Render deployment
const PROD_FRONTEND_URL = "https://attendai-smart-erp.onrender.com";
const PROD_BACKEND_URL = "https://attendai-backend-ynnd.onrender.com";

export const ENV = {
  isProduction,

  // Frontend URL (used for Better Auth baseURL and redirect origins)
  get frontendUrl() {
    // Vercel Preview/System URLs
    if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

    if (isProduction) return process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || PROD_FRONTEND_URL;
    
    // In client-side development, if window is available, we can use it, but only as a fallback
    if (typeof window !== "undefined" && !isProduction) return window.location.origin;

    return "http://localhost:3000";
  },

  // Backend URL (used for API proxying)
  get backendUrl() {
    if (isProduction) return process.env.BACKEND_URL || PROD_BACKEND_URL;
    return "http://127.0.0.1:5001";
  },

  // Internal security token
  get internalToken() {
    const token = process.env.INTERNAL_TOKEN;
    if (isProduction && !token) {
      console.error("🚨 [SECURITY WARNING] INTERNAL_TOKEN is missing in production environment. Ensure this is set in your Render dashboard.");
    }
    return token || "smart-erp-internal-communication-secret-2024";
  }
};
