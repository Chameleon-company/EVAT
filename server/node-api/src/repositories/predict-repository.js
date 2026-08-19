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
const congestion_model_1 = __importDefault(require("../models/congestion-model"));
const mongoose_1 = __importDefault(require("mongoose"));
//mongoose.set('debug', true); // Add this at the top of your file
class PredictRepository {
    /**
   * Get congestion levels for each station ID provided
   *
   * @param stationIDs array of station IDs
   * @returns Object containing station IDs and their congestion levels
   */
    getCongestionByIDs(stationIDs) {
        return __awaiter(this, void 0, void 0, function* () {
            const congestionLevels = yield congestion_model_1.default.find({ $in: stationIDs })
                .exec();
            return {
                congestionLevels
            };
        });
    }
    /**
    * Delete congestion level for a station ID provided
    *
    * @param stationID string of station ID
    * @returns boolean success value
    */
    deleteCongestionLevel(chargerID) {
        return __awaiter(this, void 0, void 0, function* () {
            const status = yield congestion_model_1.default.deleteMany({
                chargerId: new mongoose_1.default.Types.ObjectId(chargerID)
            });
            return status.deletedCount > 0;
        });
    }
    /**
    * Updates congestion level for a station ID provided
    *
    * @param stationID string of station ID
    * @param level congestion level as a string, 'low', 'medium', 'high'
    * @returns boolean success value
    */
    putCongestionLevel(chargerID, level) {
        return __awaiter(this, void 0, void 0, function* () {
            const status = yield congestion_model_1.default.updateOne({
                chargerId: new mongoose_1.default.Types.ObjectId(chargerID)
            }, {
                congestion_level: level
            }, {
                upsert: true // Insert if entry doesn't exist
            });
            // If a congestion level is set to what it was already, the modifiedCount will be 0,
            // causing an error for non-issues. The best way to resolve this is to just check that
            // the matched count is greater than 0, meaning it found the value to update in the DB
            return status.matchedCount > 0;
        });
    }
    /**
    * updates a congestion levels for multiple chargers
    *
    * @param levels Array of dictionaries with a charger_id and level
    * @returns boolean success value
    */
    postCongestionLevelsBatch(levels) {
        return __awaiter(this, void 0, void 0, function* () {
            const updates = levels.map((item) => ({
                updateOne: {
                    filter: { chargerId: new mongoose_1.default.Types.ObjectId(item.station_id) },
                    update: { congestion_level: item.congestion_level },
                    upsert: true
                }
            }));
            const result = yield congestion_model_1.default.bulkWrite(updates);
            // If a congestion level is set to what it was already, the modifiedCount will be 0,
            // causing an error for non-issues. The best way to resolve this is to just check that
            // the matched count is greater than 0, meaning it found the value to update in the DB
            return result.matchedCount > 0;
        });
    }
}
exports.default = new PredictRepository();
