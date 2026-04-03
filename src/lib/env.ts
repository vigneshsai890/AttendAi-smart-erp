/**
 * AttendAI - Industry-Grade Environment Resolver
 * Manages production vs development URLs for Better Auth and Backend proxying.
 */

const isProduction = process.env.NODE_ENV === "production" || !!process.env.RENDER;

// Final production URLs for Render deployment
const PROD_FRONTEND_URL = "https://attend-ai-smart-erp.onrender.com";
const PROD_BACKEND_URL = "https://attendai-backend-ynnd.onrender.com";

export const ENV = {
  isProduction,

  // Frontend URL (used for Better Auth baseURL and redirect origins)
  get frontendUrl() {
    if (isProduction) return process.env.BETTER_AUTH_URL || PROD_FRONTEND_URL;
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
      console.warn("⚠️ [SECURITY] INTERNAL_TOKEN is missing in production environment!");
    }
    return token || "smart-erp-internal-communication-secret-2024";
  }
};
