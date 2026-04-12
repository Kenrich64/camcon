import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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