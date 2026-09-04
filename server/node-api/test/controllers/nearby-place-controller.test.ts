import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import { Request } from "express";
import NearbyPlaceController from "../../src/controllers/nearby-place-controller";
import NearbyPlaceService from "../../src/services/nearby-place-service";

jest.mock("../../src/services/nearby-place-service");

describe("NearbyPlaceController", () => {
  let controller: NearbyPlaceController;
  let mockService: any;
  let mockResponse: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = new NearbyPlaceService() as any;
    controller = new NearbyPlaceController(mockService);
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("getNearby", () => {
    test("Case: Returns nearby places", async () => {
      mockService.getNearbyPlaces = (jest.fn() as any).mockResolvedValue([
        {
          id: "place1",
          name: "Local Cafe",
          category: "food",
          typeLabel: "Cafe",
          distanceMeters: 120,
        },
      ]);

      await controller.getNearby(
        { query: { lat: "-37.81", lon: "144.96", category: "food" } } as unknown as Request,
        mockResponse
      );

      expect(mockService.getNearbyPlaces).toHaveBeenCalledWith(
        -37.81,
        144.96,
        undefined,
        "food"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    test("Case: Returns 400 for invalid input", async () => {
      mockService.getNearbyPlaces = (jest.fn() as any)
        .mockRejectedValue(new Error("latitude and longitude are required"));

      await controller.getNearby(
        { query: {} } as unknown as Request,
        mockResponse
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getNearbyForStation", () => {
    test("Case: Returns 404 when station is missing", async () => {
      mockService.getNearbyForStation = (jest.fn() as any)
        .mockRejectedValue(new Error("Charging station not found"));

      await controller.getNearbyForStation(
        { params: { stationId: "missing" }, query: {} } as unknown as Request,
        mockResponse
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Charging station not found",
      });
    });
  });

  describe("getPhoto", () => {
    test("Case: Returns the proxied photo bytes", async () => {
      mockService.getPhoto = (jest.fn() as any).mockResolvedValue({
        bytes: Buffer.from("photo-bytes"),
        contentType: "image/jpeg",
      });
      mockResponse.send = jest.fn().mockReturnThis();
      mockResponse.set = jest.fn().mockReturnThis();

      await controller.getPhoto(
        { query: { name: "places/ChIJ123/photos/abc" } } as unknown as Request,
        mockResponse
      );

      expect(mockService.getPhoto).toHaveBeenCalledWith("places/ChIJ123/photos/abc");
      expect(mockResponse.set).toHaveBeenCalledWith("Content-Type", "image/jpeg");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(Buffer.from("photo-bytes"));
    });

    test("Case: Returns 400 for an invalid photo name", async () => {
      mockService.getPhoto = (jest.fn() as any)
        .mockRejectedValue(new Error("Invalid photo name"));

      await controller.getPhoto(
        { query: { name: "bad" } } as unknown as Request,
        mockResponse
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});
