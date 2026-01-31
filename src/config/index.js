export const IS_PROD = typeof window !== "undefined"
    ? window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    : process.env.NODE_ENV === "production";

export const API_BASE_URL = IS_PROD
    ? process.env.NEXT_PUBLIC_API_URL_PROD
    : process.env.NEXT_PUBLIC_API_URL_DEV;

export const BASE_URL = IS_PROD
    ? process.env.NEXT_PUBLIC_BASE_URL_PROD
    : process.env.NEXT_PUBLIC_BASE_URL_DEV;

// Default fallbacks if env variables are missing
export const CONFIG = {
    API_BASE_URL: API_BASE_URL || "http://localhost:8000/api",
    BASE_URL: BASE_URL || "http://localhost:8000",
    ENVIRONMENT: IS_PROD ? "production" : "development"
};
