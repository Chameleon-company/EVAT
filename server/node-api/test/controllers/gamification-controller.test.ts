import { Request, Response } from "express";
import mongoose from "mongoose";
import GamificationController from "../../src/controllers/gamification-controller";
import { GameVirtualItem, GameProfile, GameEvent, GameBadge, GameQuest } from "../../src/models/game-model";

// Mock the Mongoose models
jest.mock("../../src/models/game-model", () => {
    const createMockModel = () => {
      const mockModel = jest.fn().mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(undefined),
      })) as any;
      mockModel.find = jest.fn();
      mockModel.findById = jest.fn();
      mockModel.findByIdAndUpdate = jest.fn();
      mockModel.findByIdAndDelete = jest.fn();
      mockModel.findOne = jest.fn();
      mockModel.findOneAndUpdate = jest.fn();
      mockModel.findOneAndDelete = jest.fn();
      return mockModel;
    };

    return {
        GameVirtualItem: createMockModel(),
        GameProfile: createMockModel(),
        GameEvent: createMockModel(),
        GameBadge: createMockModel(),
        GameQuest: createMockModel(),
    };
});


describe("GamificationController", () => {
  let gamificationController: GamificationController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    gamificationController = new GamificationController();
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockUser = {
        id: new mongoose.Types.ObjectId().toHexString(),
        email: 'test@example.com',
        role: 'user'
    };
  });

  //============================================
  // User-Facing API Tests
  //============================================

  describe("getGameProfileForUser", () => {
    test("Case: Should retrieve a user's populated game profile", async () => {
      // Arrange
      mockRequest = { user: mockUser };
      const mockProfile = { 
        main_app_user_id: mockUser.id, 
        populate: jest.fn().mockReturnThis() // Chain populate calls
      };
      (GameProfile.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProfile)
      });

      // Act
      await gamificationController.getGameProfileForUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(GameProfile.findOne).toHaveBeenCalledWith({ main_app_user_id: mockUser.id });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User profile retrieved successfully",
        data: mockProfile
      });
    });
  });

  describe("getLeaderboard", () => {
      test("Case: Should retrieve a list of top users", async () => {
        // Arrange
        const mockLeaderboard = [{ main_app_user_id: mockUser.id, gamification_profile: { net_worth: 1000 } }];
        (GameProfile.find as jest.Mock).mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(mockLeaderboard)
        });

        // Act
        await gamificationController.getLeaderboard(mockRequest as Request, mockResponse as Response);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
            message: "Leaderboard retrieved successfully",
            data: mockLeaderboard,
        });
      });
  });

  //============================================
  // Management API Tests
  //============================================

  // --- Virtual Item CRUD Tests ---
  describe("createVirtualItem", () => {
    test("Case: Should create a virtual item successfully", async () => {
      const itemData = { name: "Test Item" };
      mockRequest = { body: itemData };

      await gamificationController.createVirtualItem(mockRequest as Request, mockResponse as Response);

      expect(GameVirtualItem).toHaveBeenCalledWith(itemData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining(itemData),
      }));
    });
  });

  // --- Badge CRUD Tests ---
  describe("createBadge", () => {
      test("Case: Should create a badge successfully", async () => {
        const badgeData = { name: "Test Badge" };
        mockRequest = { body: badgeData };

        await gamificationController.createBadge(mockRequest as Request, mockResponse as Response);

        expect(GameBadge).toHaveBeenCalledWith(badgeData);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining(badgeData),
        }));
      });
  });

  // --- Quest CRUD Tests ---
  describe("createQuest", () => {
    test("Case: Should create a quest successfully", async () => {
        const questData = { name: "Test Quest" };
        mockRequest = { body: questData };

        await gamificationController.createQuest(mockRequest as Request, mockResponse as Response);

        expect(GameQuest).toHaveBeenCalledWith(questData);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining(questData),
        }));
    });
  });

  // --- Game Profile CRUD Tests ---
  describe("createGameProfile", () => {
      test("Case: Should create a game profile successfully", async () => {
        const profileData = { main_app_user_id: mockUser.id };
        mockRequest = { body: profileData };
        (GameProfile.findOne as jest.Mock).mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        });
        
        await gamificationController.createGameProfile(mockRequest as Request, mockResponse as Response);

        expect(GameProfile.findOne).toHaveBeenCalledWith({ main_app_user_id: mockUser.id });
        expect(GameProfile).toHaveBeenCalledWith(profileData);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining(profileData),
        }));
      });
  });

  // --- Game Event CRUD Tests ---
   describe("createEvent", () => {
    test("Case: Should create a game event successfully", async () => {
        const eventData = { user_id: mockUser.id, event_type: "ACTION_PERFORMED" };
        mockRequest = { body: eventData };

        await gamificationController.createEvent(mockRequest as Request, mockResponse as Response);

        expect(GameEvent).toHaveBeenCalledWith(eventData);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining(eventData),
        }));
    });
  });

});
