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
const axios_1 = __importDefault(require("axios"));
const personalised_ev_insights_repository_1 = __importDefault(require("../repositories/personalised-ev-insights-repository"));
const PYTHON_API = process.env.PYTHON_API_URL;
class PersonalisedEVInsightsService {
    submitInsights(userId, email, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.validateUser(userId, email);
                this.validatePayload(payload);
                const savedRecord = yield personalised_ev_insights_repository_1.default.createInsight(userId, email, payload);
                const cluster = yield this.getClusterPrediction(payload);
                const processedResult = this.buildProcessedResult(payload, cluster);
                yield personalised_ev_insights_repository_1.default.updateInsightWithResult(savedRecord._id.toString(), processedResult);
                return {
                    message: "Personalised EV insight generated and saved successfully",
                };
            }
            catch (error) {
                throw new Error("Error saving personalised EV insights: " + error.message);
            }
        });
    }
    getLatestInsightByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!userId) {
                    throw new Error("User ID is required");
                }
                return yield personalised_ev_insights_repository_1.default.getLatestInsightByUserId(userId);
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error retrieving personalised EV insights: " + error.message);
                }
                throw new Error("An unknown error occurred while retrieving personalised EV insights");
            }
        });
    }
    validateUser(userId, email) {
        if (!userId)
            throw new Error("User ID is required");
        if (!email)
            throw new Error("Email is required");
    }
    getClusterPrediction(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const response = yield axios_1.default.post(`${PYTHON_API}/personalisedEVInsights/predict`, payload);
            if (((_a = response.data) === null || _a === void 0 ? void 0 : _a.cluster) === undefined || ((_b = response.data) === null || _b === void 0 ? void 0 : _b.cluster) === null) {
                throw new Error("Invalid cluster response from Flask API");
            }
            return response.data.cluster;
        });
    }
    buildProcessedResult(payload, cluster) {
        const clusterInsights = {
            0: {
                profileType: "High-Usage Fuel Spenders",
                description: "Drives long distances with poor fuel efficiency, leading to high fuel costs.",
            },
            1: {
                profileType: "Regular Commuters",
                description: "Drives regularly with moderate efficiency and steady fuel spending.",
            },
            2: {
                profileType: "Long-Distance Travellers",
                description: "Drives extensively and spends heavily on fuel despite good efficiency.",
            },
            3: {
                profileType: "Low Usage Urban Drivers",
                description: "Drives short distances occasionally with minimal fuel costs.",
            },
        };
        const clusterAverages = {
            0: { weekly_km: 524.18, fuel_efficiency: 2.35, monthly_fuel_spend: 105.12 },
            1: { weekly_km: 213.62, fuel_efficiency: 6.6, monthly_fuel_spend: 103.59 },
            2: { weekly_km: 525.1, fuel_efficiency: 8.4, monthly_fuel_spend: 315.07 },
            3: { weekly_km: 55.73, fuel_efficiency: 6.29, monthly_fuel_spend: 27.51 },
        };
        const allDrivers = { weekly_km: 460.66, fuel_efficiency: 5.91, monthly_fuel_spend: 137.82 };
        const insight = clusterInsights[cluster];
        const averages = clusterAverages[cluster];
        if (!insight || !averages) {
            throw new Error(`Unsupported cluster value: ${cluster}`);
        }
        const monthlyKm = payload.weekly_km * 4;
        let electricityCostPerKm = 0.07; // default = public
        const solar = payload.solar_panels;
        const charging = payload.charging_preference;
        // Solar 
        if (solar === "Yes") {
            electricityCostPerKm = 0.02;
        }
        // Home charging
        else if (charging === "Home") {
            electricityCostPerKm = 0.04;
        }
        // Work 
        else if (charging === "Work") {
            electricityCostPerKm = 0.05;
        }
        // Public / No preference
        else {
            electricityCostPerKm = 0.07;
        }
        const estimatedEvCost = monthlyKm * electricityCostPerKm;
        let estimatedSavings = 0;
        let savingsMessage = "";
        const ownership = payload.car_ownership;
        if (ownership === "Yes - Electric") {
            estimatedSavings = 0;
            savingsMessage = "You already own an EV, so switching savings do not apply.";
        }
        else if (ownership === "No - I don't own a car") {
            estimatedSavings = 0;
            savingsMessage =
                "Savings cannot be estimated because you do not currently own a car.";
        }
        else {
            estimatedSavings = Number((payload.monthly_fuel_spend - estimatedEvCost).toFixed(2));
            if (estimatedSavings > 0) {
                savingsMessage = `You could save around $${estimatedSavings} per month by switching to an EV.`;
            }
            else {
                estimatedSavings = 0;
                savingsMessage = "Based on your current driving pattern, switching savings appear limited.";
            }
        }
        return {
            cluster,
            profileType: insight.profileType,
            description: insight.description,
            estimatedSavings,
            savingsMessage,
            similarDriverAverages: averages,
            allDriverAverages: allDrivers,
            comparison: {
                sim_weekly_km_difference: Number((payload.weekly_km - averages.weekly_km).toFixed(2)),
                sim_fuel_efficiency_difference: Number((payload.fuel_efficiency - averages.fuel_efficiency).toFixed(2)),
                sim_monthly_fuel_spend_difference: Number((payload.monthly_fuel_spend - averages.monthly_fuel_spend).toFixed(2)),
                all_weekly_km_difference: Number((payload.weekly_km - allDrivers.weekly_km).toFixed(2)),
                all_fuel_efficiency_difference: Number((payload.fuel_efficiency - allDrivers.fuel_efficiency).toFixed(2)),
                all_monthly_fuel_spend_difference: Number((payload.monthly_fuel_spend - allDrivers.monthly_fuel_spend).toFixed(2)),
            },
        };
    }
    validatePayload(payload) {
        const { weekly_km, trip_length, driving_frequency, driving_type, road_trips, car_ownership, fuel_efficiency, monthly_fuel_spend, home_charging, solar_panels, charging_preference, budget, priorities, postcode, } = payload;
        if (weekly_km === undefined ||
            trip_length === undefined ||
            driving_frequency === undefined ||
            driving_type === undefined ||
            road_trips === undefined ||
            car_ownership === undefined ||
            fuel_efficiency === undefined ||
            monthly_fuel_spend === undefined ||
            home_charging === undefined ||
            solar_panels === undefined ||
            charging_preference === undefined ||
            budget === undefined ||
            priorities === undefined ||
            postcode === undefined) {
            throw new Error("All required fields must be provided");
        }
        if (Number(weekly_km) < 0) {
            throw new Error("Weekly km cannot be negative");
        }
        if (Number(fuel_efficiency) < 0) {
            throw new Error("Fuel efficiency cannot be negative");
        }
        if (Number(monthly_fuel_spend) < 0) {
            throw new Error("Monthly fuel spend cannot be negative");
        }
    }
}
exports.default = PersonalisedEVInsightsService;
