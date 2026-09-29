import axios from "axios";
import { getSecureItem } from "../utils/storage";

// Base API URL from environment variable EXPO_PUBLIC_API_URL
// Fallback to local machine IP / localhost for development
const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Interceptor to attach Authorization Bearer token to all outgoing requests
api.interceptors.request.use(
  async (config) => {
    const token = await getSecureItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
