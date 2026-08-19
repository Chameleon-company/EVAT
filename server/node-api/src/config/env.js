"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load root .env
dotenv_1.default.config({
    path: node_path_1.default.resolve(__dirname, "../../../../.env"),
});
// Then load workspace-specific .env, overriding duplicates
dotenv_1.default.config({
    path: node_path_1.default.resolve(__dirname, "../../.env"),
    override: true,
});
exports.env = {
    PORT: (_a = process.env.PORT) !== null && _a !== void 0 ? _a : "8080",
    DOMAIN_URL: (_b = process.env.DOMAIN_URL) !== null && _b !== void 0 ? _b : "http://localhost",
    MONGODB_USERNAME: process.env.MONGODB_USERNAME,
    MONGODB_PASSWORD: process.env.MONGODB_PASSWORD,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
};
