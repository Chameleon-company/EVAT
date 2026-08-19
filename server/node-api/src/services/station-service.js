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
const station_repository_1 = __importDefault(require("../repositories/station-repository"));
// Helper functions
const makeFlexibleRegexList = (values) => values.map((val) => new RegExp(`(^|,\\s*)${escapeRegex(val)}(\\s*,|$)`, 'i'));
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
class ChargingStationService {
    getAllStations(options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            const query = {};
            if ((_a = options.connectorTypes) === null || _a === void 0 ? void 0 : _a.length) {
                query.connection_type = {
                    $in: makeFlexibleRegexList(options.connectorTypes),
                };
            }
            if ((_b = options.chargingCurrents) === null || _b === void 0 ? void 0 : _b.length) {
                query.current_type = {
                    $in: makeFlexibleRegexList(options.chargingCurrents),
                };
            }
            if ((_c = options.operators) === null || _c === void 0 ? void 0 : _c.length) {
                query.operator = {
                    $in: makeFlexibleRegexList(options.operators),
                };
            }
            if (((_d = options.location) === null || _d === void 0 ? void 0 : _d.latitude) !== undefined &&
                ((_e = options.location) === null || _e === void 0 ? void 0 : _e.longitude) !== undefined &&
                ((_f = options.location) === null || _f === void 0 ? void 0 : _f.radiusKm) !== undefined) {
                query.location = {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [
                                options.location.longitude,
                                options.location.latitude,
                            ],
                        },
                        $maxDistance: options.location.radiusKm * 1000,
                    },
                };
            }
            return yield station_repository_1.default.findAll(query);
        });
    }
    getStationById(stationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield station_repository_1.default.findById(stationId);
        });
    }
    getStationsWithIdIn(stationIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield station_repository_1.default.findByIdIn(stationIds);
        });
    }
    getNearestStation(options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            const query = {};
            if ((_a = options.connectorTypes) === null || _a === void 0 ? void 0 : _a.length) {
                query.connection_type = {
                    $in: makeFlexibleRegexList(options.connectorTypes),
                };
            }
            if ((_b = options.chargingCurrents) === null || _b === void 0 ? void 0 : _b.length) {
                query.current_type = {
                    $in: makeFlexibleRegexList(options.chargingCurrents),
                };
            }
            if ((_c = options.operators) === null || _c === void 0 ? void 0 : _c.length) {
                query.operator = {
                    $in: makeFlexibleRegexList(options.operators),
                };
            }
            if (((_d = options.location) === null || _d === void 0 ? void 0 : _d.latitude) !== undefined &&
                ((_e = options.location) === null || _e === void 0 ? void 0 : _e.longitude) !== undefined) {
                query.location = {
                    $nearSphere: {
                        $geometry: {
                            type: "Point",
                            coordinates: [options.location.longitude, options.location.latitude],
                        },
                    },
                };
            }
            return yield station_repository_1.default.findNearest(query);
        });
    }
}
exports.default = ChargingStationService;
