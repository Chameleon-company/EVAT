import ProfileRepository from "../../src/repositories/profile-repository";
import Profile, { IProfile } from "../../src/models/profile-model";
import { Model } from "mongoose";

// Create mock type
type MockProfileModel = {
  findOne: jest.Mock;
  findOneAndUpdate: jest.Mock;
} & jest.Mock;

// Mock the Profile model
jest.mock("../../src/models/profile-model", () => {
  const mockExec = jest.fn();
  const mockSave = jest.fn();
  const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });
  const mockFindOneAndUpdate = jest.fn().mockReturnValue({ exec: mockExec });

  const mockProfileInstance = {
    save: mockSave,
  };

  const MockProfile = jest.fn().mockImplementation(() => mockProfileInstance) as MockProfileModel;
  MockProfile.findOne = mockFindOne;
  MockProfile.findOneAndUpdate = mockFindOneAndUpdate;

  return {
    __esModule: true,
    default: MockProfile,
  };
});

describe("profile-repository", () => {
  const mockUserId = "user123";
  const mockProfileData = {
    user_id: mockUserId,
    name: "Test User",
    email: "test@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findByUserId", () => {
    test("Case: Should find a profile by user ID", async () => {
      // Arrange
      const mockProfile = { ...mockProfileData };
      (Profile.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProfile),
      });

      // Act
      const result = await ProfileRepository.findByUserId(mockUserId);

      // Assert
      expect((Profile.findOne as jest.Mock)).toHaveBeenCalledWith({ user_id: mockUserId });

      expect(result).toEqual(mockProfile);
    });

    test("Case: Should return null when profile is not found", async () => {
      // Arrange
      (Profile.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await ProfileRepository.findByUserId("nonexistent");

      // Assert
      expect((Profile.findOne as jest.Mock)).toHaveBeenCalledWith({ user_id: "nonexistent" });
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("Case: Should create a new profile", async () => {
      // Arrange
      const newProfileData = { ...mockProfileData };
      const mockSavedProfile = { ...newProfileData, _id: "profile123" };
      const mockSave = jest.fn().mockResolvedValue(mockSavedProfile);
      (Profile as any as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      // Act
      const result = await ProfileRepository.create(newProfileData);

      // Assert
      expect(Profile).toHaveBeenCalledWith(newProfileData);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockSavedProfile);
    });
  });

  describe("updateByUserId", () => {
    test("Case: Should update a profile by user ID", async () => {
      // Arrange
      const updateData = { name: "Updated Name" };
      const updatedProfile = { ...mockProfileData, ...updateData };
      (Profile.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedProfile),
      });

      // Act
      const result = await ProfileRepository.updateByUserId(mockUserId, updateData);

      // Assert
      expect((Profile.findOneAndUpdate as jest.Mock)).toHaveBeenCalledWith(
        { user_id: mockUserId },
        updateData,
        { new: true }
      );
      expect(result).toEqual(updatedProfile);
    });

    test("Case: Should return null when user ID is not found for update", async () => {
      // Arrange
      const updateData = { name: "Updated Name" };
      (Profile.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await ProfileRepository.updateByUserId("nonexistent", updateData);

      // Assert
      expect((Profile.findOneAndUpdate as jest.Mock)).toHaveBeenCalledWith(
        { user_id: "nonexistent" },
        updateData,
        { new: true }
      );
      expect(result).toBeNull();
    });
  });
});