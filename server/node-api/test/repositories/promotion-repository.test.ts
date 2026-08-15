import PromotionRepository from "../../src/repositories/promotion-repository";
import Promotion from "../../src/models/promotion-model";

jest.mock("../../src/models/promotion-model", () => {
  return {
    __esModule: true,
    default: {
      aggregate: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
      countDocuments: jest.fn(),
      insertMany: jest.fn(),
    },
  };
});

describe("promotion-repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findNearby", () => {
    test("Case: Queries promotions with $geoNear", async () => {
      const mockPromos = [{ title: "Charge & Sip", distanceMeters: 90 }];
      (Promotion.aggregate as jest.Mock).mockResolvedValue(mockPromos);

      const result = await PromotionRepository.findNearby(144.96, -37.81, 800, { isActive: true });

      expect(Promotion.aggregate).toHaveBeenCalledWith([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [144.96, -37.81] },
            distanceField: "distanceMeters",
            maxDistance: 800,
            spherical: true,
            query: { isActive: true },
          },
        },
        { $limit: 25 },
      ]);
      expect(result).toEqual(mockPromos);
    });
  });

  describe("findByStationId", () => {
    test("Case: Finds promotions linked to a station", async () => {
      const mockPromos = [{ title: "Linked offer" }];
      const mockExec = jest.fn().mockResolvedValue(mockPromos);
      (Promotion.find as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await PromotionRepository.findByStationId("station1", { isActive: true });

      expect(Promotion.find).toHaveBeenCalledWith({
        stationIds: "station1",
        isActive: true,
      });
      expect(result).toEqual(mockPromos);
    });
  });

  describe("findById", () => {
    test("Case: Returns a promotion when it exists", async () => {
      const mockPromo = { _id: "promo1", title: "Charge & Sip" };
      const mockExec = jest.fn().mockResolvedValue(mockPromo);
      (Promotion.findById as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await PromotionRepository.findById("promo1");

      expect(Promotion.findById).toHaveBeenCalledWith("promo1");
      expect(result).toEqual(mockPromo);
    });
  });
});
