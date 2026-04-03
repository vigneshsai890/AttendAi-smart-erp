import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { ENV } from "./env";

const BACKEND_URL = ENV.backendUrl;

export const backend: AxiosInstance = axios.create({
  baseURL: BACKEND_URL + "/api",
  timeout: 15000, // Increased timeout for production reliability
  headers: {
    "Content-Type": "application/json",
    "X-Internal-Token": ENV.internalToken,
  },
});

// ULTRAMAX Retry Logic for ECONNREFUSED (Common on Render cold starts)
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1s

backend.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

    // Retry on network errors or transient 502/503 statuses during deploy
    const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED');
    const isRetryableStatus = error.response?.status === 503 || error.response?.status === 502;

    if ((isNetworkError || isRetryableStatus) && (config._retryCount || 0) < MAX_RETRIES) {
      config._retryCount = (config._retryCount || 0) + 1;

      const delay = INITIAL_RETRY_DELAY * Math.pow(2, config._retryCount - 1);
      console.warn(`[BACKEND] Connection failed (${error.code || error.response?.status}). Retrying in ${delay}ms... (Attempt ${config._retryCount})`);

      await new Promise(resolve => setTimeout(resolve, delay));
      return backend(config);
    }

    // Production Error Logging
    if (error.response) {
      console.error(`❌ [BACKEND ERROR] ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error(`❌ [BACKEND NO RESPONSE] Target: ${BACKEND_URL}. Check if backend service is live on Render.`);
    } else {
      console.error(`❌ [BACKEND CONFIG ERROR] ${error.message}`);
    }

    return Promise.reject(error);
  }
);
