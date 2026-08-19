"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const VehicleSchema = new mongoose_1.Schema({
    model_release_year: { type: Number },
    make: { type: String },
    model: { type: String },
    variant: { type: String },
    engine_displacement: { type: Number },
    engine_configuration: { type: String },
    engine_induction: { type: String },
    fwd_gears_no: { type: Number },
    transmission_type_description: { type: String },
    side_door_no: { type: Number },
    seating_capacity: { type: Number },
    body_style: { type: String },
    driving_wheels_no: { type: Number },
    fuel_type: { type: String },
    co2_emissions_combined: { type: Number },
    fuel_consumption_combined: { type: Number },
    energy_consumption_whkm: { type: Number },
    electric_range_km: { type: Number },
    air_pollution_standard: { type: String },
    is_current_model: { type: String },
    model_end_year: { type: Number },
    fuel_life_cycle_co2: { type: Number },
    annual_tailpipe_co2: { type: Number },
    annual_fuel_cost: { type: Number },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    versionKey: false, // Disables the __v field
});
const Vehicle = mongoose_1.default.model("Vehicle", VehicleSchema, "ev_vehicles");
exports.default = Vehicle;
