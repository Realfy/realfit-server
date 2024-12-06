import dotenv from "dotenv";

const developmentEnvironment = true;

if (developmentEnvironment) dotenv.config({ path: ".env" });
else dotenv.config({ path: ".env.production" });

export const DIRECTUS_API = process.env.DIRECTUS_API;
export const DIRECTUS_ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
export const DIRECTUS_ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;
export const DIRECTUS_STATIC_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;
export const PORT = process.env.PORT || 5432;

// Firestore config
export const FIRESTORE_CONFIG = JSON.parse(process.env.FIRESTORE_CONFIG);

// JWT Tokens
export const JWT_ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET;
export const JWT_REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET;

// OpenAI Key
console.log("OpenAI API Key: ", process.env.OPENAI_API_KEY);
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
