import axios from "axios";

// Determine API base URL based on environment
const getAPIBaseURL = () => {
  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
    console.log("[API] Using configured API URL:", url);
    return url;
  }

  // Fallback to localhost for development
  if (typeof window !== "undefined" && !process.env.NODE_ENV || process.env.NODE_ENV === "development") {
    console.log("[API] Using localhost fallback (development)");
    return "http://localhost:5000";
  }

  // For production without env var, extract from window.location
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const apiUrl = `${protocol}//${hostname}:5000`;
    console.log("[API] Using derived API URL:", apiUrl);
    return apiUrl;
  }

  return "http://localhost:5000";
};

const API_BASE_URL = getAPIBaseURL();

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// ✅ Request interceptor - add auth token
API.interceptors.request.use((req) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      req.headers = req.headers || {};
      req.headers.Authorization = `Bearer ${token}`;
    }
  }
  return req;
});

// ✅ Response interceptor - handle errors
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.error || err.message;

    // Log errors for debugging
    console.error("[API Error]", {
      status,
      message,
      url: err.config?.url,
    });

    // Handle auth errors
    if (status === 401 || status === 403) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      }
    }

    return Promise.reject(err);
  }
);

export default API;