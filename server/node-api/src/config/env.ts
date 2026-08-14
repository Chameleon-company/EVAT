import path from "node:path";
import dotenv from "dotenv";

// Load root .env
dotenv.config({
  path: path.resolve(__dirname, "../../../../.env"),
});

// Then load workspace-specific .env, overriding duplicates
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
  override: true,
});

export const env = {
  PORT: process.env.PORT ?? "8080",

  DOMAIN_URL: process.env.DOMAIN_URL ?? "http://localhost",

  MONGODB_USERNAME: process.env.MONGODB_USERNAME!,
  MONGODB_PASSWORD: process.env.MONGODB_PASSWORD!,
  MONGODB_URI: process.env.MONGODB_URI!,

  JWT_SECRET: process.env.JWT_SECRET!,

  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY!,
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY!,
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS!,

  EMAIL_USER: process.env.EMAIL_USER!,
  EMAIL_PASS: process.env.EMAIL_PASS!,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL!,

  // Demand forecasting service to reach the Python backend, with a fallback to localhost
  PYTHON_API_URL: process.env.PYTHON_API_URL || "http://127.0.0.1:5000",
  DEMAND_API_URL: process.env.DEMAND_API_URL || process.env.PYTHON_API_URL || "http://127.0.0.1:5000",
};