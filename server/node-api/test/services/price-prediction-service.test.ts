import PricePredictionService from "../../src/services/price-prediction-service";

// Mock node-fetch so these tests never make a real network call
jest.mock("node-fetch", () => ({ __esModule: true, default: jest.fn() }));

import fetch from "node-fetch";

const mockFetch = fetch as unknown as jest.Mock;

/** Build a minimal fetch Response stand-in. */
const mockResponse = (status: number, body: any) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(body),
});

describe("PricePredictionService", () => {
  let service: PricePredictionService;
  const originalUrl = process.env.PRICE_API_URL;

  const validFeatures = {
    Brand: "Tesla",
    Model: "Model 3",
    Year: 2022,
    Mileage: 15000,
    "Engine Size": 0,
    "Fuel Type": "Electric",
    Transmission: "Automatic",
    Condition: "Like New",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.PRICE_API_URL;
    service = new PricePredictionService();
  });

  afterAll(() => {
    if (originalUrl === undefined) delete process.env.PRICE_API_URL;
    else process.env.PRICE_API_URL = originalUrl;
  });

  describe("base URL resolution", () => {
    test("Case: Defaults to localhost:8001 when PRICE_API_URL is not set", async () => {
      // Arrange
      mockFetch.mockResolvedValue(mockResponse(200, { status: "ok" }));

      // Act
      await service.getHealth();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("http://localhost:8001/health");
    });

    test("Case: Uses PRICE_API_URL when it is configured", async () => {
      // Arrange
      process.env.PRICE_API_URL = "http://ml-service:9000";
      mockFetch.mockResolvedValue(mockResponse(200, { status: "ok" }));

      // Act
      await service.getHealth();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("http://ml-service:9000/health");
    });

    test("Case: Strips a trailing slash so paths are not doubled", async () => {
      // Arrange
      process.env.PRICE_API_URL = "http://ml-service:9000/";
      mockFetch.mockResolvedValue(mockResponse(200, { status: "ok" }));

      // Act
      await service.getHealth();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("http://ml-service:9000/health");
    });
  });

  describe("endpoint mapping", () => {
    test("Case: getHealth calls GET /health", async () => {
      // Arrange
      const payload = { status: "ok", model_loaded: true, feature_count: 26 };
      mockFetch.mockResolvedValue(mockResponse(200, payload));

      // Act
      const result = await service.getHealth();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("http://localhost:8001/health");
      expect(result).toEqual(payload);
    });

    test("Case: getSchema calls GET /schema", async () => {
      // Arrange
      mockFetch.mockResolvedValue(mockResponse(200, { feature_columns: [] }));

      // Act
      await service.getSchema();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("http://localhost:8001/schema");
    });

    test("Case: getModelInfo calls GET /model/info", async () => {
      // Arrange
      mockFetch.mockResolvedValue(mockResponse(200, { model_type: "Pipeline" }));

      // Act
      await service.getModelInfo();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("http://localhost:8001/model/info");
    });

    test("Case: predict posts the payload to /predict as JSON", async () => {
      // Arrange
      const payload = { features: validFeatures, row_id: "web-ui" };
      mockFetch.mockResolvedValue(mockResponse(200, { predicted_price: 46183.75 }));

      // Act
      await service.predict(payload);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("http://localhost:8001/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    });

    test("Case: predictBatch posts the records to /predict/batch", async () => {
      // Arrange
      const payload = { records: [{ row_id: "a", features: validFeatures }] };
      mockFetch.mockResolvedValue(mockResponse(200, { count: 1 }));

      // Act
      await service.predictBatch(payload);

      // Assert
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("http://localhost:8001/predict/batch");
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual(payload);
    });

    test("Case: Feature names containing spaces survive JSON serialisation", async () => {
      // Arrange
      mockFetch.mockResolvedValue(mockResponse(200, {}));

      // Act
      await service.predict({ features: validFeatures });

      // Assert
      const sent = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sent.features).toHaveProperty("Engine Size", 0);
      expect(sent.features).toHaveProperty("Fuel Type", "Electric");
    });
  });

  describe("error handling", () => {
    test("Case: Converts a connection refusal into a 503 with actionable guidance", async () => {
      // Arrange
      const refused: any = new Error("request to http://localhost:8001/health failed");
      refused.code = "ECONNREFUSED";
      mockFetch.mockRejectedValue(refused);

      // Act + Assert
      await expect(service.getHealth()).rejects.toMatchObject({
        status: 503,
        message: expect.stringContaining("not reachable at http://localhost:8001"),
      });
    });

    test("Case: Includes the start command in the unreachable message", async () => {
      // Arrange
      const refused: any = new Error("fetch failed");
      mockFetch.mockRejectedValue(refused);

      // Act + Assert
      await expect(service.getHealth()).rejects.toMatchObject({
        message: expect.stringContaining("npm run dev:price"),
      });
    });

    test("Case: Preserves the upstream status code for a non-2xx response", async () => {
      // Arrange
      mockFetch.mockResolvedValue(mockResponse(503, { detail: "Model not loaded." }));

      // Act + Assert
      await expect(service.predict({ features: validFeatures })).rejects.toMatchObject({
        status: 503,
        message: "Model not loaded.",
      });
    });

    test("Case: Flattens a FastAPI validation detail array into one message", async () => {
      // Arrange
      mockFetch.mockResolvedValue(
        mockResponse(422, {
          detail: [{ msg: "field required" }, { msg: "value is not a valid float" }],
        })
      );

      // Act + Assert
      await expect(service.predict({ features: validFeatures })).rejects.toMatchObject({
        status: 422,
        message: "field required; value is not a valid float",
      });
    });

    test("Case: Falls back to a generic message when the error body cannot be parsed", async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error("not json")),
      });

      // Act + Assert
      await expect(service.getHealth()).rejects.toMatchObject({
        status: 500,
        message: "Price ML service error: 500",
      });
    });

    test("Case: Wraps an unexpected non-network failure as a 500", async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error("something unexpected"));

      // Act + Assert
      await expect(service.getHealth()).rejects.toMatchObject({
        status: 500,
        message: "something unexpected",
      });
    });
  });
});
