import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5001";

export const backend: AxiosInstance = axios.create({
  baseURL: BACKEND_URL + "/api",
  timeout: 10000, // 10s timeout for better responsiveness
  headers: {
    "Content-Type": "application/json",
    "X-Internal-Token": process.env.INTERNAL_TOKEN || "smart-erp-internal-communication-secret-2024",
  },
});

// ULTRAMAX Retry Logic for ECONNREFUSED
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1s

backend.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

    // If it's a connection error (like ECONNREFUSED) or a 503, and we haven't exceeded max retries
    const isNetworkError = !error.response && error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
    const isConnRefused = error.message.includes('ECONNREFUSED') || error.message.includes('Network Error');
    const isRetryableStatus = error.response?.status === 503 || error.response?.status === 502;

    if ((isNetworkError || isConnRefused || isRetryableStatus) && (config._retryCount || 0) < MAX_RETRIES) {
      config._retryCount = (config._retryCount || 0) + 1;

      const delay = INITIAL_RETRY_DELAY * Math.pow(2, config._retryCount - 1);
      console.warn(`[BACKEND] Connection failed (${error.code}). Retrying in ${delay}ms... (Attempt ${config._retryCount})`);

      await new Promise(resolve => setTimeout(resolve, delay));
      return backend(config);
    }

    // ULTRAMAX: Detailed Error Context
    if (error.response) {
      console.error(`[BACKEND ERROR] ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error(`[BACKEND NO RESPONSE] Connection refused at ${BACKEND_URL}. Check if backend is running on port 5001.`);
    } else {
      console.error(`[BACKEND CONFIG ERROR] ${error.message}`);
    }

    return Promise.reject(error);
  }
);
