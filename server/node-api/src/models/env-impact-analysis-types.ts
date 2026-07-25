export interface IEnvImpactRequest {
  evVehicleId: string;
  iceVehicleId: string;
}

export interface IVehicleImpactSummary {
  id: string;
  make?: string;
  model?: string;
  variant?: string;
  fuelType?: string;
  co2EmissionsCombined?: number; // g/km
  fuelConsumptionCombined?: number; // L/100km
  energyConsumptionWhkm?: number; // Wh/km (EV)
  electricRangeKm?: number; // km (EV)
  fuelLifeCycleCo2?: number; // g/km (well-to-wheel)
  annualTailpipeCo2?: number; // kg/year
  annualFuelCost?: number;
}

export interface IEnvImpactComparison {
  co2SavedPerKm?: number; // EV vs ICE (g/km)
  co2SavedAnnual?: number; // kg/year
  evBetter: boolean;
  summary: string;
}

export interface IEnvImpactResponse {
  ev: IVehicleImpactSummary;
  ice: IVehicleImpactSummary;
  comparison: IEnvImpactComparison;
}

