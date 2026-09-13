import PricePredictionService from "../../src/services/price-prediction-service";

// The service calls Node's built-in fetch, so swap it for a mock and never touch the network
const mockFetch = jest.fn();
const originalFetch = (global as any).fetch;

/** Build a minimal fetch Response stand-in. */
const mockResponse = (status: number, body: any) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(body),
});

describe("PricePredictionService", () => {
  let service: PricePredictionService;
  const originalUrl = process.env.PYTHON_API_URL;
  const BASE = "http://127.0.0.1:5000/pricePrediction";

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
    mockFetch.mockReset();
    (global as any).fetch = mockFetch;
    delete process.env.PYTHON_API_URL;
    service = new PricePredictionService();
  });

  afterAll(() => {
    (global as any).fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.PYTHON_API_URL;
    else process.env.PYTHON_API_URL = originalUrl;
  });

  describe("base URL resolution", () => {
    test("Case: Defaults to the local Python service when PYTHON_API_URL is not set", async () => {
      // Arrange
      mockFetch.mockResolvedValue(mockResponse(200, { status: "ok" }));

      // Act
      await service.getHealth();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:5000/pricePrediction/health");
    });

    test("Case: Uses PYTHON_API_URL when it is configured", async () => {
      // Arrange
      process.env.PYTHON_API_URL = "http://pythonsvc:5000";
      mockFetch.mockResolvedValue(mockResponse(200, { status: "ok" }));

      // Act
      await service.getHealth();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("http://pythonsvc:5000/pricePrediction/health");
    });

    test("Case: Strips a trailing slash so paths are not doubled", async () => {
      // Arrange
      process.env.PYTHON_API_URL = "http://pythonsvc:5000/";
      mockFetch.mockResolvedValue(mockResponse(200, { status: "ok" }));

      // Act
      await service.getHealth();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("http://pythonsvc:5000/pricePrediction/health");
    });

    test("Case: Reads PYTHON_API_URL on each call, not only when the module loads", async () => {
      // Arrange
      mockFetch.mockResolvedValue(mockResponse(200, { status: "ok" }));
      await service.getHealth();
      process.env.PYTHON_API_URL = "http://pythonsvc:5000";

      // Act
      await service.getHealth();

      // Assert
      expect(mockFetch).toHaveBeenNthCalledWith(1, "http://127.0.0.1:5000/pricePrediction/health");
      expect(mockFetch).toHaveBeenNthCalledWith(2, "http://pythonsvc:5000/pricePrediction/health");
    });
  });

  describe("endpoint mapping", () => {
    test("Case: getHealth calls GET /pricePrediction/health", async () => {
      // Arrange
      const payload = { status: "ok", model_loaded: true, feature_count: 26 };
      mockFetch.mockResolvedValue(mockResponse(200, payload));

      // Act
      const result = await service.getHealth();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`${BASE}/health`);
      expect(result).toEqual(payload);
    });

    test("Case: getSchema calls GET /pricePrediction/schema", async () => {
      // Arrange
      mockFetch.mockResolvedValue(mockResponse(200, { feature_columns: [] }));

      // Act
      await service.getSchema();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`${BASE}/schema`);
    });

    test("Case: getModelInfo calls GET /pricePrediction/model/info", async () => {
      // Arrange
      mockFetch.mockResolvedValue(mockResponse(200, { model_type: "Pipeline" }));

      // Act
      await service.getModelInfo();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`${BASE}/model/info`);
    });

    test("Case: predict posts the payload to /pricePrediction/predict as JSON", async () => {
      // Arrange
      const payload = { features: validFeatures, row_id: "web-ui" };
      mockFetch.mockResolvedValue(mockResponse(200, { predicted_price: 46183.75 }));

      // Act
      await service.predict(payload);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`${BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    });

    test("Case: predictBatch posts the records to /pricePrediction/predict/batch", async () => {
      // Arrange
      const payload = { records: [{ row_id: "a", features: validFeatures }] };
      mockFetch.mockResolvedValue(mockResponse(200, { count: 1 }));

      // Act
      await service.predictBatch(payload);

      // Assert
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe(`${BASE}/predict/batch`);
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
      const refused: any = new Error("fetch failed");
      refused.cause = { code: "ECONNREFUSED" };
      mockFetch.mockRejectedValue(refused);

      // Act + Assert
      await expect(service.getHealth()).rejects.toMatchObject({
        status: 503,
        message: expect.stringContaining(`not reachable at ${BASE}`),
      });
    });

    test("Case: Includes the start command in the unreachable message", async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error("fetch failed"));

      // Act + Assert
      await expect(service.getHealth()).rejects.toMatchObject({
        message: expect.stringContaining("npm run dev:python"),
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
