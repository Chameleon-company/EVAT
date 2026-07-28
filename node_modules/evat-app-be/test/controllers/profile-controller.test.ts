import { Request, Response } from "express";
import ProfileController from "../../src/controllers/profile-controller";
import ProfileService from "../../src/services/profile-service";
import VehicleService from "../../src/services/vehicle-service";
import UserService from "../../src/services/user-service";
import ChargingStationService from "../../src/services/station-service";
import { UserProfileResponse } from "../../src/dtos/user-profile-response";

// Mock services
jest.mock("../../src/services/profile-service");
jest.mock("../../src/services/vehicle-service");
jest.mock("../../src/services/user-service");
jest.mock("../../src/services/station-service");

describe("ProfileController", () => {
  let profileController: ProfileController;
  let mockUserService: jest.Mocked<UserService>;
  let mockProfileService: jest.Mocked<ProfileService>;
  let mockVehicleService: jest.Mocked<VehicleService>;
  let mockStationService: jest.Mocked<ChargingStationService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Reset and recreate mocks before each test
    mockUserService = new UserService() as jest.Mocked<UserService>;
    mockProfileService = new ProfileService() as jest.Mocked<ProfileService>;
    mockVehicleService = new VehicleService() as jest.Mocked<VehicleService>;
    mockStationService = new ChargingStationService() as jest.Mocked<ChargingStationService>;

    profileController = new ProfileController(
      mockUserService,
      mockProfileService,
      mockVehicleService,
      mockStationService
    );

    // Common response setup with jest spies
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Default request setup
    mockRequest = {
      user: { id: "test-user-id" },
    };
  });

  describe("getUserProfile", () => {
    test("Case: Successfully retrieves user profile with no vehicle or favorite stations", async () => {
      // Arrange
      const mockUserProfile = {
        user_id: "test-user-id",
        user_car_model: null,
        favourite_stations: [],
      };

      mockProfileService.getUserProfile = jest.fn().mockResolvedValue(mockUserProfile);

      // Act
      await profileController.getUserProfile(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockProfileService.getUserProfile).toHaveBeenCalledWith("test-user-id");
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "success",
        data: expect.objectContaining({
          user_id: "test-user-id",
        }),
      });
    });

    test("Case: Successfully retrieves user profile with vehicle model", async () => {
      // Arrange
      const vehicleId = "vehicle-123";
      const mockUserProfile = {
        user_id: "test-user-id",
        user_car_model: vehicleId,
        favourite_stations: [],
      };

      const mockVehicle = {
        id: vehicleId,
        make: "Tesla",
        model: "Model 3",
      };

      mockProfileService.getUserProfile = jest.fn().mockResolvedValue(mockUserProfile);
      mockVehicleService.getVehicleById = jest.fn().mockResolvedValue(mockVehicle);

      // Act
      await profileController.getUserProfile(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockProfileService.getUserProfile).toHaveBeenCalledWith("test-user-id");
      expect(mockVehicleService.getVehicleById).toHaveBeenCalledWith(vehicleId);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "success",
        data: expect.objectContaining({
          user_id: "test-user-id",
          user_car_model: mockVehicle,
        }),
      });
    });

    test("Case: Successfully retrieves user profile with favorite stations", async () => {
      // Arrange
      const stationIds = ["station-1", "station-2"];
      const mockUserProfile = {
        user_id: "test-user-id",
        user_car_model: null,
        favourite_stations: stationIds,
      };

      const mockStations = [
        { id: "station-1", name: "Station 1" },
        { id: "station-2", name: "Station 2" },
      ];

      mockProfileService.getUserProfile = jest.fn().mockResolvedValue(mockUserProfile);
      mockStationService.getStationsWithIdIn = jest.fn().mockResolvedValue(mockStations);

      // Act
      await profileController.getUserProfile(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockProfileService.getUserProfile).toHaveBeenCalledWith("test-user-id");
      expect(mockStationService.getStationsWithIdIn).toHaveBeenCalledWith(stationIds);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "success",
        data: expect.objectContaining({
          user_id: "test-user-id",
          favourite_stations: mockStations,
        }),
      });
    });

    test("Case: Handles error during profile retrieval", async () => {
      // Arrange
      const errorMessage = "Failed to retrieve profile";
      mockProfileService.getUserProfile = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      await profileController.getUserProfile(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockProfileService.getUserProfile).toHaveBeenCalledWith("test-user-id");
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe("updateUserVehicleModel", () => {
    test("Case: Successfully updates user vehicle model", async () => {
      // Arrange
      const vehicleId = "vehicle-123";
      mockRequest.body = { vehicleId };

      const mockUser = { id: "test-user-id", name: "Test User" };
      const mockVehicle = { id: vehicleId, make: "Tesla", model: "Model S" };
      const mockUpdatedProfile = {
        user_id: "test-user-id",
        user_car_model: vehicleId,
      };

      mockUserService.getUserById = jest.fn().mockResolvedValue(mockUser);
      mockVehicleService.getVehicleById = jest.fn().mockResolvedValue(mockVehicle);
      mockProfileService.updateUserVehicleModel = jest.fn().mockResolvedValue(mockUpdatedProfile);

      // Act
      await profileController.updateUserVehicleModel(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith("test-user-id");
      expect(mockVehicleService.getVehicleById).toHaveBeenCalledWith(vehicleId);
      expect(mockProfileService.updateUserVehicleModel).toHaveBeenCalledWith("test-user-id", vehicleId);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Update user vehicle model successfully",
        data: mockUpdatedProfile,
      });
    });

    test("Case: User not found", async () => {
      // Arrange
      const vehicleId = "vehicle-123";
      mockRequest.body = { vehicleId };

      mockUserService.getUserById = jest.fn().mockResolvedValue(null);

      // Act
      await profileController.updateUserVehicleModel(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith("test-user-id");
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "User not found" });
      expect(mockVehicleService.getVehicleById).not.toHaveBeenCalled();
      expect(mockProfileService.updateUserVehicleModel).not.toHaveBeenCalled();
    });

    test("Case: Vehicle not found", async () => {
      // Arrange
      const vehicleId = "vehicle-123";
      mockRequest.body = { vehicleId };

      const mockUser = { id: "test-user-id", name: "Test User" };

      mockUserService.getUserById = jest.fn().mockResolvedValue(mockUser);
      mockVehicleService.getVehicleById = jest.fn().mockResolvedValue(null);

      // Act
      await profileController.updateUserVehicleModel(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith("test-user-id");
      expect(mockVehicleService.getVehicleById).toHaveBeenCalledWith(vehicleId);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "Vehicle not found" });
      expect(mockProfileService.updateUserVehicleModel).not.toHaveBeenCalled();
    });

    test("Case: Handles error during update", async () => {
      // Arrange
      const vehicleId = "vehicle-123";
      mockRequest.body = { vehicleId };

      const mockUser = { id: "test-user-id", name: "Test User" };
      const mockVehicle = { id: vehicleId, make: "Tesla", model: "Model S" };
      const errorMessage = "Failed to update vehicle model";

      mockUserService.getUserById = jest.fn().mockResolvedValue(mockUser);
      mockVehicleService.getVehicleById = jest.fn().mockResolvedValue(mockVehicle);
      mockProfileService.updateUserVehicleModel = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      await profileController.updateUserVehicleModel(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith("test-user-id");
      expect(mockVehicleService.getVehicleById).toHaveBeenCalledWith(vehicleId);
      expect(mockProfileService.updateUserVehicleModel).toHaveBeenCalledWith("test-user-id", vehicleId);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe("addFavouriteStation", () => {
    test("Case: Successfully adds a favorite station", async () => {
      // Arrange
      const stationId = "station-123";
      mockRequest.body = { stationId };

      const mockUser = { id: "test-user-id", name: "Test User" };
      const mockStation = { id: stationId, name: "Test Station" };
      const mockUpdatedProfile = {
        user_id: "test-user-id",
        favourite_stations: [stationId],
      };

      mockUserService.getUserById = jest.fn().mockResolvedValue(mockUser);
      mockStationService.getStationById = jest.fn().mockResolvedValue(mockStation);
      mockProfileService.addFavouriteStation = jest.fn().mockResolvedValue(mockUpdatedProfile);

      // Act
      await profileController.addFavouriteStation(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith("test-user-id");
      expect(mockStationService.getStationById).toHaveBeenCalledWith(stationId);
      expect(mockProfileService.addFavouriteStation).toHaveBeenCalledWith("test-user-id", stationId);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Add favourite station successfully",
        data: mockUpdatedProfile,
      });
    });

    test("Case: User not found", async () => {
      // Arrange
      const stationId = "station-123";
      mockRequest.body = { stationId };

      mockUserService.getUserById = jest.fn().mockResolvedValue(null);

      // Act
      await profileController.addFavouriteStation(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith("test-user-id");
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "User not found" });
      expect(mockStationService.getStationById).not.toHaveBeenCalled();
      expect(mockProfileService.addFavouriteStation).not.toHaveBeenCalled();
    });

    test("Case: Station not found", async () => {
      // Arrange
      const stationId = "station-123";
      mockRequest.body = { stationId };

      const mockUser = { id: "test-user-id", name: "Test User" };

      mockUserService.getUserById = jest.fn().mockResolvedValue(mockUser);
      mockStationService.getStationById = jest.fn().mockResolvedValue(null);

      // Act
      await profileController.addFavouriteStation(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith("test-user-id");
      expect(mockStationService.getStationById).toHaveBeenCalledWith(stationId);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "Station not found" });
      expect(mockProfileService.addFavouriteStation).not.toHaveBeenCalled();
    });

    test("Case: Handles error during adding favorite station", async () => {
      // Arrange
      const stationId = "station-123";
      mockRequest.body = { stationId };

      const mockUser = { id: "test-user-id", name: "Test User" };
      const mockStation = { id: stationId, name: "Test Station" };
      const errorMessage = "Failed to add favorite station";

      mockUserService.getUserById = jest.fn().mockResolvedValue(mockUser);
      mockStationService.getStationById = jest.fn().mockResolvedValue(mockStation);
      mockProfileService.addFavouriteStation = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      await profileController.addFavouriteStation(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith("test-user-id");
      expect(mockStationService.getStationById).toHaveBeenCalledWith(stationId);
      expect(mockProfileService.addFavouriteStation).toHaveBeenCalledWith("test-user-id", stationId);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe("deleteFavouriteStation", () => {
    test("Case: Successfully removes a favorite station", async () => {
      // Arrange
      const stationId = "station-123";
      mockRequest.body = { stationId };

      const mockUser = { id: "test-user-id", name: "Test User" };
      const mockUpdatedProfile = {
        user_id: "test-user-id",
        favourite_stations: [],
      };

      mockUserService.getUserById = jest.fn().mockResolvedValue(mockUser);
      mockProfileService.removeFavouriteStation = jest.fn().mockResolvedValue(mockUpdatedProfile);

      // Act
      await profileController.deleteFavouriteStation(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith("test-user-id");
      expect(mockProfileService.removeFavouriteStation).toHaveBeenCalledWith("test-user-id", stationId);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Remove favourite station successfully",
        data: mockUpdatedProfile,
      });
    });

    test("Case: User not found", async () => {
      // Arrange
      const stationId = "station-123";
      mockRequest.body = { stationId };

      mockUserService.getUserById = jest.fn().mockResolvedValue(null);

      // Act
      await profileController.deleteFavouriteStation(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith("test-user-id");
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "User not found" });
      expect(mockProfileService.removeFavouriteStation).not.toHaveBeenCalled();
    });

    test("Case: Handles error during removing favorite station", async () => {
      // Arrange
      const stationId = "station-123";
      mockRequest.body = { stationId };

      const mockUser = { id: "test-user-id", name: "Test User" };
      const errorMessage = "Failed to remove favorite station";

      mockUserService.getUserById = jest.fn().mockResolvedValue(mockUser);
      mockProfileService.removeFavouriteStation = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      await profileController.deleteFavouriteStation(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith("test-user-id");
      expect(mockProfileService.removeFavouriteStation).toHaveBeenCalledWith("test-user-id", stationId);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });
});