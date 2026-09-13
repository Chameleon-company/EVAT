import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import axios from "axios";

import PersonalisedEVInsightsRepository from "../../src/repositories/personalised-ev-insights-repository";
import PersonalisedEVInsightsService from "../../src/services/personalised-ev-insights-service";

jest.mock("axios");

const mockedAxios = jest.mocked(axios);

const payload = {
  weekly_km: 300,
  trip_length: "Mostly medium trips (10-50 km)",
  driving_frequency: "Daily",
  driving_type: "A mix of city/suburban and highway driving",
  road_trips: "No",
  car_ownership: "Yes - Petrol",
  fuel_efficiency: 8,
  monthly_fuel_spend: 300,
  home_charging: "Yes",
  solar_panels: "Yes",
  charging_preference: "Home",
  budget: "$60,000-$80,000",
  priorities: "Affordability, Environmental impact",
  postcode: "3000",
};

const suitability = {
  evReadinessScore: 98,
  recommendationCategory: "Full EV Recommended",
  annualKm: 15600,
  estimatedAnnualFuelCost: 3600,
  estimatedAnnualEvChargingCost: 312,
  estimatedAnnualSavings: 3288,
  estimatedAnnualCo2ReductionKg: 2758.08,
  personalisedPredictionInsight: "Strong EV suitability.",
  scoreComponents: {
    drivingDemand: 20,
    financialBenefit: 25,
    chargingPracticality: 25,
    solarAccess: 10,
    environmentalPriority: 10,
    budgetReadiness: 8,
    roadTripPenalty: 0,
  },
  assumptions: {
    chargingProfile: "solar",
    evEnergyKwhPerKm: 0.18,
    evCostPerKm: 0.02,
    electricityCo2KgPerKwh: 0.05,
  },
};

describe("PersonalisedEVInsightsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("persists the 013S1 suitability prediction", async () => {
    jest
      .spyOn(PersonalisedEVInsightsRepository, "createInsight")
      .mockResolvedValue({ _id: { toString: () => "insight-1" } } as any);
    const update = jest
      .spyOn(PersonalisedEVInsightsRepository, "updateInsightWithResult")
      .mockResolvedValue({} as any);
    mockedAxios.post.mockResolvedValue({
      data: { cluster: 1, suitability },
    });

    const service = new PersonalisedEVInsightsService();
    await service.submitInsights("user-1", "user@example.com", payload);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("/personalisedEVInsights/predict"),
      payload
    );
    expect(update).toHaveBeenCalledWith(
      "insight-1",
      expect.objectContaining({
        cluster: 1,
        evReadinessScore: 98,
        recommendationCategory: "Full EV Recommended",
        estimatedAnnualSavings: 3288,
        estimatedAnnualCo2ReductionKg: 2758.08,
      })
    );
  });

  test("rejects malformed suitability responses", async () => {
    jest
      .spyOn(PersonalisedEVInsightsRepository, "createInsight")
      .mockResolvedValue({ _id: { toString: () => "insight-1" } } as any);
    const update = jest.spyOn(
      PersonalisedEVInsightsRepository,
      "updateInsightWithResult"
    );
    mockedAxios.post.mockResolvedValue({
      data: { cluster: 1, suitability: { evReadinessScore: 101 } },
    });

    const service = new PersonalisedEVInsightsService();

    await expect(
      service.submitInsights("user-1", "user@example.com", payload)
    ).rejects.toThrow("Invalid suitability response from Python API");
    expect(update).not.toHaveBeenCalled();
  });
});
