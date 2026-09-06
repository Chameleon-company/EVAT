import { Request, Response } from "express";
import PredictController from "../../src/controllers/predict-controller";
import PredictService from "../../src/services/predict-service";

// Mock the Service
jest.mock("../../src/services/predict-service");

// Outer describe block for the file/module
describe("PredictController", () => {
    let controller: PredictController;
    let mockService: jest.Mocked<PredictService>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    // Helper method for date (and to avoid UTC timezone shifts), making sure the date is within the 16-day limit of Open-Meteo API
    const getValidFutureDate = (daysAhead = 3) => {
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockService = new PredictService() as jest.Mocked<PredictService>;
        controller = new PredictController(mockService);

        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // Inner describe block for the specific function being tested
    describe("getDemandForecast", () => {
        test("Should reject invalid postcode with 400", async () => {
            // Arrange
            mockRequest = { body: { postcode: "ABC", date: getValidFutureDate() } };

            // Act
            await controller.getDemandForecast(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringMatching(/Invalid Postcode/i)
            }));
        });

        test("Should reject invalid date format with 400", async () => {
            // Arrange
            mockRequest = { body: { postcode: "3000", date: "2025/12/01" } };

            // Act
            await controller.getDemandForecast(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringMatching(/Invalid Date/i)
                })
            );
        });

        test("Should reject date outside of the 16-day window with 400", async () => {
            // Arrange
            const invalidFutureDate = getValidFutureDate(20);
            mockRequest = { body: { postcode: "3000", date: invalidFutureDate } };

            // Act
            await controller.getDemandForecast(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringMatching(/AI Limitation/i)
            }));
        });

        test("Should return success with flat response when Service returns valid data", async () => {
            // Arrange
            const validDate = getValidFutureDate();
            mockRequest = { body: { postcode: "3000", date: validDate } };
            
            mockService.getDemandForecast.mockResolvedValue({
                postcode: "3000",
                date: validDate,
                predictedDemandKwh: 45.5,
                isFallback: false
            });

            // Act
            await controller.getDemandForecast(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            // Asserting the response is flattened (keys at the root level, no 'data' wrapper)
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                postcode: "3000",
                predictedDemandKwh: 45.5,
                isFallback: false
            }));
        });

        test("Should return 200 with fallback data when Service triggers fallback", async () => {
            // Arrange
            const validDate = getValidFutureDate();
            mockRequest = { body: { postcode: "3000", date: validDate } };
            mockService.getDemandForecast.mockResolvedValue({
                postcode: "3000",
                date: validDate,
                predictedDemandKwh: 50.0,
                isFallback: true,
                message: "External weather API lag detected. Using regional baseline fallback."
            });

            // Act
            await controller.getDemandForecast(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                isFallback: true,
                predictedDemandKwh: 50.0
            }));
        });

        test("Should handle service exception with 500 status", async () => {
            // Arrange
            const validDate = getValidFutureDate();
            mockRequest = { body: { postcode: "3000", date: validDate } };
            mockService.getDemandForecast.mockRejectedValue(new Error("Service error"));

            // Act
            await controller.getDemandForecast(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Error retrieving demand forecast"
                })
            );
        });

        test("Should forward Python validation errors with their status", async () => {
            // Arrange
            const validDate = getValidFutureDate();
            mockRequest = { body: { postcode: "3999", date: validDate } };
            mockService.getDemandForecast.mockRejectedValue({
                response: {
                    status: 400,
                    data: { detail: "Postcode is not supported." }
                }
            });

            // Act
            await controller.getDemandForecast(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Postcode is not supported."
            });
        });
    });

    describe("getCongestionLevels", () => {
        test("Should reject non-array stationIds parameter with 400", async () => {
            // Arrange
            mockRequest = { body: { stationIds: "not-an-array" } };

            // Act
            await controller.getCongestionLevels(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Request parameter must be a string array"
                })
            );
        });

        test("Should reject empty stationIds array with 400", async () => {
            // Arrange
            mockRequest = { body: { stationIds: [] } };

            // Act
            await controller.getCongestionLevels(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Insufficient number of charger IDs given. Minimum is 1"
                })
            );
        });

        test("Should return 200 with congestion levels for valid stationIds", async () => {
            // Arrange
            mockRequest = { body: { stationIds: ["ch-1", "ch-2"] } };
            mockService.getCongestionLevels.mockResolvedValue({
                congestionLevels: [{ chargerId: "ch-1", level: "low" }] as any
            });

            // Act
            await controller.getCongestionLevels(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Successfully received congestion levels"
                })
            );
        });
    });

    describe("deleteCongestionLevel", () => {
        test("Should reject non-string ID query parameter with 400", async () => {
            // Arrange
            mockRequest = { query: {} };

            // Act
            await controller.deleteCongestionLevel(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "ID parameter must be a string"
                })
            );
        });

        test("Should return 201 when congestion level is deleted successfully", async () => {
            // Arrange
            mockRequest = { query: { id: "ch-123" } };
            mockService.deleteCongestionLevel.mockResolvedValue(true);

            // Act
            await controller.deleteCongestionLevel(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Congestion level deleted successfully"
                })
            );
        });

        test("Should return 500 when service fails to delete congestion level", async () => {
            // Arrange
            mockRequest = { query: { id: "ch-123" } };
            mockService.deleteCongestionLevel.mockResolvedValue(false);

            // Act
            await controller.deleteCongestionLevel(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Unknown error occurred, does this ID exist?"
                })
            );
        });
    });

    describe("putCongestionLevel", () => {
        test("Should reject invalid congestion level value with 400", async () => {
            // Arrange
            mockRequest = { query: { id: "ch-123", level: "extreme" } };

            // Act
            await controller.putCongestionLevel(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Level must be 'low', 'medium', or 'high'"
                })
            );
        });

        test("Should return 201 when congestion level is updated successfully", async () => {
            // Arrange
            mockRequest = { query: { id: "ch-123", level: "medium" } };
            mockService.putCongestionLevel.mockResolvedValue(true);

            // Act
            await controller.putCongestionLevel(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Congestion level updated successfully"
                })
            );
        });

        test("Should return 500 when service fails to update congestion level", async () => {
            // Arrange
            mockRequest = { query: { id: "ch-123", level: "medium" } };
            mockService.putCongestionLevel.mockResolvedValue(false);

            // Act
            await controller.putCongestionLevel(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Unknown error occurred"
                })
            );
        });
    });

    describe("postCongestionLevelsBatch", () => {
        test("Should reject batch with invalid station id type with 400", async () => {
            // Arrange
            mockRequest = {
                body: {
                    predictions: [
                        { station_id: 123, congestion_level: "low" }
                    ]
                }
            };

            // Act
            await controller.postCongestionLevelsBatch(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringMatching(/ID must be a string/i)
                })
            );
        });

        test("Should reject batch with invalid congestion level with 400", async () => {
            // Arrange
            mockRequest = {
                body: {
                    predictions: [
                        { station_id: "ch-1", congestion_level: "extreme" }
                    ]
                }
            };

            // Act
            await controller.postCongestionLevelsBatch(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringMatching(/Level must be 'low', 'medium', or 'high'/i)
                })
            );
        });

        test("Should return 201 when batch update succeeds", async () => {
            // Arrange
            mockRequest = {
                body: {
                    predictions: [
                        { station_id: "ch-1", congestion_level: "low" }
                    ]
                }
            };
            mockService.postCongestionLevelsBatch.mockResolvedValue(true);

            // Act
            await controller.postCongestionLevelsBatch(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Congestion level updated successfully"
                })
            );
        });

        test("Should return 500 when batch service returns false", async () => {
            // Arrange
            mockRequest = {
                body: {
                    predictions: [
                        { station_id: "ch-1", congestion_level: "low" }
                    ]
                }
            };
            mockService.postCongestionLevelsBatch.mockResolvedValue(false);

            // Act
            await controller.postCongestionLevelsBatch(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Unknown error occurred"
                })
            );
        });
    });

    describe("getCostComparison", () => {
        test("Should reject request with missing required fields with 400", async () => {
            // Arrange
            mockRequest = { body: { distance_km: 100 } };

            // Act
            await controller.getCostComparison(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringMatching(/Missing required fields/i)
                })
            );
        });

        test("Should return 200 with cost comparison result when fields are present", async () => {
            // Arrange
            mockRequest = {
                body: {
                    distance_km: 50,
                    electricity_price_per_kwh: 0.2,
                    petrol_price_per_l: 1.8
                }
            };
            mockService.getCostComparison.mockResolvedValue({ evCost: 5, iceCost: 12 });

            // Act
            await controller.getCostComparison(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ evCost: 5, iceCost: 12 });
        });
    });

    describe("getCostCharts", () => {
        test("Should reject request with missing required fields with 400", async () => {
            // Arrange
            mockRequest = { body: { distance_km: 100 } };

            // Act
            await controller.getCostCharts(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Missing required fields"
                })
            );
        });

        test("Should return 200 with cost charts data when required fields are present", async () => {
            // Arrange
            mockRequest = {
                body: {
                    distance_km: 50,
                    electricity_price_per_kwh: 0.2,
                    petrol_price_per_l: 1.8
                }
            };
            mockService.getCostCharts.mockResolvedValue({ labels: [], datasets: [] });

            // Act
            await controller.getCostCharts(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ labels: [], datasets: [] });
        });
    });

    describe("getEvVehicles and getIceVehicles", () => {
        test("Should return 200 with a list of EV vehicles", async () => {
            // Arrange
            mockService.getEvVehicles.mockResolvedValue([{ make: "Tesla", model: "Model 3" }]);

            // Act
            await controller.getEvVehicles(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith([{ make: "Tesla", model: "Model 3" }]);
        });

        test("Should return 200 with a list of ICE vehicles", async () => {
            // Arrange
            mockService.getIceVehicles.mockResolvedValue([{ make: "Toyota", model: "Corolla" }]);

            // Act
            await controller.getIceVehicles(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith([{ make: "Toyota", model: "Corolla" }]);
        });
    });

    describe("getEvEfficiency", () => {
        test("Should reject request missing make or model with 400", async () => {
            // Arrange
            mockRequest = { body: { make: "Tesla" } };

            // Act
            await controller.getEvEfficiency(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "make and model are required"
                })
            );
        });

        test("Should return 200 with efficiency data when valid parameters are provided", async () => {
            // Arrange
            mockRequest = { body: { make: "Tesla", model: "Model 3" } };
            mockService.getEvEfficiency.mockResolvedValue({ efficiency: 150 });

            // Act
            await controller.getEvEfficiency(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ efficiency: 150 });
        });
    });

    describe("getIceEfficiency", () => {
        test("Should reject request missing make or model with 400", async () => {
            // Arrange
            mockRequest = { body: { model: "Corolla" } };

            // Act
            await controller.getIceEfficiency(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "make and model are required"
                })
            );
        });

        test("Should return 200 with efficiency data when valid parameters are provided", async () => {
            // Arrange
            mockRequest = { body: { make: "Toyota", model: "Corolla" } };
            mockService.getIceEfficiency.mockResolvedValue({ efficiency: 6.5 });

            // Act
            await controller.getIceEfficiency(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ efficiency: 6.5 });
        });
    });

    describe("getDemandPostcodes and getDemandCoords", () => {
        test("Should return 200 with a list of postcodes", async () => {
            // Arrange
            mockService.getDemandPostcodes.mockResolvedValue(["3000", "2000"]);

            // Act
            await controller.getDemandPostcodes(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ data: ["3000", "2000"] });
        });

        test("Should reject coordinate request missing postcode parameter with 400", async () => {
            // Arrange
            mockRequest = { params: {} };

            // Act
            await controller.getDemandCoords(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Postcode is required"
                })
            );
        });

        test("Should return 200 with coordinates for a valid postcode", async () => {
            // Arrange
            mockRequest = { params: { postcode: "3000" } };
            mockService.getDemandCoords.mockResolvedValue({ lat: -37.8136, lon: 144.9631 });

            // Act
            await controller.getDemandCoords(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ data: { lat: -37.8136, lon: 144.9631 } });
        });
    });
});