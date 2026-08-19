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
const ChargerReviewSchema = new mongoose_1.Schema({
    chargerId: {
        type: String,
        required: [true, "Charger ID is required"],
        trim: true,
    },
    userId: {
        type: String,
        required: [true, "User ID is required"],
        trim: true,
    },
    userName: {
        type: String,
        required: [true, "User name is required"],
        trim: true,
        maxlength: [100, "User name cannot exceed 100 characters"],
    },
    userAvatar: {
        type: String,
        trim: true,
        default: null,
    },
    rating: {
        type: Number,
        required: [true, "Rating is required"],
        min: [1, "Rating must be at least 1"],
        max: [5, "Rating cannot exceed 5"],
    },
    comment: {
        type: String,
        required: [true, "Comment is required"],
        trim: true,
        maxlength: [500, "Comment cannot exceed 500 characters"],
    },
}, {
    timestamps: true,
    versionKey: false,
});
// Index for efficient queries
ChargerReviewSchema.index({ chargerId: 1, createdAt: -1 });
ChargerReviewSchema.index({ userId: 1, chargerId: 1 }, { unique: true }); // One review per user per charger
const ChargerReview = mongoose_1.default.model("ChargerReview", ChargerReviewSchema, "charger_reviews");
exports.default = ChargerReview;
