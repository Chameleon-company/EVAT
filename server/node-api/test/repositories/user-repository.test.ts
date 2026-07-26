import User from "../../src/models/user-model";
import UserRepository from "../../src/repositories/user-repository";
import mongoose from "mongoose";

// Mock the User model
jest.mock("../../src/models/user-model");

describe("user-repository", () => {
    // Clear all mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("findById", () => {
        test("Case: Should find a user by ID successfully", async () => {
            // Arrange
            const mockUserId = "fa3c18";
            const mockUser = { _id: mockUserId, firstName: "Test User FirstName", lastName: "Test User LastName", email: "test@example.com", mobile: "0412345678" };
            const execMock = jest.fn().mockResolvedValue(mockUser);
            const findOneMock = jest.fn().mockReturnValue({ exec: execMock });
            (User.findOne as jest.Mock).mockReturnValue({ exec: execMock });

            // Act
            const result = await UserRepository.findById(mockUserId);

            // Assert
            expect(User.findOne).toHaveBeenCalledWith({ _id: mockUserId });
            expect(execMock).toHaveBeenCalled();
            expect(result).toEqual(mockUser);
        });

        test("Case: Should return null if user ID not found", async () => {
            // Arrange
            const mockUserId = "7fabda";
            const execMock = jest.fn().mockResolvedValue(null);
            (User.findOne as jest.Mock).mockReturnValue({ exec: execMock });

            // Act
            const result = await UserRepository.findById(mockUserId);

            // Assert
            expect(User.findOne).toHaveBeenCalledWith({ _id: mockUserId });
            expect(execMock).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });

    describe("findByEmail", () => {
        test("Case: Should find a user by email successfully", async () => {
            // Arrange
            const mockEmail = "test@example.com";
            const mockUser = { _id: "dc1499", firstName: "Test User FirstName", lastName: "Test User LastName", email: mockEmail, mobile: "0412345678" };
            const execMock = jest.fn().mockResolvedValue(mockUser);
            (User.findOne as jest.Mock).mockReturnValue({ exec: execMock });

            // Act
            const result = await UserRepository.findByEmail(mockEmail);

            // Assert
            expect(User.findOne).toHaveBeenCalledWith({ email: mockEmail });
            expect(execMock).toHaveBeenCalled();
            expect(result).toEqual(mockUser);
        });

        test("Case: Should return null if email not found", async () => {
            // Arrange
            const mockEmail = "nonexistent@example.com";
            const execMock = jest.fn().mockResolvedValue(null);
            (User.findOne as jest.Mock).mockReturnValue({ exec: execMock });

            // Act
            const result = await UserRepository.findByEmail(mockEmail);

            // Assert
            expect(User.findOne).toHaveBeenCalledWith({ email: mockEmail });
            expect(execMock).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });

    describe("findOne", () => {
        test("Case: Should find a user with custom filter", async () => {
            // Arrange
            const mockFilter = { name: "Test User" };
            const mockUser = { _id: "e0a71a", firstName: "Test User FirstName", lastName: "Test User LastName", email: "test@example.com", mobile: "0412345678" };
            const execMock = jest.fn().mockResolvedValue(mockUser);
            (User.findOne as jest.Mock).mockReturnValue({ exec: execMock });

            // Act
            const result = await UserRepository.findOne(mockFilter);

            // Assert
            expect(User.findOne).toHaveBeenCalledWith(mockFilter);
            expect(execMock).toHaveBeenCalled();
            expect(result).toEqual(mockUser);
        });

        test("Case: Should return null if filter doesn't match any user", async () => {
            // Arrange
            const mockFilter = { firstName: "Nonexistent", lastName: "User", mobile: "0412345678" };            
            const execMock = jest.fn().mockResolvedValue(null);
            (User.findOne as jest.Mock).mockReturnValue({ exec: execMock });

            // Act
            const result = await UserRepository.findOne(mockFilter);

            // Assert
            expect(User.findOne).toHaveBeenCalledWith(mockFilter);
            expect(execMock).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });

    describe("findAll", () => {
        test("Case: Should find all users with default empty filter", async () => {
            // Arrange
            const mockUsers = [
                { _id: "0a6e91", firstName: "Test", lastName: "User 1", email: "test1@example.com", mobile: "0412345678" },
                { _id: "ee0f65", firstName: "Test", lastName: "User 2", email: "test2@example.com", mobile: "0412345678" }
            ];
            const execMock = jest.fn().mockResolvedValue(mockUsers);
            const selectMock = jest.fn().mockReturnValue({ exec: execMock });
            (User.find as jest.Mock).mockReturnValue({ select: selectMock });

            // Act
            const result = await UserRepository.findAll();

            // Assert
            expect(User.find).toHaveBeenCalledWith({});
            expect(selectMock).toHaveBeenCalledWith("-password");
            expect(execMock).toHaveBeenCalled();
            expect(result).toEqual(mockUsers);
        });

        test("Case: Should find users with specified filter", async () => {
            // Arrange
            const mockFilter = { role: "admin" };
            const mockUsers = [
                { _id: "84a0af", firstName: "Admin", lastName: "User", email: "admin@example.com", mobile: "0412345678", role: "admin" }
            ];
            const execMock = jest.fn().mockResolvedValue(mockUsers);
            const selectMock = jest.fn().mockReturnValue({ exec: execMock });
            (User.find as jest.Mock).mockReturnValue({ select: selectMock });

            // Act
            const result = await UserRepository.findAll(mockFilter);

            // Assert
            expect(User.find).toHaveBeenCalledWith(mockFilter);
            expect(selectMock).toHaveBeenCalledWith("-password");
            expect(execMock).toHaveBeenCalled();
            expect(result).toEqual(mockUsers);
        });
    });

    describe("create", () => {
        test("Case: Should create a new user", async () => {
            // Arrange
            const mockUserData = {
                firstName: "New",
                lastName: "User",
                email: "new@example.com",
                mobile: "0412345678",
                password: "password123"
            };            
            const mockSavedUser = { _id: "8a8541", ...mockUserData };
            const saveMock = jest.fn().mockResolvedValue(mockSavedUser);
            (User as unknown as jest.Mock).mockImplementation(() => ({
                save: saveMock
            }));

            // Act
            const result = await UserRepository.create(mockUserData);

            // Assert
            expect(User).toHaveBeenCalledWith(mockUserData);
            expect(saveMock).toHaveBeenCalled();
            expect(result).toEqual(mockSavedUser);
        });
    });

    describe("update", () => {
        test("Case: Should update a user successfully", async () => {
            // Arrange
            const mockFilter = { _id: "8382ff" };
            const mockUpdate = { firstName: "Updated", lastName: "Name" };
            const mockUpdatedUser = {
                _id: "8382ff",
                firstName: "Updated",
                lastName: "Name",
                mobile: "0412345678",
                email: "test@example.com"
            };
            const execMock = jest.fn().mockResolvedValue(mockUpdatedUser);
            (User.findOneAndUpdate as jest.Mock).mockReturnValue({ exec: execMock });

            // Act
            const result = await UserRepository.update(mockFilter, mockUpdate);

            // Assert
            expect(User.findOneAndUpdate).toHaveBeenCalledWith(mockFilter, mockUpdate, { new: true });
            expect(execMock).toHaveBeenCalled();
            expect(result).toEqual(mockUpdatedUser);
        });

        test("Case: Should return null if no user matches the filter", async () => {
            // Arrange
            const mockFilter = { _id: "nonexistentid" };
            const mockUpdate = { firstName: "Updated", lastName: "Name" };
            const execMock = jest.fn().mockResolvedValue(null);
            (User.findOneAndUpdate as jest.Mock).mockReturnValue({ exec: execMock });

            // Act
            const result = await UserRepository.update(mockFilter, mockUpdate);

            // Assert
            expect(User.findOneAndUpdate).toHaveBeenCalledWith(mockFilter, mockUpdate, { new: true });
            expect(execMock).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });

    describe("delete", () => {
        test("Case: Should delete a user successfully", async () => {
            // Arrange
            const mockFilter = { _id: "80507f" };
            const mockDeletedUser = {
                _id: "80507f",
                firstName: "Test User FirstName",
                lastName: "Test User LastName",
                mobile: "0412345678",
                email: "test@example.com"
            };
            const execMock = jest.fn().mockResolvedValue(mockDeletedUser);
            (User.findOneAndDelete as jest.Mock).mockReturnValue({ exec: execMock });

            // Act
            const result = await UserRepository.delete(mockFilter);

            // Assert
            expect(User.findOneAndDelete).toHaveBeenCalledWith(mockFilter);
            expect(execMock).toHaveBeenCalled();
            expect(result).toEqual(mockDeletedUser);
        });

        test("Case: Should return null if no user matches the filter", async () => {
            // Arrange
            const mockFilter = { _id: "nonexistentid" };
            const execMock = jest.fn().mockResolvedValue(null);
            (User.findOneAndDelete as jest.Mock).mockReturnValue({ exec: execMock });

            // Act
            const result = await UserRepository.delete(mockFilter);

            // Assert
            expect(User.findOneAndDelete).toHaveBeenCalledWith(mockFilter);
            expect(execMock).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });

    describe("updateRefreshToken", () => {
        test("Case: Should update refresh token successfully", async () => {
            // Arrange
            const mockUserId = "53ba72";
            const mockRefreshToken = "new-refresh-token";
            const mockExpiresAt = new Date();
            const mockUpdatedUser = {
                _id: mockUserId,
                firstName: "Test User FirstName",
                lastName: "Test User LastName",
                email: "test@example.com",
                mobile: "0412345678",
                refreshToken: mockRefreshToken,
                refreshTokenExpiresAt: mockExpiresAt
            };
            (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedUser);

            // Act
            const result = await UserRepository.updateRefreshToken(
                mockUserId,
                mockRefreshToken,
                mockExpiresAt
            );

            // Assert
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                mockUserId,
                {
                    refreshToken: mockRefreshToken,
                    refreshTokenExpiresAt: mockExpiresAt
                },
                { new: true }
            );
            expect(result).toEqual(mockUpdatedUser);
        });

        test("Case: Should clear refresh token when null values provided", async () => {
            // Arrange
            const mockUserId = "52d7c0";
            const mockRefreshToken = null;
            const mockExpiresAt = null;
            const mockUpdatedUser = {
                _id: mockUserId,
                firstName: "Test User FirstName",
                lastName: "Test User LastName",
                email: "test@example.com",
                mobile: "0412345678",
                refreshToken: null,
                refreshTokenExpiresAt: null
            };
            (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedUser);

            // Act
            const result = await UserRepository.updateRefreshToken(
                mockUserId,
                mockRefreshToken,
                mockExpiresAt
            );

            // Assert
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                mockUserId,
                {
                    refreshToken: null,
                    refreshTokenExpiresAt: null
                },
                { new: true }
            );
            expect(result).toEqual(mockUpdatedUser);
        });
    });
});