import {
  jest,
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";

import fetch from "node-fetch";

import EnvImpactAnalysisService from "../../src/services/env-impact-analysis-service";
import EnvImpactAnalysisRepository from "../../src/repositories/env-impact-analysis-repository";

jest.mock("node-fetch", () => jest.fn());

const mockedFetch = jest.mocked(fetch);

describe("EnvImpactAnalysisService", () => {
  let service: EnvImpactAnalysisService;

  beforeEach(() => {
    service = new EnvImpactAnalysisService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("Case: should send selected EV and Diesel ICE data to Environmental Impact ML model", async () => {
    const evVehicle = {
      _id: "ev-1",
      model_release_year: 2024,
      make: "Kia",
      model: "EV5",
      body_style: "SUV",
      fuel_type: "Pure Electric",
      annual_tailpipe_co2: 0,
    };

    const iceVehicle = {
      _id: "ice-1",
      model_release_year: 2017,
      make: "BMW",
      model: "X3",
      body_style: "Wagon",
      fuel_type: "Diesel",
      fuel_consumption_combined: 5.7,
      annual_tailpipe_co2: 2200,
    };

    jest
      .spyOn(EnvImpactAnalysisRepository, "findEvById")
      .mockResolvedValue(evVehicle as any);

    jest
      .spyOn(EnvImpactAnalysisRepository, "findIceById")
      .mockResolvedValue(iceVehicle as any);

    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        Predicted_CO2_Savings: 151.25,
      }),
      text: async () => "",
    } as any);

    const result = await service.getComparison("ev-1", "ice-1");

    expect(mockedFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockedFetch.mock.calls[0];

    expect(url).toBe(
      "http://127.0.0.1:5000/environmentalImpact/predict"
    );

    const body = JSON.parse((options as any).body);

    expect(body.Make_EV).toBe("Kia");
    expect(body.Make_ICE).toBe("BMW");
    expect(body.BodyStyle_EV).toBe("SUV");
    expect(body.BodyStyle_ICE).toBe("Wagon");
    expect(body.FuelType_ICE).toBe("Diesel");

    expect(body.YearDiff).toBe(7);

    expect(body.ICE_CO2_Baseline).toBeCloseTo(
      5.7 * 26.5,
      5
    );

    expect(result.comparison.co2SavedPerKm).toBe(151.25);
    expect(result.comparison.evBetter).toBe(true);
  });

  test("Case: should normalise Petrol 95RON for Rashi's prediction model", async () => {
    const evVehicle = {
      _id: "ev-2",
      model_release_year: 2024,
      make: "MINI",
      model: "Countryman",
      body_style: "Wagon",
      fuel_type: "Pure Electric",
      annual_tailpipe_co2: 0,
    };

    const iceVehicle = {
      _id: "ice-2",
      model_release_year: 2020,
      make: "Toyota",
      model: "Camry",
      body_style: "Sedan",
      fuel_type: "Petrol 95RON",
      fuel_consumption_combined: 7.5,
      annual_tailpipe_co2: 2500,
    };

    jest
      .spyOn(EnvImpactAnalysisRepository, "findEvById")
      .mockResolvedValue(evVehicle as any);

    jest
      .spyOn(EnvImpactAnalysisRepository, "findIceById")
      .mockResolvedValue(iceVehicle as any);

    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        Predicted_CO2_Savings: 140.5,
      }),
      text: async () => "",
    } as any);

    await service.getComparison("ev-2", "ice-2");

    const [, options] = mockedFetch.mock.calls[0];

    const body = JSON.parse((options as any).body);

    expect(body.FuelType_ICE).toBe("Petrol95");
    expect(body.YearDiff).toBe(4);

    expect(body.ICE_CO2_Baseline).toBeCloseTo(
      7.5 * 23.2,
      5
    );
  });

  test("Case: should reject prediction when required vehicle data is missing", async () => {
    const evVehicle = {
      _id: "ev-3",
      model_release_year: 2024,
      make: "Kia",
      fuel_type: "Pure Electric",
      // body_style intentionally missing
    };

    const iceVehicle = {
      _id: "ice-3",
      model_release_year: 2019,
      make: "BMW",
      body_style: "Wagon",
      fuel_type: "Diesel",
      fuel_consumption_combined: 5.7,
    };

    jest
      .spyOn(EnvImpactAnalysisRepository, "findEvById")
      .mockResolvedValue(evVehicle as any);

    jest
      .spyOn(EnvImpactAnalysisRepository, "findIceById")
      .mockResolvedValue(iceVehicle as any);

    await expect(
      service.getComparison("ev-3", "ice-3")
    ).rejects.toThrow(
      "Vehicle body style is required for Environmental Impact prediction"
    );

    expect(mockedFetch).not.toHaveBeenCalled();
  });
});