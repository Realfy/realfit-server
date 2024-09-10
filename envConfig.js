import dotenv from "dotenv";

const developmentEnvironment = true;

if(developmentEnvironment)
    dotenv.config({ path: ".env.development" });
else
    dotenv.config({ path: ".env.production" });

export const DIRECTUS_API = process.env.DIRECTUS_API;
export const DIRECTUS_ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
export const DIRECTUS_ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;
export const DIRECTUS_STATIC_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;
export const PORT = process.env.PORT || 5432