/**
 * AttendAI - Backend Industry-Grade Environment Resolver
 */

const isProduction = process.env.NODE_ENV === "production" || !!process.env.RENDER;

// Final production URLs for Render deployment
const PROD_FRONTEND_URL = "https://attend-ai-smart-erp.vercel.app";
const PROD_BACKEND_URL = "https://attendai-backend-ynnd.onrender.com";

export const ENV = {
  isProduction,

  // Backend's own URL (used for Better Auth baseURL)
  get backendUrl() {
    if (isProduction) return process.env.BETTER_AUTH_URL || PROD_BACKEND_URL;
    return "http://localhost:3000"; // Note: Better Auth expects the frontend URL here usually
  },

  // The actual frontend URL (for CORS and trusted origins)
  get frontendUrl() {
    if (isProduction) return process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || PROD_FRONTEND_URL;
    return "http://localhost:3000";
  },

  // Internal security token
  get internalToken() {
    const token = process.env.INTERNAL_TOKEN;
    if (isProduction && !token) {
      console.warn("⚠️ [SECURITY] INTERNAL_TOKEN is missing in backend production environment!");
    }
    return token || "smart-erp-internal-communication-secret-2024";
  }
};
