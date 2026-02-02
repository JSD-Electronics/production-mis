export const IS_PROD = process.env.NODE_ENV === "production";

export const API_BASE_URL = IS_PROD
    ? process.env.NEXT_PUBLIC_API_URL_PROD
    : process.env.NEXT_PUBLIC_API_URL_DEV;

export const BASE_URL = IS_PROD
    ? process.env.NEXT_PUBLIC_BASE_URL_PROD
    : process.env.NEXT_PUBLIC_BASE_URL_DEV;

// Use relative path for local proxy to bypass CORS
export const CONFIG = {
    API_BASE_URL: "/api",
    BASE_URL: IS_PROD
        ? process.env.NEXT_PUBLIC_BASE_URL_PROD
        : process.env.NEXT_PUBLIC_BASE_URL_DEV || "http://localhost:8000",
    ENVIRONMENT: IS_PROD ? "production" : "development"
};
