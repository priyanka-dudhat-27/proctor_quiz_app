import axios from "axios";
import { get } from "mongoose";
import { getAllQuizzes } from "../../../backend/controllers/quizController";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Create an Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token for authentication
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

const authService = {
  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Registration failed";
    }
  },

  login: async (userData) => {
    try {
      const response = await api.post("/auth/login", userData);
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

const quizService = {
  createQuiz: async (quizData) => {
    try {
      const response = await api.post("/quiz/create-quiz", quizData);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Quiz creation failed";
    }
  },

getAllQuizzes: async () => {
    try{
      const response = await api.get("/quiz/all");
      return response;
    } catch (error) {
      throw error.response?.data || "Quiz creation failed";
    }
  },
};    
export { authService, quizService };
