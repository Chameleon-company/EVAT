import mongoose, { Schema, Document } from "mongoose";

export interface IVehicle extends Document {
  model_release_year?: number;
  make?: string;
  model?: string;
  variant?: string;
  engine_displacement?: number;
  engine_configuration?: string;
  engine_induction?: string;
  fwd_gears_no?: number;
  transmission_type_description?: string;
  side_door_no?: number;
  seating_capacity?: number;
  body_style?: string;
  driving_wheels_no?: number;
  fuel_type?: string;
  co2_emissions_combined?: number;
  fuel_consumption_combined?: number;
  energy_consumption_whkm?: number;
  electric_range_km?: number;
  air_pollution_standard?: string;
  is_current_model?: string;
  model_end_year?: number;
  fuel_life_cycle_co2?: number;
  annual_tailpipe_co2?: number;
  annual_fuel_cost?: number;
}

const VehicleSchema: Schema = new Schema<IVehicle>(
  {
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
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    versionKey: false, // Disables the __v field
  }
);

const Vehicle = mongoose.model<IVehicle>(
  "Vehicle",
  VehicleSchema,
  "ev_vehicles"
);
export default Vehicle;
