import EnvImpactAnalysisRepository from "../repositories/env-impact-analysis-repository";
import { IVehicle } from "../models/vehicle-model";
import { IIceVehicle } from "../models/ice-vehicle-model";
import {
  IEnvImpactResponse,
  IVehicleImpactSummary,
  IEnvImpactComparison,
} from "../models/env-impact-analysis-types";

type VehicleLike = {
  _id: any;
  make?: string;
  model?: string;
  variant?: string;
  fuel_type?: string;
  co2_emissions_combined?: number;
  fuel_consumption_combined?: number;
  energy_consumption_whkm?: number;
  electric_range_km?: number;
  fuel_life_cycle_co2?: number;
  annual_tailpipe_co2?: number;
  annual_fuel_cost?: number;
};

function isEv(vehicle: VehicleLike): boolean {
  const ft = (vehicle.fuel_type || "").toLowerCase();
  return ft.includes("electric") || ft === "pure electric";
}

function toImpactSummary(v: VehicleLike): IVehicleImpactSummary {
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

function buildComparison(
  ev: IVehicleImpactSummary,
  ice: IVehicleImpactSummary
): IEnvImpactComparison {
  const evCo2 = ev.co2EmissionsCombined ?? ev.fuelLifeCycleCo2 ?? 0;
  const iceCo2 = ice.co2EmissionsCombined ?? ice.fuelLifeCycleCo2 ?? 0;
  const co2SavedPerKm = iceCo2 - evCo2;

  const evAnnual = ev.annualTailpipeCo2 ?? 0;
  const iceAnnual = ice.annualTailpipeCo2 ?? 0;
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

export default class EnvImpactAnalysisService {
  async getComparison(
    evVehicleId: string,
    iceVehicleId: string
  ): Promise<IEnvImpactResponse> {
    const [evVehicle, iceVehicle] = await Promise.all([
      EnvImpactAnalysisRepository.findEvById(evVehicleId),
      EnvImpactAnalysisRepository.findIceById(iceVehicleId),
    ]);

    if (!evVehicle) {
      throw new Error(`EV vehicle not found: ${evVehicleId}`);
    }
    if (!iceVehicle) {
      throw new Error(`ICE vehicle not found: ${iceVehicleId}`);
    }

    if (!isEv(evVehicle as unknown as VehicleLike)) {
      throw new Error(
        `Vehicle ${evVehicleId} is not an electric vehicle (fuel_type: ${evVehicle.fuel_type})`
      );
    }
    if (isEv(iceVehicle as unknown as VehicleLike)) {
      throw new Error(
        `Vehicle ${iceVehicleId} is an electric vehicle. Please select an ICE (petrol/diesel) vehicle for comparison.`
      );
    }

    const ev = toImpactSummary(evVehicle as unknown as VehicleLike);
    const ice = toImpactSummary(iceVehicle as unknown as VehicleLike);
    const comparison = buildComparison(ev, ice);

    return { ev, ice, comparison };
  }
}

