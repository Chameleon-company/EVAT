import ProfileService from "../../src/services/profile-service";
import ProfileRepository from "../../src/repositories/profile-repository";
import IProfile from "../../src/models/profile-model";

// Mock the ProfileRepository
jest.mock("../../src/repositories/profile-repository");

describe("profile-service", () => {
    let profileService: ProfileService;

    beforeEach(() => {
        jest.clearAllMocks();
        profileService = new ProfileService();
    });

    describe("updateUserVehicleModel", () => {
        test("Case: Should create a new profile when user doesn't exist", async () => {
            // Arrange
            const userId = "user123";
            const vehicleId = "vehicle456";
            const mockNewProfile = {
                user_id: userId,
                user_car_model: vehicleId,
            };

            (ProfileRepository.findByUserId as jest.Mock).mockResolvedValue(null);
            (ProfileRepository.create as jest.Mock).mockResolvedValue(mockNewProfile);

            // Act
            const result = await profileService.updateUserVehicleModel(userId, vehicleId);

            // Assert
            expect(ProfileRepository.findByUserId).toHaveBeenCalledWith(userId);
            expect(ProfileRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                user_id: userId,
                user_car_model: vehicleId
            }));
            expect(result).toEqual(mockNewProfile);
        });

        test("Case: Should update an existing profile with new vehicle model", async () => {
            // Arrange
            const userId = "user123";
            const vehicleId = "vehicle456";
            const existingProfile = {
                user_id: userId,
                user_car_model: "oldVehicle789",
            };
            const updatedProfile = {
                user_id: userId,
                user_car_model: vehicleId,
            };

            (ProfileRepository.findByUserId as jest.Mock).mockResolvedValue(existingProfile);
            (ProfileRepository.updateByUserId as jest.Mock).mockResolvedValue(updatedProfile);

            // Act
            const result = await profileService.updateUserVehicleModel(userId, vehicleId);

            // Assert
            expect(ProfileRepository.findByUserId).toHaveBeenCalledWith(userId);
            expect(ProfileRepository.updateByUserId).toHaveBeenCalledWith(userId, {
                userCarModel: vehicleId,
            });
            expect(result).toEqual(updatedProfile);
        });

        test("Case: Should throw error when repository operation fails", async () => {
            // Arrange
            const userId = "user123";
            const vehicleId = "vehicle456";
            const mockError = new Error("Database error");

            (ProfileRepository.findByUserId as jest.Mock).mockRejectedValue(mockError);

            // Act & Assert
            await expect(profileService.updateUserVehicleModel(userId, vehicleId))
                .rejects.toThrow(mockError);
        });
    });

    describe("addFavouriteStation", () => {
        test("Case: Should create new profile with favourite station when user doesn't exist", async () => {
            // Arrange
            const userId = "user123";
            const stationId = "station456";
            const mockNewProfile = {
                user_id: userId,
                favourite_stations: [stationId],
            };

            (ProfileRepository.findByUserId as jest.Mock).mockResolvedValue(null);
            (ProfileRepository.create as jest.Mock).mockResolvedValue(mockNewProfile);

            // Act
            const result = await profileService.addFavouriteStation(userId, stationId);

            // Assert
            expect(ProfileRepository.findByUserId).toHaveBeenCalledWith(userId);
            expect(ProfileRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                user_id: userId,
                favourite_stations: [stationId]
            }));
            expect(result).toEqual(mockNewProfile);
        });

        test("Case: Should add station to existing profile's favourite stations", async () => {
            // Arrange
            const userId = "user123";
            const stationId = "station456";
            const existingProfile = {
                user_id: userId,
                favourite_stations: ["oldStation789"],
            };
            const updatedProfile = {
                user_id: userId,
                favourite_stations: ["oldStation789", stationId],
            };

            (ProfileRepository.findByUserId as jest.Mock).mockResolvedValue(existingProfile);
            (ProfileRepository.updateByUserId as jest.Mock).mockResolvedValue(updatedProfile);

            // Act
            const result = await profileService.addFavouriteStation(userId, stationId);

            // Assert
            expect(ProfileRepository.findByUserId).toHaveBeenCalledWith(userId);
            expect(ProfileRepository.updateByUserId).toHaveBeenCalledWith(userId, {
                $push: { favourite_stations: stationId },
            });
            expect(result).toEqual(updatedProfile);
        });

        test("Case: Should throw error when repository operation fails", async () => {
            // Arrange
            const userId = "user123";
            const stationId = "station456";
            const mockError = new Error("Database error");

            (ProfileRepository.findByUserId as jest.Mock).mockRejectedValue(mockError);

            // Act & Assert
            await expect(profileService.addFavouriteStation(userId, stationId))
                .rejects.toThrow(mockError);
        });
    });

    describe("removeFavouriteStation", () => {
        test("Case: Should remove station from existing profile's favourite stations", async () => {
            // Arrange
            const userId = "user123";
            const stationId = "station456";
            const existingProfile = {
                user_id: userId,
                favourite_stations: ["station456", "otherStation789"],
            };
            const updatedProfile = {
                user_id: userId,
                favourite_stations: ["otherStation789"],
            };

            (ProfileRepository.findByUserId as jest.Mock).mockResolvedValue(existingProfile);
            (ProfileRepository.updateByUserId as jest.Mock).mockResolvedValue(updatedProfile);

            // Act
            const result = await profileService.removeFavouriteStation(userId, stationId);

            // Assert
            expect(ProfileRepository.findByUserId).toHaveBeenCalledWith(userId);
            expect(ProfileRepository.updateByUserId).toHaveBeenCalledWith(userId, {
                $pull: { favourite_stations: stationId },
            });
            expect(result).toEqual(updatedProfile);
        });

        test("Case: Should throw error when user profile doesn't exist", async () => {
            // Arrange
            const userId = "user123";
            const stationId = "station456";

            (ProfileRepository.findByUserId as jest.Mock).mockResolvedValue(null);

            // Act & Assert
            await expect(profileService.removeFavouriteStation(userId, stationId))
                .rejects.toThrow(`The station tracking with userId = [${userId}] does not exist`);
        });

        test("Case: Should throw error when repository operation fails", async () => {
            // Arrange
            const userId = "user123";
            const stationId = "station456";
            const mockError = new Error("Database error");

            (ProfileRepository.findByUserId as jest.Mock).mockRejectedValue(mockError);

            // Act & Assert
            await expect(profileService.removeFavouriteStation(userId, stationId))
                .rejects.toThrow(mockError);
        });
    });

    describe("getUserProfile", () => {
        test("Case: Should return existing user profile when found", async () => {
            // Arrange
            const userId = "user123";
            const existingProfile = {
                user_id: userId,
                user_car_model: "vehicle456",
                favourite_stations: ["station789"],
            };

            (ProfileRepository.findByUserId as jest.Mock).mockResolvedValue(existingProfile);

            // Act
            const result = await profileService.getUserProfile(userId);

            // Assert
            expect(ProfileRepository.findByUserId).toHaveBeenCalledWith(userId);
            expect(result).toEqual(existingProfile);
        });

        test("Case: Should return default profile object when user doesn't exist", async () => {
            // Arrange
            const userId = "user123";
            const defaultProfile = {
                user_id: userId,
                user_car_model: null,
                favourite_stations: [],
            };

            (ProfileRepository.findByUserId as jest.Mock).mockResolvedValue(null);

            // Act
            const result = await profileService.getUserProfile(userId);

            // Assert
            expect(ProfileRepository.findByUserId).toHaveBeenCalledWith(userId);
            expect(result).toEqual(defaultProfile);
        });

        test("Case: Should throw error when repository operation fails", async () => {
            // Arrange
            const userId = "user123";
            const mockError = new Error("Database error");

            (ProfileRepository.findByUserId as jest.Mock).mockRejectedValue(mockError);

            // Act & Assert
            await expect(profileService.getUserProfile(userId))
                .rejects.toThrow(mockError);
        });
    });
});