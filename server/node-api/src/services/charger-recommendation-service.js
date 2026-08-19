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
const station_service_1 = __importDefault(require("./station-service"));
const profile_service_1 = __importDefault(require("./profile-service"));
const vehicle_service_1 = __importDefault(require("./vehicle-service"));
const predict_service_1 = __importDefault(require("./predict-service"));
const weather_aware_routing_service_1 = __importDefault(require("./weather-aware-routing-service"));
const recommendation_history_service_1 = __importDefault(require("./recommendation-history-service"));
const recommendation_history_repository_1 = __importDefault(require("../repositories/recommendation-history-repository"));
const recommendation_ranking_service_1 = __importDefault(require("./recommendation-ranking-service"));
function toBoolean(value) {
    if (!value)
        return true;
    const normalized = value.toLowerCase();
    return !["no", "false", "closed", "unavailable", "out of service"].includes(normalized);
}
class ChargerRecommendationService {
    constructor() {
        this.stationService = new station_service_1.default();
        this.profileService = new profile_service_1.default();
        this.vehicleService = new vehicle_service_1.default();
        this.predictService = new predict_service_1.default();
        this.recommendationHistoryService = new recommendation_history_service_1.default(new recommendation_history_repository_1.default());
    }
    getRecommendations(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const { userId, latitude, longitude, radiusKm = 10 } = request;
            const stations = yield this.stationService.getAllStations({
                location: { latitude, longitude, radiusKm },
            });
            // Review fix: if there are no nearby stations, short-circuit here with an
            // empty result rather than calling the congestion API with an empty
            // array (which throws) and turning a valid no-results case into a 500.
            if (stations.length === 0) {
                const profile = yield this.profileService.getUserProfile(userId);
                const sessionId = yield this.recommendationHistoryService.createSession({
                    userId,
                    userLocation: { latitude, longitude },
                    candidates: [],
                });
                return {
                    sessionId: sessionId.toString(),
                    recommendations: [],
                    generatedAt: new Date().toISOString(),
                };
            }
            const limitedStations = stations.slice(0, 10);
            const profile = yield this.profileService.getUserProfile(userId);
            const vehicle = profile.user_car_model
                ? yield this.vehicleService.getVehicleById(profile.user_car_model)
                : null;
            const recentSessions = yield this.recommendationHistoryService.getRecentSessions(userId);
            const stationIds = limitedStations.map((s) => s._id.toString());
            const { congestionLevels } = yield this.predictService.getCongestionLevels(stationIds);
            const congestionByStation = new Map(congestionLevels.map((c) => [c.chargerId.toString(), c.congestion_level]));
            const routingResults = yield Promise.all(limitedStations.map((station) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const result = yield weather_aware_routing_service_1.default.getPrediction({
                        origin: `${latitude},${longitude}`,
                        destination: `${station.latitude},${station.longitude}`,
                        ac_on: true,
                    });
                    return { stationId: station._id.toString(), routing: result };
                }
                catch (error) {
                    console.error(`Weather routing failed for station ${station._id}:`, error.message);
                    return { stationId: station._id.toString(), routing: null };
                }
            })));
            const routingByStation = new Map(routingResults.map((r) => [r.stationId, r.routing]));
            const candidates = limitedStations.map((station) => {
                var _a, _b, _c, _d;
                const stationId = station._id.toString();
                const routing = routingByStation.get(stationId);
                const congestionLevel = (_a = congestionByStation.get(stationId)) !== null && _a !== void 0 ? _a : "unknown";
                const routingAvailable = routing !== null;
                return {
                    stationId,
                    latitude: station.latitude,
                    longitude: station.longitude,
                    operator: station.operator,
                    connectionType: station.connection_type,
                    currentType: station.current_type,
                    chargingPoints: station.charging_points,
                    cost: station.cost,
                    payAtLocation: station.pay_at_location,
                    membershipRequired: station.membership_required,
                    accessKeyRequired: station.access_key_required,
                    isOperational: toBoolean(station.is_operational),
                    routingAvailable,
                    distanceKm: routingAvailable ? routing.distance_km : null,
                    durationMin: routingAvailable ? routing.duration_min : null,
                    durationInTrafficMin: routingAvailable ? routing.duration_in_traffic_min : null,
                    roadTrafficCondition: routingAvailable ? routing.traffic_condition : null,
                    energyNominalKwh: routingAvailable ? routing.energy_nominal_kwh : null,
                    energyNeededKwh: routingAvailable ? routing.energy_with_ac_kwh : null,
                    socWithContingencyPct: routingAvailable ? routing.soc_with_contingency_pct : null,
                    temperatureC: routingAvailable ? (_b = routing.weather) === null || _b === void 0 ? void 0 : _b.temp_c : null,
                    windSpeedMs: routingAvailable ? (_c = routing.weather) === null || _c === void 0 ? void 0 : _c.wind_speed_ms : null,
                    windDirectionDeg: routingAvailable ? (_d = routing.weather) === null || _d === void 0 ? void 0 : _d.wind_deg : null,
                    congestionLevel,
                };
            });
            const userProfile = {
                vehicle: {
                    vehicleId: (_b = (_a = vehicle === null || vehicle === void 0 ? void 0 : vehicle._id) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "",
                    make: vehicle === null || vehicle === void 0 ? void 0 : vehicle.make,
                    model: vehicle === null || vehicle === void 0 ? void 0 : vehicle.model,
                    variant: vehicle === null || vehicle === void 0 ? void 0 : vehicle.variant,
                    fuelType: vehicle === null || vehicle === void 0 ? void 0 : vehicle.fuel_type,
                    energyConsumptionWhkm: vehicle === null || vehicle === void 0 ? void 0 : vehicle.energy_consumption_whkm,
                    electricRangeKm: vehicle === null || vehicle === void 0 ? void 0 : vehicle.electric_range_km,
                },
                favouriteStationIds: (_c = profile.favourite_stations) !== null && _c !== void 0 ? _c : [],
                userHistory: recentSessions
                    .filter((s) => { var _a; return (_a = s.selection) === null || _a === void 0 ? void 0 : _a.stationId; })
                    .map((s) => {
                    var _a, _b;
                    return ({
                        candidates: s.candidates,
                        selection: {
                            stationId: (_b = (_a = s.selection.stationId) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : null,
                            selectedAt: s.selection.selectedAt,
                        },
                    });
                }),
            };
            const { recommendations } = yield recommendation_ranking_service_1.default.rankStations({
                userId,
                userLocation: { latitude, longitude },
                userProfile,
                candidates,
            });
            const rankByStation = new Map(recommendations.map((r) => [r.stationId, r]));
            const candidatesWithRank = candidates
                .filter((c) => rankByStation.has(c.stationId))
                .map((c) => (Object.assign(Object.assign({}, c), { rank: rankByStation.get(c.stationId).rank, score: rankByStation.get(c.stationId).score, reasons: rankByStation.get(c.stationId).reasons })))
                .sort((a, b) => a.rank - b.rank);
            const sessionId = yield this.recommendationHistoryService.createSession({
                userId,
                userLocation: { latitude, longitude },
                candidates: candidatesWithRank,
            });
            return {
                sessionId: sessionId.toString(),
                recommendations: candidatesWithRank,
                generatedAt: new Date().toISOString(),
            };
        });
    }
    saveSelection(sessionId, stationId, requestingUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.recommendationHistoryService.recordSelection(sessionId, stationId, requestingUserId, new Date());
        });
    }
}
exports.default = ChargerRecommendationService;
