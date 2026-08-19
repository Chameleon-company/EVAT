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
const env_impact_analysis_repository_1 = __importDefault(require("../repositories/env-impact-analysis-repository"));
function isEv(vehicle) {
    const ft = (vehicle.fuel_type || "").toLowerCase();
    return ft.includes("electric") || ft === "pure electric";
}
function toImpactSummary(v) {
    return {
        id: v._id.toString(),
        make: v.make,
        model: v.model,
        variant: v.variant,
        fuelType: v.fuel_type,
        co2EmissionsCombined: v.co2_emissions_combined,
        fuelConsumptionCombined: v.fuel_consumption_combined,
        energyConsumptionWhkm: v.energy_consumption_whkm,
        electricRangeKm: v.electric_range_km,
        fuelLifeCycleCo2: v.fuel_life_cycle_co2,
        annualTailpipeCo2: v.annual_tailpipe_co2,
        annualFuelCost: v.annual_fuel_cost,
    };
}
function buildComparison(ev, ice) {
    var _a, _b, _c, _d, _e, _f;
    const evCo2 = (_b = (_a = ev.co2EmissionsCombined) !== null && _a !== void 0 ? _a : ev.fuelLifeCycleCo2) !== null && _b !== void 0 ? _b : 0;
    const iceCo2 = (_d = (_c = ice.co2EmissionsCombined) !== null && _c !== void 0 ? _c : ice.fuelLifeCycleCo2) !== null && _d !== void 0 ? _d : 0;
    const co2SavedPerKm = iceCo2 - evCo2;
    const evAnnual = (_e = ev.annualTailpipeCo2) !== null && _e !== void 0 ? _e : 0;
    const iceAnnual = (_f = ice.annualTailpipeCo2) !== null && _f !== void 0 ? _f : 0;
    const co2SavedAnnual = iceAnnual - evAnnual;
    const evBetter = evCo2 <= iceCo2;
    const summary = evBetter
        ? `The EV emits ${Math.round(co2SavedPerKm)} g/km less CO2 (${Math.round(co2SavedAnnual)} kg/year).`
        : "The ICE vehicle has lower tailpipe CO2 in this comparison.";
    return {
        co2SavedPerKm: co2SavedPerKm >= 0 ? co2SavedPerKm : 0,
        co2SavedAnnual: co2SavedAnnual >= 0 ? co2SavedAnnual : 0,
        evBetter,
        summary,
    };
}
class EnvImpactAnalysisService {
    getComparison(evVehicleId, iceVehicleId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [evVehicle, iceVehicle] = yield Promise.all([
                env_impact_analysis_repository_1.default.findEvById(evVehicleId),
                env_impact_analysis_repository_1.default.findIceById(iceVehicleId),
            ]);
            if (!evVehicle) {
                throw new Error(`EV vehicle not found: ${evVehicleId}`);
            }
            if (!iceVehicle) {
                throw new Error(`ICE vehicle not found: ${iceVehicleId}`);
            }
            if (!isEv(evVehicle)) {
                throw new Error(`Vehicle ${evVehicleId} is not an electric vehicle (fuel_type: ${evVehicle.fuel_type})`);
            }
            if (isEv(iceVehicle)) {
                throw new Error(`Vehicle ${iceVehicleId} is an electric vehicle. Please select an ICE (petrol/diesel) vehicle for comparison.`);
            }
            const ev = toImpactSummary(evVehicle);
            const ice = toImpactSummary(iceVehicle);
            const comparison = buildComparison(ev, ice);
            return { ev, ice, comparison };
        });
    }
}
exports.default = EnvImpactAnalysisService;
