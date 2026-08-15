import { Request, Response } from "express";
import PromotionController from "../../src/controllers/promotion-controller";
import PromotionService from "../../src/services/promotion-service";

jest.mock("../../src/services/promotion-service");

describe("PromotionController", () => {
  let controller: PromotionController;
  let mockService: jest.Mocked<PromotionService>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = new PromotionService() as jest.Mocked<PromotionService>;
    controller = new PromotionController(mockService);
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("getNearby", () => {
    test("Case: Returns nearby promotions", async () => {
      mockService.getNearbyPromotions = jest.fn().mockResolvedValue([
        {
          _id: { toString: () => "p1" },
          title: "Charge & Sip",
          businessName: "Cafe",
          category: "coffee",
          discountLabel: "20% off",
          latitude: -37.81,
          longitude: 144.96,
          stationIds: [],
          isActive: true,
          distanceMeters: 120,
        },
      ]);

      await controller.getNearby(
        { query: { lat: "-37.81", lon: "144.96" } } as unknown as Request,
        mockResponse as Response
      );

      expect(mockService.getNearbyPromotions).toHaveBeenCalledWith({
        latitude: -37.81,
        longitude: 144.96,
        radiusKm: undefined,
        category: undefined,
        stationId: undefined,
        includeFallbacks: true,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    test("Case: Returns 400 for invalid input", async () => {
      mockService.getNearbyPromotions = jest
        .fn()
        .mockRejectedValue(new Error("latitude and longitude are required"));

      await controller.getNearby(
        { query: {} } as unknown as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getNearbyForStation", () => {
    test("Case: Returns 404 when station is missing", async () => {
      mockService.getNearbyForStation = jest
        .fn()
        .mockRejectedValue(new Error("Charging station not found"));

      await controller.getNearbyForStation(
        { params: { stationId: "missing" }, query: {} } as unknown as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Charging station not found",
      });
    });
  });

  describe("createPromotion", () => {
    test("Case: Creates a promotion", async () => {
      mockService.createPromotion = jest.fn().mockResolvedValue({
        _id: { toString: () => "new" },
        title: "Charge & Sip",
        businessName: "Cafe",
        category: "coffee",
        discountLabel: "20% off",
        latitude: -37.81,
        longitude: 144.96,
        stationIds: [],
        isActive: true,
      });

      await controller.createPromotion(
        {
          body: {
            title: "Charge & Sip",
            businessName: "Cafe",
            category: "coffee",
            discountLabel: "20% off",
            latitude: -37.81,
            longitude: 144.96,
          },
        } as unknown as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });
});
