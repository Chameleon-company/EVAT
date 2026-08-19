"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const UserSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"],
    },
    firstName: { type: String }, lastName: { type: String }, fullName: { type: String },
    mobile: {
        type: String,
        validate: {
            validator: function (v) {
                // Allow empty (optional) or Australian format 04XXXXXXXX
                return !v || /^04\d{8}$/.test(v);
            },
            message: "Mobile number must have 10 digits starting with 04.",
        },
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    // ⚠️ Not safe for real apps
    paymentInfo: {
        cardNumber: { type: String },
        expiryDate: { type: String },
        cvv: { type: String },
        billingAddress: { type: String }
    },
    refreshToken: {
        type: String,
        default: null,
    },
    refreshTokenExpiresAt: {
        type: Date,
        default: null,
    },
    lastLogin: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
    versionKey: false,
});
const User = mongoose_1.default.model("User", UserSchema, "users");
exports.default = User;
