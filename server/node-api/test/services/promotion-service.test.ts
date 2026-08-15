import PromotionService from "../../src/services/promotion-service";
import PromotionRepository from "../../src/repositories/promotion-repository";
import ChargingStationRepository from "../../src/repositories/station-repository";

jest.mock("../../src/repositories/promotion-repository");
jest.mock("../../src/repositories/station-repository");

describe("promotion-service", () => {
  let service: PromotionService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new PromotionService();
  });

  describe("getNearbyPromotions", () => {
    test("Case: Returns nearby promotions sorted by distance", async () => {
      const mockPromos = [
        { _id: { toString: () => "a" }, title: "Far", distanceMeters: 400, latitude: -37.81, longitude: 144.96 },
        { _id: { toString: () => "b" }, title: "Near", distanceMeters: 80, latitude: -37.81, longitude: 144.96 },
      ];
      (PromotionRepository.findNearby as jest.Mock).mockResolvedValue(mockPromos);

      const result = await service.getNearbyPromotions({
        latitude: -37.8136,
        longitude: 144.9631,
        includeFallbacks: false,
      });

      expect(PromotionRepository.findNearby).toHaveBeenCalledWith(
        144.9631,
        -37.8136,
        800,
        expect.objectContaining({ isActive: true }),
      );
      expect(result.map((promo) => promo.title)).toEqual(["Near", "Far"]);
    });

    test("Case: Returns fallback offers when none are stored nearby", async () => {
      (PromotionRepository.findNearby as jest.Mock).mockResolvedValue([]);

      const result = await service.getNearbyPromotions({
        latitude: -37.8136,
        longitude: 144.9631,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((promo) => promo.isFallback)).toBe(true);
    });

    test("Case: Rejects invalid coordinates", async () => {
      await expect(
        service.getNearbyPromotions({
          latitude: 200,
          longitude: 144.96,
        })
      ).rejects.toThrow("latitude must be between -90 and 90");
    });

    test("Case: Filters by category", async () => {
      (PromotionRepository.findNearby as jest.Mock).mockResolvedValue([]);

      await service.getNearbyPromotions({
        latitude: -37.8136,
        longitude: 144.9631,
        category: "coffee",
        includeFallbacks: false,
      });

      expect(PromotionRepository.findNearby).toHaveBeenCalledWith(
        144.9631,
        -37.8136,
        800,
        expect.objectContaining({ category: "coffee", isActive: true }),
      );
    });
  });

  describe("getNearbyForStation", () => {
    test("Case: Looks up station coordinates then finds nearby offers", async () => {
      (ChargingStationRepository.findById as jest.Mock).mockResolvedValue({
        latitude: -37.8136,
        longitude: 144.9631,
      });
      (PromotionRepository.findNearby as jest.Mock).mockResolvedValue([
        { _id: { toString: () => "p1" }, title: "Coffee", distanceMeters: 100 },
      ]);
      (PromotionRepository.findByStationId as jest.Mock).mockResolvedValue([]);

      const result = await service.getNearbyForStation("station123", 1, undefined, false);

      expect(ChargingStationRepository.findById).toHaveBeenCalledWith("station123");
      expect(PromotionRepository.findNearby).toHaveBeenCalledWith(
        144.9631,
        -37.8136,
        1000,
        expect.any(Object),
      );
      expect(result).toHaveLength(1);
    });

    test("Case: Throws when station does not exist", async () => {
      (ChargingStationRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.getNearbyForStation("missing")).rejects.toThrow(
        "Charging station not found"
      );
    });
  });

  describe("createPromotion", () => {
    test("Case: Creates a promotion with a GeoJSON point", async () => {
      const saved = { _id: "new", title: "Charge & Sip" };
      (PromotionRepository.create as jest.Mock).mockResolvedValue(saved);

      const result = await service.createPromotion({
        title: "Charge & Sip",
        businessName: "Cafe",
        category: "coffee",
        discountLabel: "20% off",
        latitude: -37.81,
        longitude: 144.96,
      });

      expect(PromotionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Charge & Sip",
          location: { type: "Point", coordinates: [144.96, -37.81] },
          isActive: true,
        })
      );
      expect(result).toEqual(saved);
    });

    test("Case: Rejects missing required fields", async () => {
      await expect(
        service.createPromotion({
          title: "Incomplete",
          latitude: -37.81,
          longitude: 144.96,
        } as any)
      ).rejects.toThrow("title, businessName, discountLabel, and category are required");
    });
  });

  describe("seedSamplePromotions", () => {
    test("Case: Skips seeding when promotions already exist", async () => {
      (PromotionRepository.count as jest.Mock).mockResolvedValue(4);

      const result = await service.seedSamplePromotions();

      expect(result).toEqual({ inserted: 0, skipped: true });
      expect(PromotionRepository.createMany).not.toHaveBeenCalled();
    });

    test("Case: Inserts sample promotions when the collection is empty", async () => {
      (PromotionRepository.count as jest.Mock).mockResolvedValue(0);
      (PromotionRepository.createMany as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const result = await service.seedSamplePromotions();

      expect(PromotionRepository.createMany).toHaveBeenCalled();
      expect(result).toEqual({ inserted: 2, skipped: false });
    });
  });
});
