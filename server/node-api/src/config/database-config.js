"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Define MongoDB URL with a fallback
        const mongoUrl = process.env.MONGODB_URI;
        // Add strict type checking for the URL
        if (!mongoUrl) {
            throw new Error('MongoDB URI is not defined');
        }
        yield mongoose_1.default.connect(mongoUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Database is connected");
    }
    catch (error) {
        // Improved error handling with type safety
        if (error instanceof Error) {
            console.log("MongoDB connection error:", error.message);
        }
        else {
            console.log("An unknown error occurred");
        }
        process.exit(1); // Exit process on connection failure
    }
});
exports.default = connectDB;
