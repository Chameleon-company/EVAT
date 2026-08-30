import { Request, Response } from "express";
import PricePredictionController from "../../src/controllers/price-prediction-controller";
import PricePredictionService from "../../src/services/price-prediction-service";

// node-fetch is ESM-only; stub it so requiring the service under test does not
// pull the real module into Jest's CommonJS runtime.
jest.mock("node-fetch", () => ({ __esModule: true, default: jest.fn() }));

// Mock the PricePredictionService so these tests never touch the real ML service
jest.mock("../../src/services/price-prediction-service");

describe("PricePredictionController", () => {
  // Controller instance
  let controller: PricePredictionController;
  // Mock price prediction service
  let mockService: jest.Mocked<PricePredictionService>;
  // Mock request and response objects
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  // A realistic feature set, matching the vehicle fields the web form sends
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
    // Reset mocks and create fresh instances before each test
    jest.clearAllMocks();

    mockService = new PricePredictionService() as jest.Mocked<PricePredictionService>;
    controller = new PricePredictionController(mockService);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("getHealth", () => {
    test("Case: Successfully returns the ML service health payload", async () => {
      // Arrange
      const health = {
        status: "ok",
        model_loaded: true,
        timestamp: "2026-08-30T00:00:00",
        feature_count: 26,
      };
      mockRequest = {};
      mockService.getHealth = jest.fn().mockResolvedValue(health);

      // Act
      await controller.getHealth(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockService.getHealth).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(health);
    });

    test("Case: Surfaces the 503 raised when the ML service is unreachable", async () => {
      // Arrange
      const unreachable = Object.assign(
        new Error("Price prediction ML service is not reachable at http://localhost:8001."),
        { status: 503 }
      );
      mockRequest = {};
      mockService.getHealth = jest.fn().mockRejectedValue(unreachable);

      // Act
      await controller.getHealth(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: unreachable.message });
    });

    test("Case: Falls back to 500 when the failure carries no status", async () => {
      // Arrange
      mockRequest = {};
      mockService.getHealth = jest.fn().mockRejectedValue(new Error("boom"));

      // Act
      await controller.getHealth(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "boom" });
    });
  });

  describe("getSchema", () => {
    test("Case: Successfully returns the feature schema", async () => {
      // Arrange
      const schema = {
        feature_columns: ["Brand", "Model", "Year"],
        numeric_columns: ["Year"],
        categorical_columns: ["Brand", "Model"],
        feature_descriptions: {},
        schema_source: "model",
      };
      mockRequest = {};
      mockService.getSchema = jest.fn().mockResolvedValue(schema);

      // Act
      await controller.getSchema(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(schema);
    });

    test("Case: Surfaces a 503 when the schema is not loaded", async () => {
      // Arrange
      const notLoaded = Object.assign(new Error("Schema not loaded yet."), { status: 503 });
      mockRequest = {};
      mockService.getSchema = jest.fn().mockRejectedValue(notLoaded);

      // Act
      await controller.getSchema(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "Schema not loaded yet." });
    });
  });

  describe("getModelInfo", () => {
    test("Case: Successfully returns the model information", async () => {
      // Arrange
      const info = {
        model_type: "Pipeline",
        pipeline_steps: ["preprocess", "model"],
        n_features_in: 26,
        schema_source: "model",
      };
      mockRequest = {};
      mockService.getModelInfo = jest.fn().mockResolvedValue(info);

      // Act
      await controller.getModelInfo(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(info);
    });

    test("Case: Surfaces a 503 when the model is not loaded", async () => {
      // Arrange
      const notLoaded = Object.assign(new Error("Model not loaded."), { status: 503 });
      mockRequest = {};
      mockService.getModelInfo = jest.fn().mockRejectedValue(notLoaded);

      // Act
      await controller.getModelInfo(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "Model not loaded." });
    });
  });

  describe("predict", () => {
    test("Case: Successfully returns a prediction for a valid feature set", async () => {
      // Arrange
      const prediction = {
        row_id: "web-ui",
        predicted_log_price: 10.7404,
        predicted_price: 46183.75,
        missing_features: [],
        extra_features: [],
        derived_features: ["car_age", "log_mileage"],
      };
      mockRequest = { body: { features: validFeatures, row_id: "web-ui" } };
      mockService.predict = jest.fn().mockResolvedValue(prediction);

      // Act
      await controller.predict(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockService.predict).toHaveBeenCalledWith({
        features: validFeatures,
        row_id: "web-ui",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(prediction);
    });

    test("Case: Passes the feature keys through unchanged, including names containing spaces", async () => {
      // Arrange
      mockRequest = { body: { features: validFeatures } };
      mockService.predict = jest.fn().mockResolvedValue({});

      // Act
      await controller.predict(mockRequest as Request, mockResponse as Response);

      // Assert
      const forwarded = mockService.predict.mock.calls[0][0].features;
      expect(Object.keys(forwarded)).toEqual(Object.keys(validFeatures));
      expect(forwarded["Engine Size"]).toBe(0);
      expect(forwarded["Fuel Type"]).toBe("Electric");
    });

    test("Case: Rejects a request with no features field", async () => {
      // Arrange
      mockRequest = { body: { row_id: "no-features" } };
      mockService.predict = jest.fn();

      // Act
      await controller.predict(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockService.predict).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Missing required field: features (object)",
      });
    });

    test("Case: Rejects a null features value", async () => {
      // Arrange
      mockRequest = { body: { features: null } };
      mockService.predict = jest.fn();

      // Act
      await controller.predict(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockService.predict).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    test("Case: Rejects an array supplied where a features object is expected", async () => {
      // Arrange
      mockRequest = { body: { features: [1, 2, 3] } };
      mockService.predict = jest.fn();

      // Act
      await controller.predict(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockService.predict).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    test("Case: Surfaces the 503 raised when the ML service is unreachable", async () => {
      // Arrange
      const unreachable = Object.assign(new Error("not reachable"), { status: 503 });
      mockRequest = { body: { features: validFeatures } };
      mockService.predict = jest.fn().mockRejectedValue(unreachable);

      // Act
      await controller.predict(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "not reachable" });
    });

    test("Case: Surfaces a 422 validation error raised by the ML service", async () => {
      // Arrange
      const invalid = Object.assign(new Error("features: Field required"), { status: 422 });
      mockRequest = { body: { features: validFeatures } };
      mockService.predict = jest.fn().mockRejectedValue(invalid);

      // Act
      await controller.predict(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "features: Field required" });
    });
  });

  describe("predict — feature validation", () => {
    /** Run predict with the given features and return the message sent back. */
    const rejectionFor = async (features: Record<string, unknown>) => {
      mockRequest = { body: { features } };
      mockService.predict = jest.fn();
      await controller.predict(mockRequest as Request, mockResponse as Response);
      return (mockResponse.json as jest.Mock).mock.calls[0][0].message as string;
    };

    test("Case: Rejects an empty feature set instead of predicting from defaults", async () => {
      // Arrange + Act
      const message = await rejectionFor({});

      // Assert
      expect(mockService.predict).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(message).toContain("Missing required feature(s)");
      expect(message).toContain("Brand");
      expect(message).toContain("Condition");
    });

    test("Case: Rejects a partially specified vehicle", async () => {
      // Arrange + Act
      const message = await rejectionFor({ Brand: "Tesla" });

      // Assert
      expect(mockService.predict).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(message).toContain("Missing required feature(s)");
    });

    test("Case: Names the specific field that was omitted", async () => {
      // Arrange
      const { Condition, ...withoutCondition } = validFeatures;

      // Act
      const message = await rejectionFor(withoutCondition);

      // Assert
      expect(message).toBe("Missing required feature(s): Condition");
    });

    test("Case: Accepts an Engine Size of zero for an electric vehicle", async () => {
      // Arrange
      mockRequest = { body: { features: { ...validFeatures, "Engine Size": 0 } } };
      mockService.predict = jest.fn().mockResolvedValue({ predicted_price: 46183.75 });

      // Act
      await controller.predict(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockService.predict).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    test("Case: Rejects a non-numeric Year", async () => {
      // Arrange + Act
      const message = await rejectionFor({ ...validFeatures, Year: "not-a-year" });

      // Assert
      expect(mockService.predict).not.toHaveBeenCalled();
      expect(message).toBe("Invalid value for Year: expected a number");
    });

    test("Case: Rejects a Year outside a plausible range", async () => {
      // Arrange + Act
      const message = await rejectionFor({ ...validFeatures, Year: 1800 });

      // Assert
      expect(mockService.predict).not.toHaveBeenCalled();
      expect(message).toContain("Invalid value for Year");
    });

    test("Case: Rejects a negative Mileage", async () => {
      // Arrange + Act
      const message = await rejectionFor({ ...validFeatures, Mileage: -5000 });

      // Assert
      expect(mockService.predict).not.toHaveBeenCalled();
      expect(message).toContain("Invalid value for Mileage");
    });

    test("Case: Rejects a negative Engine Size", async () => {
      // Arrange + Act
      const message = await rejectionFor({ ...validFeatures, "Engine Size": -1 });

      // Assert
      expect(mockService.predict).not.toHaveBeenCalled();
      expect(message).toContain("Invalid value for Engine Size");
    });

    test("Case: Rejects a non-text Brand", async () => {
      // Arrange + Act
      const message = await rejectionFor({ ...validFeatures, Brand: 12345 });

      // Assert
      expect(mockService.predict).not.toHaveBeenCalled();
      expect(message).toBe("Invalid value for Brand: expected text");
    });

    test("Case: Rejects a blank Brand", async () => {
      // Arrange + Act
      const message = await rejectionFor({ ...validFeatures, Brand: "   " });

      // Assert
      expect(mockService.predict).not.toHaveBeenCalled();
      expect(message).toBe("Missing required feature(s): Brand");
    });

    test("Case: Still forwards a fully specified vehicle unchanged", async () => {
      // Arrange
      mockRequest = { body: { features: validFeatures, row_id: "web-ui" } };
      mockService.predict = jest.fn().mockResolvedValue({ predicted_price: 46183.75 });

      // Act
      await controller.predict(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockService.predict).toHaveBeenCalledWith({
        features: validFeatures,
        row_id: "web-ui",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe("predictBatch", () => {
    test("Case: Successfully returns predictions for a batch of records", async () => {
      // Arrange
      const batch = {
        predictions: [
          { row_id: "a", predicted_price: 46183.75 },
          { row_id: "b", predicted_price: 44731.2 },
        ],
        count: 2,
        timestamp: "2026-08-30T00:00:00",
      };
      mockRequest = {
        body: {
          records: [
            { row_id: "a", features: validFeatures },
            { row_id: "b", features: validFeatures },
          ],
        },
      };
      mockService.predictBatch = jest.fn().mockResolvedValue(batch);

      // Act
      await controller.predictBatch(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockService.predictBatch).toHaveBeenCalledWith({ records: mockRequest.body.records });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(batch);
    });

    test("Case: Rejects a batch where records is not an array", async () => {
      // Arrange
      mockRequest = { body: { records: "not-an-array" } };
      mockService.predictBatch = jest.fn();

      // Act
      await controller.predictBatch(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockService.predictBatch).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Missing required field: records (non-empty array)",
      });
    });

    test("Case: Rejects an empty records array", async () => {
      // Arrange
      mockRequest = { body: { records: [] } };
      mockService.predictBatch = jest.fn();

      // Act
      await controller.predictBatch(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockService.predictBatch).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    test("Case: Reports the index of the first record missing its features", async () => {
      // Arrange
      mockRequest = {
        body: {
          records: [
            { row_id: "ok", features: validFeatures },
            { row_id: "bad" },
          ],
        },
      };
      mockService.predictBatch = jest.fn();

      // Act
      await controller.predictBatch(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockService.predictBatch).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "records[1].features must be an object",
      });
    });

    test("Case: Rejects a batch record whose vehicle is not fully specified", async () => {
      // Arrange
      mockRequest = {
        body: {
          records: [
            { row_id: "ok", features: validFeatures },
            { row_id: "thin", features: { Brand: "Tesla" } },
          ],
        },
      };
      mockService.predictBatch = jest.fn();

      // Act
      await controller.predictBatch(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockService.predictBatch).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const message = (mockResponse.json as jest.Mock).mock.calls[0][0].message as string;
      expect(message).toContain("records[1]:");
      expect(message).toContain("Missing required feature(s)");
    });

    test("Case: Surfaces the 503 raised when the ML service is unreachable", async () => {
      // Arrange
      const unreachable = Object.assign(new Error("not reachable"), { status: 503 });
      mockRequest = { body: { records: [{ features: validFeatures }] } };
      mockService.predictBatch = jest.fn().mockRejectedValue(unreachable);

      // Act
      await controller.predictBatch(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(503);
    });
  });
});
