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
// schema
const UserStatsSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: [true, "userId is required"],
        unique: true,
        index: true, // helps with frequent queries
    },
    counters: {
        type: {
            totalChargeTimeSeconds: { type: Number, default: 0 },
            totalWhCharged: { type: Number, default: 0 },
            totalMetresTravelled: { type: Number, default: 0 },
            totalCO2KgAvoided: { type: Number, default: 0 },
            totalBookings: { type: Number, default: 0 },
            totalChargersUsed: { type: Number, default: 0 },
            totalChargingSessions: { type: Number, default: 0 },
            totalPetrolSavingsCents: { type: Number, default: 0 },
            totalChargingCostsCents: { type: Number, default: 0 },
            totalReviewsWritten: { type: Number, default: 0 },
            totalRatingsGiven: { type: Number, default: 0 },
            totalFaultReports: { type: Number, default: 0 },
            yearsJoined: { type: Number, default: 0 },
            totalLoginDays: { type: Number, default: 0 },
            consecutiveLoginDays: { type: Number, default: 0 },
        },
        default: {},
        _id: false, // doesn't need an id
    },
    flags: {
        type: {
            setProfilePic: { type: Boolean, default: false },
            useSmartFilter: { type: Boolean, default: false },
            useChatBot: { type: Boolean, default: false },
            setProfileVehicle: { type: Boolean, default: false },
            saveFavouriteCharger: { type: Boolean, default: false },
            postReview: { type: Boolean, default: false },
            giveRating: { type: Boolean, default: false },
            useTeslaNetwork: { type: Boolean, default: false },
            useEvieNetwork: { type: Boolean, default: false },
            christmasDayCharge: { type: Boolean, default: false },
            earthDayCharge: { type: Boolean, default: false },
            winterSolsticeCharge: { type: Boolean, default: false },
            summerSolsticeCharge: { type: Boolean, default: false },
            autumalEquinoxCharge: { type: Boolean, default: false },
            springEquinoxCharge: { type: Boolean, default: false },
        },
        default: {},
        _id: false, // doesn't need an id
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
}, {
    versionKey: false,
    // no timestamps because we control lastUpdated manually in the repository
});
const UserStats = mongoose_1.default.model("UserStats", UserStatsSchema, "user_stats");
exports.default = UserStats;
