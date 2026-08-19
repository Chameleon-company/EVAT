"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const adminSchema = new mongoose_1.default.Schema({
    username: {
        type: String,
        default: 'admin',
    },
    password: {
        type: String,
        default: 'admin',
    },
    twoFactorCode: {
        type: String,
        default: null,
    },
    twoFactorCodeExpiry: {
        type: Date,
        default: null,
    },
    email: {
        type: String,
        default: 'admin@example.com',
        lowercase: true,
        trim: true,
    },
});
exports.default = mongoose_1.default.model('Admin', adminSchema);
