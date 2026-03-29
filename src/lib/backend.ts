import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

export const backend = axios.create({
  baseURL: BACKEND_URL + "/api",
  timeout: 30000,
});
