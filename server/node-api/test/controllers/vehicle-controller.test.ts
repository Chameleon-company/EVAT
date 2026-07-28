import { Request, Response } from "express";
import ProfileController from "../../src/controllers/vehicle-controller";
import VehicleService from "../../src/services/vehicle-service";

// Mock the VehicleService
jest.mock("../../src/services/vehicle-service");

describe("ProfileController", () => {
  // Controller instance
  let profileController: ProfileController;
  // Mock vehicle service
  let mockVehicleService: jest.Mocked<VehicleService>;
  // Mock request and response objects
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Reset mocks and create fresh instances before each test
    jest.clearAllMocks();

    // Setup the mock vehicle service
    mockVehicleService = new VehicleService() as jest.Mocked<VehicleService>;

    // Create controller with mocked service
    profileController = new ProfileController(mockVehicleService);

    // Setup mock response with jest functions
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("getVehicleById", () => {
    test("Case: Successfully retrieves a vehicle by ID", async () => {
      // Arrange
      const mockVehicle = { id: "123", make: "Toyota", model: "Camry" };
      mockRequest = {
        params: {
          vehicleId: "123",
        },
      };
      mockVehicleService.getVehicleById = jest.fn().mockResolvedValue(mockVehicle);

      // Act
      const result = await profileController.getVehicleById(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockVehicleService.getVehicleById).toHaveBeenCalledWith("123");
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "success",
        data: mockVehicle,
      });
    });

    test("Case: Handles vehicle by id retrieval failure", async () => {
      // Arrange
      const errorMessage = "Vehicle not found";
      mockRequest = {
        params: {
          vehicleId: "999",
        },
      };
      mockVehicleService.getVehicleById = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await profileController.getVehicleById(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockVehicleService.getVehicleById).toHaveBeenCalledWith("999");
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: errorMessage,
      });
    });
  });

  describe("getAllVehicles", () => {
    test("Case: Successfully retrieves all vehicles", async () => {
      // Arrange
      const mockVehicles = [
        { id: "123", make: "Toyota", model: "Camry" },
        { id: "456", make: "Honda", model: "Civic" },
      ];
      mockRequest = {};
      mockVehicleService.getAllVehicles = jest.fn().mockResolvedValue(mockVehicles);

      // Act
      const result = await profileController.getAllVehicles(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockVehicleService.getAllVehicles).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "success",
        data: mockVehicles,
      });
    });

    test("Case: Handles get all vehicle retrieval fails", async () => {
      // Arrange
      const errorMessage = "Database connection error";
      mockRequest = {};
      mockVehicleService.getAllVehicles = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await profileController.getAllVehicles(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockVehicleService.getAllVehicles).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: errorMessage,
      });
    });
  });
});