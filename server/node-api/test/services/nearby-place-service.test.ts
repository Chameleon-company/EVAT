import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import NearbyPlaceService from "../../src/services/nearby-place-service";
import ChargingStationRepository from "../../src/repositories/station-repository";
import GoogleNearbyPlacesService from "../../src/services/google-nearby-places-service";
import axios from "axios";

jest.mock("axios");
jest.mock("../../src/repositories/station-repository");
jest.mock("../../src/services/google-nearby-places-service", () => ({
  __esModule: true,
  default: {
    findNearbyPlaces: jest.fn(),
    getPhotoUri: jest.fn(),
  },
}));

describe("nearby-place-service", () => {
  let service: NearbyPlaceService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new NearbyPlaceService();
  });

  describe("getNearbyPlaces", () => {
    test("Case: Calls Google Places with charger coordinates", async () => {
      const places = [{ id: "1", name: "Local Cafe", distanceMeters: 120 }];
      (GoogleNearbyPlacesService.findNearbyPlaces as any).mockResolvedValue(places);

      const result = await service.getNearbyPlaces(-37.8136, 144.9631, 1, "food");

      expect(GoogleNearbyPlacesService.findNearbyPlaces).toHaveBeenCalledWith(
        -37.8136,
        144.9631,
        1000,
        "food"
      );
      expect(result).toEqual(places);
    });

    test("Case: Rejects invalid coordinates", async () => {
      await expect(service.getNearbyPlaces(200, 144.96)).rejects.toThrow(
        "latitude must be between -90 and 90"
      );
    });
  });

  describe("getNearbyForStation", () => {
    test("Case: Looks up the station then searches nearby places", async () => {
      (ChargingStationRepository.findById as any).mockResolvedValue({
        latitude: -37.8136,
        longitude: 144.9631,
      });
      (GoogleNearbyPlacesService.findNearbyPlaces as any).mockResolvedValue([
        { id: "mall", name: "Melbourne Central" },
      ]);

      const result = await service.getNearbyForStation("station123", undefined, "shopping");

      expect(ChargingStationRepository.findById).toHaveBeenCalledWith("station123");
      expect(result).toHaveLength(1);
    });

    test("Case: Throws when the station does not exist", async () => {
      (ChargingStationRepository.findById as any).mockResolvedValue(null);

      await expect(service.getNearbyForStation("missing")).rejects.toThrow(
        "Charging station not found"
      );
    });
  });

  describe("getPhotoUri", () => {
    test("Case: Asks Google Places for the photo URI", async () => {
      (GoogleNearbyPlacesService.getPhotoUri as any).mockResolvedValue(
        "https://lh3.googleusercontent.com/photo"
      );

      const result = await service.getPhotoUri("places/ChIJ123/photos/abc");

      expect(GoogleNearbyPlacesService.getPhotoUri).toHaveBeenCalledWith(
        "places/ChIJ123/photos/abc"
      );
      expect(result).toBe("https://lh3.googleusercontent.com/photo");
    });
  });

  describe("getPhoto", () => {
    test("Case: Downloads photo bytes from the Google photo URI", async () => {
      (GoogleNearbyPlacesService.getPhotoUri as any).mockResolvedValue(
        "https://lh3.googleusercontent.com/photo"
      );
      (axios.get as any).mockResolvedValue({
        data: Buffer.from("img"),
        headers: { "content-type": "image/jpeg" },
      });

      const result = await service.getPhoto("places/ChIJ123/photos/abc");

      expect(axios.get).toHaveBeenCalledWith("https://lh3.googleusercontent.com/photo", {
        responseType: "arraybuffer",
        timeout: 8000,
      });
      expect(result.contentType).toBe("image/jpeg");
      expect(Buffer.isBuffer(result.bytes)).toBe(true);
    });
  });
});
