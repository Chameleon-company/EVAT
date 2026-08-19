"use strict";
// Step 14: Build the Recommendation ML API request from gathered candidate data
Object.defineProperty(exports, "__esModule", { value: true });
function buildRecommendationRequest(userId, latitude, longitude, stations, routingResults, congestionLevels, vehicle) {
    var _a, _b;
    const routingByStation = new Map(routingResults.map((r) => [r.stationId, r.routing]));
    const congestionByStation = new Map(congestionLevels.map((c) => [c.chargerId.toString(), c.congestion_level]));
    const candidates = stations.map((station) => {
        var _a, _b, _c, _d, _e, _f;
        const stationId = station._id.toString();
        const routing = routingByStation.get(stationId);
        const congestionLevel = (_a = congestionByStation.get(stationId)) !== null && _a !== void 0 ? _a : "unknown";
        return {
            stationId,
            latitude: station.latitude,
            longitude: station.longitude,
            operator: station.operator,
            connectionType: station.connection_type,
            currentType: station.current_type,
            chargingPoints: station.charging_points,
            distanceKm: (_b = routing === null || routing === void 0 ? void 0 : routing.distance_km) !== null && _b !== void 0 ? _b : null,
            durationMin: (_c = routing === null || routing === void 0 ? void 0 : routing.duration_min) !== null && _c !== void 0 ? _c : null,
            durationInTrafficMin: (_d = routing === null || routing === void 0 ? void 0 : routing.duration_in_traffic_min) !== null && _d !== void 0 ? _d : null,
            trafficCondition: (_e = routing === null || routing === void 0 ? void 0 : routing.traffic_condition) !== null && _e !== void 0 ? _e : null,
            energyNeededKwh: (_f = routing === null || routing === void 0 ? void 0 : routing.energy_with_ac_kwh) !== null && _f !== void 0 ? _f : null,
            congestionLevel,
        };
    });
    return {
        userId,
        userLocation: { latitude, longitude },
        vehicle: vehicle
            ? { vehicleId: (_b = (_a = vehicle._id) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : null, make: vehicle.make, model: vehicle.model }
            : null,
        candidates,
    };
}
exports.default = buildRecommendationRequest;
