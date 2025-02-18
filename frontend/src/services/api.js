import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/auth";

// Create an Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add Authorization token (if available)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication API functions
const authService = {
  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData); // ✅ Ensure backend route matches
      return response.data;
    } catch (error) {
      throw error.response?.data || "Registration failed";
    }
  },

  login: async (userData) => {
    try {
      const response = await api.post("/auth/login", userData); // ✅ Ensure backend route matches
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || "Login failed";
    }
  },

  logout: () => {
    localStorage.removeItem("token");
  },
};

export default authService;
