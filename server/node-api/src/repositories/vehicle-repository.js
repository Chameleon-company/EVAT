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
const vehicle_model_1 = __importDefault(require("../models/vehicle-model"));
class VehicleRepository {
    /**
     * Finds a vehicle by a given ID
     *
     * @param vehicleId String: A vehicle's ID
     * @returns Vehicle: the specified vehicle's details, or null if none exists
     */
    findById(vehicleId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield vehicle_model_1.default.findById(vehicleId).exec();
        });
    }
    /**
     * Finds all vehicles with a specific input filter
     *
     * @param filter Input a specific filter
     * @returns Returns all vehicles under a specific filter
     */
    findAll() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            return yield vehicle_model_1.default.find(filter).exec();
        });
    }
    /**
     * Creates a new vehicle document
     *
     * @param data Minimal vehicle payload
     * @returns The created vehicle record
     */
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const doc = new vehicle_model_1.default({
                make: data.make,
                model: data.model,
                year: data.year,
                ownerId: (_a = data.ownerId) !== null && _a !== void 0 ? _a : undefined,
            });
            return yield doc.save();
        });
    }
    /**
     * Updates an existing vehicle
     *
     * @param vehicleId Vehicle ID
     * @param data Partial fields to update
     * @returns The updated vehicle document, or null if not found
     */
    update(vehicleId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield vehicle_model_1.default.findByIdAndUpdate(vehicleId, Object.assign(Object.assign(Object.assign({}, (data.make !== undefined ? { make: data.make } : {})), (data.model !== undefined ? { model: data.model } : {})), (data.year !== undefined ? { year: data.year } : {})), { new: true, runValidators: true }).exec();
        });
    }
}
exports.default = new VehicleRepository();
