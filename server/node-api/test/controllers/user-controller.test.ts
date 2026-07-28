import { Request, Response } from "express";
import UserController from "../../src/controllers/user-controller";
import UserService from "../../src/services/user-service";
import { UserItemResponse } from "../../src/dtos/user-item-response";
import jwt from "jsonwebtoken";
import generateToken from "../../src/utils/generate-token";

jest.mock("jsonwebtoken");
jest.mock("../../src/utils/generate-token", () => ({
    __esModule: true,
    default: jest.fn()
}));


// Mock the UserService
jest.mock("../../src/services/user-service");

// Mock the UserItemResponse class
jest.mock("../../src/dtos/user-item-response", () => {
  return {
    UserItemResponse: jest.fn().mockImplementation((user) => {
      return { ...user };
    })
  };
});

describe("UserController", () => {
  // Common test variables
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks for each test
    mockUserService = new UserService() as jest.Mocked<UserService>;
    userController = new UserController(mockUserService);

    // Set up request and response mocks
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRequest = {};
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe("register", () => {
    test("Case: Registers user successfully", async () => {
      // Arrange
      const userData = {
        email: "test@example.com",
        password: "password123",
        firstName: "Test User FirstName",
        lastName: "Test User LastName",
        mobile: "0412345678"
      };
      mockRequest.body = userData;

      const mockUser = { id: "1", ...userData };
      mockUserService.register = jest.fn().mockResolvedValue(mockUser);

      // Act
      await userController.register(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.register).toHaveBeenCalledWith(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.mobile,
      );
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "User registered successfully",
        data: mockUser
      });
    });

    test("Case: Registration fails due to duplicate email", async () => {
      // Arrange
      const userData = {
        email: "test@example.com",
        password: "password123",
        firstName: "Test User FirstName",
        lastName: "Test User LastName",
        mobile: "Test User Mobile",
      };
      mockRequest.body = userData;

      const errorMessage = "Email already exists";
      mockUserService.register = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      await userController.register(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.register).toHaveBeenCalledWith(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.mobile,
      );
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: errorMessage
      });
    });
  });

  describe("login", () => {
    test("Case: Successful user login", async () => {
      // Arrange
      const loginData = {
        email: "test@example.com",
        password: "password123"
      };
      mockRequest.body = loginData;

      const mockUser = {
        id: "1",
        email: loginData.email,
        firstName: "Test User FirstName",
        lastName: "Test User LastName",
        mobile: "Test User Mobile"
      };
      const mockAuthResponse = {
        data: mockUser,
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token"
      };
      mockUserService.authenticate = jest.fn().mockResolvedValue(mockAuthResponse);

      // Act
      await userController.login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.authenticate).toHaveBeenCalledWith(
        loginData.email,
        loginData.password
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Login successful",
        data: {
          user: mockUser,
          accessToken: {
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token"
          }
        }
      });
    });

    test("Case: Failure login with incorrect credentials", async () => {
      // Arrange
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword"
      };
      mockRequest.body = loginData;

      const errorMessage = "Invalid credentials";
      mockUserService.authenticate = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      await userController.login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.authenticate).toHaveBeenCalledWith(
        loginData.email,
        loginData.password
      );
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: errorMessage
      });
    });
  });

  describe("refreshToken", () => {
    test("Case: Successfully refreshes token", async () => {
      // Arrange
      mockRequest.body = { refreshToken: "valid-refresh-token" };

      const mockTokenResponse = {
        accessToken: "new-access-token"
      };
      mockUserService.refreshAccessToken = jest.fn().mockResolvedValue(mockTokenResponse);

      // Act
      await userController.refreshToken(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.refreshAccessToken).toHaveBeenCalledWith("valid-refresh-token");
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Token refreshed successfully",
        data: {
          accessToken: "new-access-token"
        }
      });
    });

    test("Case: Missing refresh token", async () => {
      // Arrange
      mockRequest.body = {};

      // Act
      await userController.refreshToken(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.refreshAccessToken).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Refresh token is required"
      });
    });

    test("Case: Invalid refresh token", async () => {
      // Arrange
      mockRequest.body = { refreshToken: "invalid-refresh-token" };

      const errorMessage = "Invalid refresh token";
      mockUserService.refreshAccessToken = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      await userController.refreshToken(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.refreshAccessToken).toHaveBeenCalledWith("invalid-refresh-token");
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: errorMessage
      });
    });
  });

  describe("getUserById", () => {
    test("Case: Successfully get user by ID", async () => {
      // Arrange
      const userId = "user123";
      mockRequest.user = { id: userId };

      const mockUser = {
        id: userId,
        email: "test@example.com",
        firstName: "Test User FirstName",
        lastName: "Test User LastName",
        mobile: "Test User Mobile"
      };
      mockUserService.getUserById = jest.fn().mockResolvedValue(mockUser);

      // Act
      await userController.getUserById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith(userId);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "success",
        data: expect.objectContaining({
          id: userId
        })
      });
    });

    test("Case: user not found by ID", async () => {
      // Arrange
      const userId = "nonexistent";
      mockRequest.user = { id: userId };

      mockUserService.getUserById = jest.fn().mockResolvedValue(null);

      // Act
      await userController.getUserById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith(userId);
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "User not found"
      });
    });

    test("Case: server error when getting user by ID", async () => {
      // Arrange
      const userId = "user123";
      mockRequest.user = { id: userId };

      const errorMessage = "Database connection error";
      mockUserService.getUserById = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      await userController.getUserById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith(userId);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: errorMessage
      });
    });
  });

  describe("getUserByEmail", () => {
    test("Case: Successfully get user by email", async () => {
      // Arrange
      const userEmail = "test@example.com";
      mockRequest.query = { email: userEmail };

      const mockUser = {
        id: "user123",
        email: userEmail,
        firstName: "Test User FirstName",
        lastName: "Test User LastName",
        mobile: "Test User Mobile"
      };
      mockUserService.getUserByEmail = jest.fn().mockResolvedValue(mockUser);

      // Act
      await userController.getUserByEmail(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(userEmail);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: userEmail,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          mobile: mockUser.mobile,
          id: mockUser.id,
        }),
        message: "success",
      });
    });

    test("Case: Fail to find non-existant user email", async () => {
      // Arrange
      const userEmail = "nonexistent@example.com";
      mockRequest.query = { email: userEmail };

      mockUserService.getUserByEmail = jest.fn().mockResolvedValue(null);

      // Act
      await userController.getUserByEmail(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(userEmail);
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "User not found"
      });
    });

    test("Case: server error when getting user by email", async () => {
      // Arrange
      const userEmail = "test@example.com";
      mockRequest.query = { email: userEmail };

      const errorMessage = "Database connection error";
      mockUserService.getUserByEmail = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      await userController.getUserByEmail(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(userEmail);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: errorMessage
      });
    });
  });



    describe("jwtLogin", () => {
        test("Case: No authorization header", async () => {
            // Arrange
            mockRequest.headers = {};

            // Act
            await userController.jwtLogin(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ message: "No token provided" });
        });

        test("Case: Valid token, user found", async () => {
            // Arrange
            const mockUser = { id: "1", email: "test@example.com", save: jest.fn() };
            (jwt.verify as jest.Mock).mockReturnValue({ id: "1" });
            mockUserService.getUserById = jest.fn().mockResolvedValue(mockUser);
            mockRequest.headers = { authorization: "Bearer validtoken" };

            // Act
            await userController.jwtLogin(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockUserService.getUserById).toHaveBeenCalledWith("1");
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Automatic Login Successful",
                data: {
                    user: mockUser,
                    accessToken: "validtoken"
                }
            });
        });

        test("Case: Valid token but user not found", async () => {
            // Arrange
            (jwt.verify as jest.Mock).mockReturnValue({ id: "2" });
            mockUserService.getUserById = jest.fn().mockResolvedValue(null);
            mockRequest.headers = { authorization: "Bearer othertoken" };

            // Act
            await userController.jwtLogin(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ message: "User not found" });
        });

        test("Case: Expired token but refresh token still valid", async () => {
            // Arrange
            (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error("TokenExpiredError"); });
            (jwt.decode as jest.Mock).mockReturnValue({ id: "3" });

            const mockUser = {
                id: "3",
                refreshTokenExpiresAt: new Date(Date.now() + 10000),
                save: jest.fn()
            };
            mockUserService.getUserById = jest.fn().mockResolvedValue(mockUser);
            (generateToken as jest.Mock).mockReturnValue("new-access-token");
            mockRequest.headers = { authorization: "Bearer expiredtoken" };

            // Act
            await userController.jwtLogin(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(generateToken).toHaveBeenCalledWith(mockUser, "1h");
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Automatic Login Successful",
                data: {
                    user: mockUser,
                    accessToken: "new-access-token"
                }
            });
        });

        test("Case: Expired token and refresh token expired", async () => {
            // Arrange
            (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error("TokenExpiredError"); });
            (jwt.decode as jest.Mock).mockReturnValue({ id: "4" });

            const mockUser = {
                id: "4",
                refreshTokenExpiresAt: new Date(Date.now() - 10000)
            };
            mockUserService.getUserById = jest.fn().mockResolvedValue(mockUser);
            mockRequest.headers = { authorization: "Bearer expiredtoken" };

            // Act
            await userController.jwtLogin(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Refresh token expired, please log in again"
            });
        });

        test("Case: Invalid token structure", async () => {
            // Arrange
            (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error("Invalid token"); });
            (jwt.decode as jest.Mock).mockReturnValue(null);
            mockRequest.headers = { authorization: "Bearer badtoken" };

            // Act
            await userController.jwtLogin(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Invalid token" });
        });
    });

  
  describe("getAllUser", () => {
    test("Case: Successfully get all users", async () => {
      // Arrange
      const mockUsers = [
        { id: "1", email: "user1@example.com", firstName: "User One FirstName", lastName: "User One LastName", mobile: "0142345678" },
        { id: "2", email: "user2@example.com", firstName: "User Two FirstName", lastName: "User Two LastName", mobile: "0142345678" }
      ];
      mockUserService.getAllUser = jest.fn().mockResolvedValue(mockUsers);

      // Act
      await userController.getAllUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getAllUser).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "success",
        data: expect.arrayContaining([
          expect.objectContaining({ id: "1" }),
          expect.objectContaining({ id: "2" })
        ])
      });
    });

    test("Case: Handle server error when getting all users", async () => {
      // Arrange
      const errorMessage = "Database connection error";
      mockUserService.getAllUser = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      await userController.getAllUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.getAllUser).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: errorMessage
      });
    });
  });
});
