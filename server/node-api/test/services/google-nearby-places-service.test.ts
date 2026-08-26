import {
  includedTypesForCategory,
  buildWalkingDirectionsUrl,
  haversineMeters,
  isValidPhotoName,
} from "../../src/services/google-nearby-places-service";

describe("google-nearby-places-service helpers", () => {
  test("Case: Maps food and shopping categories to Google place types", () => {
    expect(includedTypesForCategory("food")).toContain("restaurant");
    expect(includedTypesForCategory("shopping")).toContain("shopping_mall");
    expect(includedTypesForCategory("all").length).toBeGreaterThan(2);
  });

  test("Case: Rejects unknown categories", () => {
    expect(() => includedTypesForCategory("coffee")).toThrow("Invalid category");
  });

  test("Case: Builds a walking directions URL from charger to place coordinates", () => {
    const url = buildWalkingDirectionsUrl(-37.81, 144.96, -37.812, 144.965);
    expect(url).toContain("https://www.google.com/maps/dir/");
    expect(url).toContain("-37.81,144.96");
    expect(url).toContain("-37.812,144.965");
    expect(url).toContain("data=!3e2");
    expect(url).not.toContain("Local Cafe");
  });

  test("Case: Computes distance between nearby coordinates", () => {
    const meters = haversineMeters(-37.8136, 144.9631, -37.814, 144.9635);
    expect(meters).toBeGreaterThan(0);
    expect(meters).toBeLessThan(200);
  });

  test("Case: Accepts Google Places photo resource names", () => {
    expect(isValidPhotoName("places/ChIJ123/photos/AUacShh")).toBe(true);
    expect(isValidPhotoName("../secret")).toBe(false);
    expect(isValidPhotoName("https://evil.example/photo")).toBe(false);
  });
});
