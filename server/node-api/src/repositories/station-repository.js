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
const station_model_1 = __importDefault(require("../models/station-model"));
class ChargingStationRepository {
    /**
     * Find all charging stations within the filter condition
     *
     * @param filter A filter condition used to filter the data found
     * @returns Returns all Charging Stations that fulfill the filter condition
     */
    findAll() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            return yield station_model_1.default.find(filter).exec();
        });
    }
    /**
     * Find a charging station by its ID
     *
     * @param stationId A charging stations id
     * @returns Returns the charging stations data if found, or null if not
     */
    findById(stationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield station_model_1.default.findById(stationId).exec();
        });
    }
    /**
     * Find multiple stations by their IDs
     *
     * @param stationIds An array of charging station IDs to search for
     * @returns Returns a an array of charging station data which match the provided IDs
     */
    findByIdIn(stationIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield station_model_1.default.find({
                _id: { $in: stationIds },
            });
        });
    }
    /**
     * Find the nearest charging station
     *
     * @param filter Find a single charging station that fulfills the input condition (being the closest to a set location)
     * @returns Returns the details of the single closest charing station
     */
    findNearest() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            return yield station_model_1.default.findOne(filter).exec();
        });
    }
}
exports.default = new ChargingStationRepository();
