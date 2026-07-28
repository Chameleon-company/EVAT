import { Request, Response } from "express";
import VoiceController from "../../src/controllers/voice-controller";
import VoiceService from "../../src/services/voice-service";

jest.mock("../../src/services/voice-service");

describe("VoiceController", () => {
  let voiceController: VoiceController;
  let mockVoiceService: jest.Mocked<VoiceService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockVoiceService = new VoiceService() as jest.Mocked<VoiceService>;
    voiceController = new VoiceController(mockVoiceService);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test("Case: Successfully processes query", async () => {
    mockRequest = {
      body: {
        query: "Compare EV and petrol costs",
      },
    };

    mockVoiceService.processQuery = jest.fn().mockResolvedValue({
      answer_text: "Comparison response",
      intent: "compare_cost",
      entities: { comparison: "ev_vs_ice" },
      station_id: null,
      coordinates: null,
    });

    await voiceController.query(mockRequest as Request, mockResponse as Response);

    expect(mockVoiceService.processQuery).toHaveBeenCalledWith(
      "Compare EV and petrol costs",
      undefined
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      answer_text: "Comparison response",
      intent: "compare_cost",
      entities: { comparison: "ev_vs_ice" },
      station_id: null,
      coordinates: null,
    });
  });

  test("Case: Rejects empty query", async () => {
    mockRequest = {
      body: {
        query: " ",
      },
    };

    await voiceController.query(mockRequest as Request, mockResponse as Response);

    expect(mockVoiceService.processQuery).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "query is required and must be a non-empty string",
    });
  });

  test("Case: Handles service failure", async () => {
    mockRequest = {
      body: {
        query: "help",
      },
    };

    mockVoiceService.processQuery = jest.fn().mockRejectedValue(new Error("Service error"));

    await voiceController.query(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Service error",
    });
  });
});
