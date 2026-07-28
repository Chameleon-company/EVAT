import { Request, Response } from "express";
import mongoose from "mongoose";
import GamificationController from "../../src/controllers/gamification-controller";
import { GameVirtualItem, GameProfile, GameEvent, GameBadge, GameQuest } from "../../src/models/game-model";

// Mock the Mongoose models
jest.mock("../../src/models/game-model", () => {
    // Mock the constructor and save method for instance-based operations
    const mockSave = jest.fn().mockResolvedValue(this);
    const mockModel = jest.fn().mockImplementation(() => ({
        save: mockSave,
    })) as any;

    // Attach static methods
    mockModel.create = jest.fn();
    mockModel.find = jest.fn();
    mockModel.findById = jest.fn();
    mockModel.findByIdAndUpdate = jest.fn();
    mockModel.findByIdAndDelete = jest.fn();
    mockModel.findOne = jest.fn();
    mockModel.findOneAndUpdate = jest.fn();
    mockModel.findOneAndDelete = jest.fn();

    return {
        GameVirtualItem: mockModel,
        GameProfile: mockModel,
        GameEvent: mockModel,
        GameBadge: mockModel,
        GameQuest: mockModel,
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
      (GameVirtualItem.create as jest.Mock).mockResolvedValue(itemData);

      await gamificationController.createVirtualItem(mockRequest as Request, mockResponse as Response);

      expect(GameVirtualItem.create).toHaveBeenCalledWith(itemData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ data: itemData }));
    });
  });

  // --- Badge CRUD Tests ---
  describe("createBadge", () => {
      test("Case: Should create a badge successfully", async () => {
        const badgeData = { name: "Test Badge" };
        mockRequest = { body: badgeData };
        (GameBadge.create as jest.Mock).mockResolvedValue(badgeData);

        await gamificationController.createBadge(mockRequest as Request, mockResponse as Response);

        expect(GameBadge.create).toHaveBeenCalledWith(badgeData);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ data: badgeData }));
      });
  });

  // --- Quest CRUD Tests ---
  describe("createQuest", () => {
    test("Case: Should create a quest successfully", async () => {
        const questData = { name: "Test Quest" };
        mockRequest = { body: questData };
        (GameQuest.create as jest.Mock).mockResolvedValue(questData);

        await gamificationController.createQuest(mockRequest as Request, mockResponse as Response);

        expect(GameQuest.create).toHaveBeenCalledWith(questData);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ data: questData }));
    });
  });

  // --- Game Profile CRUD Tests ---
  describe("createGameProfile", () => {
      test("Case: Should create a game profile successfully", async () => {
        const profileData = { main_app_user_id: mockUser.id };
        mockRequest = { body: profileData };
        (GameProfile.findOne as jest.Mock).mockResolvedValue(null);
        (GameProfile.create as jest.Mock).mockResolvedValue(profileData);
        
        await gamificationController.createGameProfile(mockRequest as Request, mockResponse as Response);

        expect(GameProfile.findOne).toHaveBeenCalledWith({ main_app_user_id: mockUser.id });
        expect(GameProfile.create).toHaveBeenCalledWith(profileData);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ data: profileData }));
      });
  });

  // --- Game Event CRUD Tests ---
   describe("createEvent", () => {
    test("Case: Should create a game event successfully", async () => {
        const eventData = { user_id: mockUser.id, event_type: "ACTION_PERFORMED" };
        mockRequest = { body: eventData };
        (GameEvent.create as jest.Mock).mockResolvedValue(eventData);

        await gamificationController.createEvent(mockRequest as Request, mockResponse as Response);

        expect(GameEvent.create).toHaveBeenCalledWith(eventData);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ data: eventData }));
    });
  });

});
