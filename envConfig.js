import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

export const DIRECTUS_API = process.env.DIRECTUS_API;
export const DIRECTUS_ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
export const DIRECTUS_ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;