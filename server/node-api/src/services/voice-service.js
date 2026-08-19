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
const mongoose_1 = __importDefault(require("mongoose"));
const station_repository_1 = __importDefault(require("../repositories/station-repository"));
class VoiceService {
    processQuery(query, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const normalizedQuery = query.trim().toLowerCase();
            const entities = this.extractEntities(normalizedQuery);
            const intent = this.detectIntent(normalizedQuery);
            const stationReference = yield this.resolveStationReference(entities.station, normalizedQuery);
            const nearestStation = yield this.resolveNearestStation(context);
            switch (intent) {
                case "get_congestion":
                    const congestionTarget = stationReference !== null && stationReference !== void 0 ? stationReference : nearestStation;
                    return {
                        answer_text: congestionTarget
                            ? `I found a station match and it will be show on the sidebar.`
                            : "I can help with congestion checks. Please mention a station name or allow location for accurate map highlighting.",
                        intent,
                        entities: Object.assign(Object.assign({}, entities), { congestion: "medium", congestion_level: "low" }),
                        station_id: (_a = congestionTarget === null || congestionTarget === void 0 ? void 0 : congestionTarget.station_id) !== null && _a !== void 0 ? _a : null,
                        coordinates: (_b = congestionTarget === null || congestionTarget === void 0 ? void 0 : congestionTarget.coordinates) !== null && _b !== void 0 ? _b : null,
                    };
                case "find_low_cost_station":
                    const cheapestStation = yield this.resolveCheapestStation();
                    return {
                        answer_text: cheapestStation
                            ? "I found the cheapest charging station and prepared it on the sidebar."
                            : "I can help find the cheapest charging station, but I could not resolve pricing data.",
                        intent,
                        entities,
                        station_id: (_c = cheapestStation === null || cheapestStation === void 0 ? void 0 : cheapestStation.station_id) !== null && _c !== void 0 ? _c : null,
                        coordinates: (_d = cheapestStation === null || cheapestStation === void 0 ? void 0 : cheapestStation.coordinates) !== null && _d !== void 0 ? _d : null,
                    };
                case "compare_cost":
                    const costTarget = stationReference !== null && stationReference !== void 0 ? stationReference : nearestStation;
                    return {
                        answer_text: costTarget
                            ? "I can help with EV vs ICE cost comparison for the selected charger."
                            : "I can help with EV vs ICE cost comparison. Please share location or charger name to attach a charger ID.",
                        intent,
                        entities,
                        station_id: (_e = costTarget === null || costTarget === void 0 ? void 0 : costTarget.station_id) !== null && _e !== void 0 ? _e : null,
                        coordinates: (_f = costTarget === null || costTarget === void 0 ? void 0 : costTarget.coordinates) !== null && _f !== void 0 ? _f : null,
                    };
                case "find_nearest_station":
                    return {
                        answer_text: nearestStation
                            ? "I found the nearest charging station and prepared it on the left sidebar."
                            : "I can help find the nearest charging station, but I need location context to select one accurately.",
                        intent,
                        entities: Object.assign(Object.assign({}, entities), { congestion: "medium" }),
                        station_id: (_g = nearestStation === null || nearestStation === void 0 ? void 0 : nearestStation.station_id) !== null && _g !== void 0 ? _g : null,
                        coordinates: (_h = nearestStation === null || nearestStation === void 0 ? void 0 : nearestStation.coordinates) !== null && _h !== void 0 ? _h : null,
                    };
                case "help":
                    return {
                        answer_text: "Try asking about station congestion or EV cost comparison. Example: 'Compare EV and petrol costs'.",
                        intent,
                        entities,
                        station_id: null,
                        coordinates: null,
                    };
                default:
                    return {
                        answer_text: "I could not confidently identify that request yet. Try asking about congestion, costs, or help.",
                        intent: "unknown",
                        entities,
                        station_id: null,
                        coordinates: null,
                    };
            }
        });
    }
    detectIntent(query) {
        if (/(congestion|busy|crowd|wait)/.test(query)) {
            return "get_congestion";
        }
        if (/(cheapest|cheap|lowest cost|low cost|best price|affordable)/.test(query)) {
            return "find_low_cost_station";
        }
        if (/(nearest|nearby|closest|near me)/.test(query)) {
            return "find_nearest_station";
        }
        if (/(compare|cost|price|ev|petrol|diesel|ice)/.test(query)) {
            return "compare_cost";
        }
        if (/(help|how to|what can you do|commands)/.test(query)) {
            return "help";
        }
        return "unknown";
    }
    extractEntities(query) {
        const entities = {};
        const stationMatch = query.match(/station\s+([a-z0-9_-]+)/i) ||
            query.match(/(?:congestion|busy|wait)\s+(?:at|in|near)?\s*([a-z0-9_-]+)/i);
        if (stationMatch && stationMatch[1]) {
            entities.station = stationMatch[1];
        }
        if (/(ev.*(petrol|diesel|ice))|((petrol|diesel|ice).*ev)/.test(query)) {
            entities.comparison = "ev_vs_ice";
        }
        return entities;
    }
    resolveStationReference(station, fullQuery) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            const candidates = this.getStationCandidates(station, fullQuery);
            if (candidates.length < 1)
                return null;
            // If user passes a station id directly, validate against DB.
            for (const candidate of candidates) {
                if (mongoose_1.default.Types.ObjectId.isValid(candidate)) {
                    const byId = yield station_repository_1.default.findById(candidate);
                    if (byId) {
                        const lat = (_a = byId.latitude) !== null && _a !== void 0 ? _a : (_c = (_b = byId.location) === null || _b === void 0 ? void 0 : _b.coordinates) === null || _c === void 0 ? void 0 : _c[1];
                        const lng = (_d = byId.longitude) !== null && _d !== void 0 ? _d : (_f = (_e = byId.location) === null || _e === void 0 ? void 0 : _e.coordinates) === null || _f === void 0 ? void 0 : _f[0];
                        if (typeof lat === "number" && typeof lng === "number") {
                            return {
                                station_id: String(byId._id),
                                coordinates: { lat, lng },
                            };
                        }
                    }
                }
            }
            // Fallback lookup using operator text so we can still return real station ids.
            for (const candidate of candidates) {
                const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const matches = yield station_repository_1.default.findAll({
                    operator: { $regex: escaped, $options: "i" },
                });
                const first = matches[0];
                if (!first)
                    continue;
                const lat = (_g = first.latitude) !== null && _g !== void 0 ? _g : (_j = (_h = first.location) === null || _h === void 0 ? void 0 : _h.coordinates) === null || _j === void 0 ? void 0 : _j[1];
                const lng = (_k = first.longitude) !== null && _k !== void 0 ? _k : (_m = (_l = first.location) === null || _l === void 0 ? void 0 : _l.coordinates) === null || _m === void 0 ? void 0 : _m[0];
                if (typeof lat !== "number" || typeof lng !== "number")
                    continue;
                return {
                    station_id: String(first._id),
                    coordinates: { lat, lng },
                };
            }
            return null;
        });
    }
    getStationCandidates(station, fullQuery) {
        var _a, _b;
        const results = new Set();
        if (station) {
            results.add(station.trim().toLowerCase());
        }
        const locationPhrase = ((_a = fullQuery.match(/(?:at|in|near)\s+([a-z0-9_-]+)/i)) === null || _a === void 0 ? void 0 : _a[1]) ||
            ((_b = fullQuery.match(/(?:congestion|busy|wait)\s+([a-z0-9_-]+)/i)) === null || _b === void 0 ? void 0 : _b[1]);
        if (locationPhrase) {
            results.add(locationPhrase.trim().toLowerCase());
        }
        // Handle common singular/plural mismatch, e.g. dockland <-> docklands.
        const expanded = Array.from(results);
        for (const word of expanded) {
            if (word.endsWith("s")) {
                results.add(word.slice(0, -1));
            }
            else {
                results.add(`${word}s`);
            }
        }
        return Array.from(results).filter((v) => v.length > 1);
    }
    resolveNearestStation(context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            const center = (_a = context === null || context === void 0 ? void 0 : context.map_center) !== null && _a !== void 0 ? _a : context === null || context === void 0 ? void 0 : context.user_location;
            if (!center)
                return null;
            const nearest = (yield station_repository_1.default.findNearest({
                location: {
                    $nearSphere: {
                        $geometry: {
                            type: "Point",
                            coordinates: [center.lng, center.lat],
                        },
                    },
                },
            }));
            if (!nearest)
                return null;
            const lat = (_b = nearest.latitude) !== null && _b !== void 0 ? _b : (_d = (_c = nearest.location) === null || _c === void 0 ? void 0 : _c.coordinates) === null || _d === void 0 ? void 0 : _d[1];
            const lng = (_e = nearest.longitude) !== null && _e !== void 0 ? _e : (_g = (_f = nearest.location) === null || _f === void 0 ? void 0 : _f.coordinates) === null || _g === void 0 ? void 0 : _g[0];
            if (typeof lat !== "number" || typeof lng !== "number")
                return null;
            return {
                station_id: String(nearest._id),
                coordinates: { lat, lng },
            };
        });
    }
    resolveCheapestStation() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            const stations = (yield station_repository_1.default.findAll({
                is_operational: "true",
            }));
            const withParsedCost = stations
                .map((station) => ({
                station,
                parsedCost: this.parseCostToCents(station.cost),
            }))
                .filter((entry) => entry.parsedCost !== null)
                .sort((a, b) => a.parsedCost - b.parsedCost);
            const cheapest = (_a = withParsedCost[0]) === null || _a === void 0 ? void 0 : _a.station;
            if (!cheapest)
                return null;
            const lat = (_b = cheapest.latitude) !== null && _b !== void 0 ? _b : (_d = (_c = cheapest.location) === null || _c === void 0 ? void 0 : _c.coordinates) === null || _d === void 0 ? void 0 : _d[1];
            const lng = (_e = cheapest.longitude) !== null && _e !== void 0 ? _e : (_g = (_f = cheapest.location) === null || _f === void 0 ? void 0 : _f.coordinates) === null || _g === void 0 ? void 0 : _g[0];
            if (typeof lat !== "number" || typeof lng !== "number")
                return null;
            return {
                station_id: String(cheapest._id),
                coordinates: { lat, lng },
            };
        });
    }
    parseCostToCents(costValue) {
        if (typeof costValue !== "string" || !costValue.trim())
            return null;
        const lower = costValue.toLowerCase().trim();
        if (lower.includes("free"))
            return 0;
        const centsMatch = lower.match(/([\d.]+)\s*(c|cent|cents)\b/);
        if (centsMatch && centsMatch[1]) {
            return Math.round(parseFloat(centsMatch[1]));
        }
        const dollarMatch = lower.match(/\$([\d.]+)/);
        if (dollarMatch && dollarMatch[1]) {
            return Math.round(parseFloat(dollarMatch[1]) * 100);
        }
        const numMatch = lower.match(/([\d.]+)/);
        if (numMatch && numMatch[1]) {
            return Math.round(parseFloat(numMatch[1]));
        }
        return null;
    }
}
exports.default = VoiceService;
