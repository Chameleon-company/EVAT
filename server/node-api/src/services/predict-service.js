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
const predict_repository_1 = __importDefault(require("../repositories/predict-repository"));
const congestion_model_1 = __importDefault(require("../models/congestion-model"));
const mongoose_1 = __importDefault(require("mongoose"));
const PYTHON_API = process.env.PYTHON_API_URL;
class PredictService {
    /**
 * Get a congestion levels for multiple chargers
 *
 * @param chargerIDs Array of one or more charger ID strings
 * @returns Object containing charger ID's and their respective congestion levels
 */
    getCongestionLevels(chargerIDs) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (chargerIDs.length < 1) {
                    throw new Error("Array must contain at least one station ID");
                }
                let result = yield predict_repository_1.default.getCongestionByIDs(chargerIDs);
                // Filter to only keep entries that match the requested chargerIDs
                result.congestionLevels = result.congestionLevels.filter((level) => chargerIDs.includes(level.chargerId.toString()));
                // Add entries for any requested chargerIDs that weren't found
                for (let i = 0; i < chargerIDs.length; i++) {
                    if (!result.congestionLevels.some((level) => level.chargerId.toString() === chargerIDs[i])) {
                        const newCongestion = new congestion_model_1.default({
                            chargerId: new mongoose_1.default.Types.ObjectId(chargerIDs[i]),
                            congestion_level: "unknown"
                        });
                        result.congestionLevels.push(newCongestion);
                    }
                }
                return result;
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error retrieving congestion levels: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while retrieving congestion levels");
                }
            }
        });
    }
    /**
     * Deletes a congestion level for a chargers
     *
     * @param chargerID Array of one or more charger ID strings
     * @returns boolean containing true for success or false for failure
     */
    deleteCongestionLevel(chargerID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let result = yield predict_repository_1.default.deleteCongestionLevel(chargerID);
                return result;
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error retrieving congestion levels: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while retrieving congestion levels");
                }
            }
        });
    }
    /**
     * Updates a congestion level for a chargers
     *
     * @param chargerID Array of one or more charger ID strings
     * @param level String of either 'low', 'medium', 'high'
     * @returns boolean containing true for success or false for failure
     */
    putCongestionLevel(chargerID, level) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let result = yield predict_repository_1.default.putCongestionLevel(chargerID, level);
                return result;
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error updating congestion levels: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while updating congestion levels");
                }
            }
        });
    }
    /**
     * updates a congestion levels for multiple chargers
     *
     * @param level Array of dictionaries with a charger_id and level
     * @returns boolean containing true for success or false for failure
     */
    postCongestionLevelsBatch(levels) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let result = yield predict_repository_1.default.postCongestionLevelsBatch(levels);
                return result;
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error updating congestion levels: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while updating congestion levels");
                }
            }
        });
    }
    /**
* Calls the Python ML microservice to calculate EV vs ICE cost comparison
*
* @param distance_km Trip distance in kilometres
* @param electricity_price_per_kwh Electricity rate in $/kWh
* @param ice_eff_l_per_100km ICE fuel efficiency in L/100km
* @param petrol_price_per_l Petrol price in $/L
* @returns Predicted savings, costs, emissions from the ML model
*/
    getCostComparison(distance_km, electricity_price_per_kwh, ice_eff_l_per_100km, petrol_price_per_l, ev_make, ev_model, ev_variant, ice_make, ice_model, ice_variant) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${PYTHON_API}/costComparison/predict`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        distance_km,
                        electricity_price_per_kwh,
                        petrol_price_per_l,
                        ev_make,
                        ev_model,
                        ev_variant,
                        ice_make,
                        ice_model,
                        ice_variant,
                    }),
                });
                if (!response.ok) {
                    const error = yield response.json();
                    throw new Error(error.detail || `ML service error: ${response.status}`);
                }
                return yield response.json();
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error calling ML service: " + error.message);
                }
                else {
                    throw new Error("Unknown error calling ML service");
                }
            }
        });
    }
    getCostCharts(distance_km, electricity_price_per_kwh, ice_eff_l_per_100km, petrol_price_per_l) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${PYTHON_API}/costComparison/charts`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        distance_km,
                        electricity_price_per_kwh,
                        ice_eff_l_per_100km,
                        petrol_price_per_l,
                    }),
                });
                if (!response.ok) {
                    const error = yield response.json();
                    throw new Error(error.detail || `ML service error: ${response.status}`);
                }
                return yield response.json();
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error fetching chart data: " + error.message);
                }
                else {
                    throw new Error("Unknown error fetching chart data");
                }
            }
        });
    }
    getEvVehicles() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${PYTHON_API}/costComparison/vehicles/ev`);
                if (!response.ok)
                    throw new Error(`ML service error: ${response.status}`);
                return yield response.json();
            }
            catch (error) {
                throw new Error("Error fetching EV vehicles: " + error.message);
            }
        });
    }
    getIceVehicles() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${PYTHON_API}/costComparison/vehicles/ice`);
                if (!response.ok)
                    throw new Error(`ML service error: ${response.status}`);
                return yield response.json();
            }
            catch (error) {
                throw new Error("Error fetching ICE vehicles: " + error.message);
            }
        });
    }
    getEvEfficiency(make, model, variant) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${PYTHON_API}/costComparison/vehicles/ev/efficiency`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ make, model, variant }),
                });
                if (!response.ok)
                    throw new Error(`ML service error: ${response.status}`);
                return yield response.json();
            }
            catch (error) {
                throw new Error("Error fetching EV efficiency: " + error.message);
            }
        });
    }
    getIceEfficiency(make, model, variant) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${PYTHON_API}/costComparison/vehicles/ice/efficiency`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ make, model, variant }),
                });
                if (!response.ok)
                    throw new Error(`ML service error: ${response.status}`);
                return yield response.json();
            }
            catch (error) {
                throw new Error("Error fetching ICE efficiency: " + error.message);
            }
        });
    }
    getDemandForecast(postcode, date) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${PYTHON_API}/demandForecasting/predict`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ postcode, date }),
                });
                if (!response.ok) {
                    const error = yield response.json();
                    throw new Error(error.detail || `ML service error: ${response.status}`);
                }
                return yield response.json();
            }
            catch (error) {
                throw new Error("Error calling demand forecast ML service: " + error.message);
            }
        });
    }
    getDemandPostcodes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${PYTHON_API}/demandForecasting/postcodes`);
                if (!response.ok)
                    throw new Error(`ML service error: ${response.status}`);
                return yield response.json();
            }
            catch (error) {
                throw new Error("Error fetching demand postcodes: " + error.message);
            }
        });
    }
    getDemandCoords(postcode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${PYTHON_API}/demandForecasting/coords/${postcode}`);
                if (!response.ok)
                    throw new Error(`ML service error: ${response.status}`);
                return yield response.json();
            }
            catch (error) {
                throw new Error("Error fetching postcode coordinates: " + error.message);
            }
        });
    }
}
exports.default = PredictService;
