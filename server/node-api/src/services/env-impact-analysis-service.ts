import fetch from "node-fetch";

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
  model_release_year?: number;
  make?: string;
  model?: string;
  variant?: string;
  body_style?: string;
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

function normaliseIceFuelType(fuelType?: string): string {
  const value = (fuelType || "").trim().toLowerCase();

  if (value === "diesel") return "Diesel";
  if (value === "petrol 91ron") return "Petrol91";
  if (value === "petrol 95ron") return "Petrol95";
  if (value === "petrol 98ron") return "Petrol98";

  throw new Error(
    `Unsupported ICE fuel type for Environmental Impact model: ${fuelType}`
  );
}

function buildModelPayload(ev: VehicleLike, ice: VehicleLike) {
  if (!ev.make || !ice.make) {
    throw new Error(
      "Vehicle make is required for Environmental Impact prediction"
    );
  }

  if (!ev.body_style || !ice.body_style) {
    throw new Error(
      "Vehicle body style is required for Environmental Impact prediction"
    );
  }

  if (
    ev.model_release_year === undefined ||
    ice.model_release_year === undefined
  ) {
    throw new Error(
      "Vehicle release year is required for Environmental Impact prediction"
    );
  }

  if (ice.fuel_consumption_combined === undefined) {
    throw new Error(
      "ICE fuel consumption is required for Environmental Impact prediction"
    );
  }

  const FuelType_ICE = normaliseIceFuelType(ice.fuel_type);

  const emissionFactor = FuelType_ICE === "Diesel" ? 26.5 : 23.2;

  return {
    Make_EV: ev.make,
    Make_ICE: ice.make,
    BodyStyle_EV: ev.body_style,
    BodyStyle_ICE: ice.body_style,
    FuelType_ICE,
    YearDiff: ev.model_release_year - ice.model_release_year,
    ICE_CO2_Baseline:
      ice.fuel_consumption_combined * emissionFactor,
  };
}

async function getModelPrediction(
  ev: VehicleLike,
  ice: VehicleLike
): Promise<number> {
  const pythonApi =
    process.env.PYTHON_API_URL || "http://127.0.0.1:5000";

  const response = await fetch(
    `${pythonApi}/environmentalImpact/predict`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildModelPayload(ev, ice)),
    }
  );

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      `Environmental Impact ML service error (${response.status}): ${message}`
    );
  }

  const result = (await response.json()) as {
    Predicted_CO2_Savings?: number;
  };

  if (typeof result.Predicted_CO2_Savings !== "number") {
    throw new Error(
      "Environmental Impact ML service returned an invalid prediction"
    );
  }

  return result.Predicted_CO2_Savings;
}

function buildComparison(
  ev: IVehicleImpactSummary,
  ice: IVehicleImpactSummary,
  predictedCo2SavedPerKm: number
): IEnvImpactComparison {
  const co2SavedPerKm = predictedCo2SavedPerKm;

  const evAnnual = ev.annualTailpipeCo2 ?? 0;
  const iceAnnual = ice.annualTailpipeCo2 ?? 0;
  const co2SavedAnnual = iceAnnual - evAnnual;

  const evBetter = co2SavedPerKm >= 0;

  const summary = evBetter
    ? `The EV is predicted to save ${Math.round(
        co2SavedPerKm
      )} g/km CO2 compared with the selected ICE vehicle.`
    : "The model predicts the ICE vehicle has lower CO2 emissions in this comparison.";

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

    const evVehicleLike = evVehicle as unknown as VehicleLike;
    const iceVehicleLike = iceVehicle as unknown as VehicleLike;

    const ev = toImpactSummary(evVehicleLike);
    const ice = toImpactSummary(iceVehicleLike);

    const predictedCo2SavedPerKm = await getModelPrediction(
      evVehicleLike,
      iceVehicleLike
    );

    const comparison = buildComparison(
      ev,
      ice,
      predictedCo2SavedPerKm
    );

    return {
      ev,
      ice,
      comparison,
    };
  }
}