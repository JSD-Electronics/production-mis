import axios from "axios";
import { CONFIG } from "../config";

export const apiCore = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "If-None-Match": "",
    "If-Modified-Since": "0",
  },
});

apiCore.interceptors.request.use(
  (config) => {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return config;
    }
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiCore.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return Promise.reject(error);
    }
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userDetails");
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

export const unwrap = (response) => response?.data;

