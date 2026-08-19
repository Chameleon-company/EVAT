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
const PersonalisedEVInsightsSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: [true, "User ID is required"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
        maxlength: [255, "Email cannot exceed 255 characters"],
    },
    weekly_km: {
        type: Number,
        required: [true, "Weekly km is required"],
        min: [0, "Weekly km cannot be negative"],
    },
    trip_length: {
        type: String,
        required: [true, "Trip length is required"],
        trim: true,
    },
    driving_frequency: {
        type: String,
        required: [true, "Driving frequency is required"],
        trim: true,
    },
    driving_type: {
        type: String,
        required: [true, "Driving type is required"],
        trim: true,
    },
    road_trips: {
        type: String,
        required: [true, "Road trips field is required"],
        trim: true,
    },
    car_ownership: {
        type: String,
        required: [true, "Car ownership is required"],
        trim: true,
    },
    fuel_efficiency: {
        type: Number,
        required: [true, "Fuel efficiency is required"],
        min: [0, "Fuel efficiency cannot be negative"],
    },
    monthly_fuel_spend: {
        type: Number,
        required: [true, "Monthly fuel spend is required"],
        min: [0, "Monthly fuel spend cannot be negative"],
    },
    home_charging: {
        type: String,
        required: [true, "Home charging is required"],
        trim: true,
    },
    solar_panels: {
        type: String,
        required: [true, "Solar panels field is required"],
        trim: true,
    },
    charging_preference: {
        type: String,
        required: [true, "Charging preference is required"],
        trim: true,
    },
    budget: {
        type: String,
        required: [true, "Budget is required"],
        trim: true,
    },
    priorities: {
        type: String,
        required: [true, "Priorities are required"],
        trim: true,
    },
    postcode: {
        type: String,
        required: [true, "Postcode is required"],
        trim: true,
        maxlength: [10, "Postcode too long"],
    },
    cluster: {
        type: Number,
        default: null,
    },
    profileType: {
        type: String,
        default: "",
        trim: true,
    },
    description: {
        type: String,
        default: "",
        trim: true,
    },
    estimatedSavings: {
        type: Number,
        default: 0,
    },
    savingsMessage: {
        type: String,
        default: "",
        trim: true,
    },
    similarDriverAverages: {
        weekly_km: { type: Number, default: 0 },
        fuel_efficiency: { type: Number, default: 0 },
        monthly_fuel_spend: { type: Number, default: 0 },
    },
    allDriverAverages: {
        weekly_km: { type: Number, default: 0 },
        fuel_efficiency: { type: Number, default: 0 },
        monthly_fuel_spend: { type: Number, default: 0 }
    },
    comparison: {
        sim_weekly_km_difference: { type: Number, default: 0 },
        sim_fuel_efficiency_difference: { type: Number, default: 0 },
        sim_monthly_fuel_spend_difference: { type: Number, default: 0 },
        all_weekly_km_difference: { type: Number, default: 0 },
        all_fuel_efficiency_difference: { type: Number, default: 0 },
        all_monthly_fuel_spend_difference: { type: Number, default: 0 },
    },
}, {
    timestamps: true,
    versionKey: false,
});
// collection name: personalised_ev_insights
const PersonalisedEVInsights = mongoose_1.default.model("PersonalisedEVInsights", PersonalisedEVInsightsSchema, "personalised_ev_insights");
exports.default = PersonalisedEVInsights;
