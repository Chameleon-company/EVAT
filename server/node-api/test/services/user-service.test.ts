import UserService from "../../src/services/user-service";
import User from "../../src/models/user-model";
import UserRepository from "../../src/repositories/user-repository";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import generateToken from "../../src/utils/generate-token";

// Mock dependencies
jest.mock("../../src/repositories/user-repository");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../../src/utils/generate-token");
jest.mock("../../src/models/user-model", () => {
    return jest.fn().mockImplementation(() => ({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        mobile: "",
        role: "user",
        refreshToken: null,
        refreshTokenExpiresAt: null
    }));
});

describe("user-service", () => {
    let userService: UserService;

    beforeEach(() => {
        userService = new UserService();

        // Clear all mocks before each test
        jest.clearAllMocks();

        // Set up a spy for the hashPassword method
        jest.spyOn(userService, 'hashPassword');
    });

    describe("register", () => {
        test("Case: Successfully registers a new user", async () => {
            // Arrange
            const mockEmail = "test@example.com";
            const mockPassword = "password123";
            const mockFirstName = "Test";
            const mockLastName = "User";
            const mockMobile = "0412345678";
            const mockHashedPassword = "hashedPassword123";
            const mockNewUser = {
                email: mockEmail,
                password: mockHashedPassword,
                firstName: mockFirstName,
                lastName: mockLastName,
                mobile: mockMobile
            };
            const mockCreatedUser = {
                id: "user123",
                ...mockNewUser
            };

            (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
            (userService.hashPassword as jest.Mock) = jest.fn().mockResolvedValue(mockHashedPassword);

            // Mock the User constructor behavior
            const mockUserInstance = {
                email: "",
                password: "",
                firstName: "",
                lastName: "",
                mobile: ""
            };
            (User as unknown as jest.Mock).mockImplementation(() => mockUserInstance);

            (UserRepository.create as jest.Mock).mockResolvedValue(mockCreatedUser);

            // Act
            const result = await userService.register(mockEmail, mockPassword, mockFirstName, mockLastName, mockMobile);
            
            // Assert
            expect(UserRepository.findByEmail).toHaveBeenCalledWith(mockEmail);
            expect(userService.hashPassword).toHaveBeenCalledWith(mockPassword);
            expect(User).toHaveBeenCalled();
            expect(mockUserInstance.email).toBe(mockEmail);
            expect(mockUserInstance.password).toBe(mockHashedPassword);
            expect(mockUserInstance.firstName).toBe(mockFirstName);
            expect(mockUserInstance.lastName).toBe(mockLastName);
            expect(mockUserInstance.mobile).toBe(mockMobile);
            expect(UserRepository.create).toHaveBeenCalledWith(mockUserInstance);
            expect(result).toEqual(mockCreatedUser);
        });

        test("Case: Throws error if email already exists", async () => {
            // Arrange
            const mockEmail = "existing@example.com";
            const mockPassword = "password123";
            const mockFirstName = "Existing";
            const mockLastName = "User";
            const mockMobile = "0412345678";
            const mockExistingUser = {
                id: "user123",
                email: mockEmail
            };

            (UserRepository.findByEmail as jest.Mock).mockResolvedValue(mockExistingUser);

            // Act & Assert
            await expect(userService.register(mockEmail, mockPassword, mockFirstName, mockLastName, mockMobile))
                .rejects
                .toThrow(`Error during user registration: The auth account with email = [${mockEmail}] has already existed`);
            expect(UserRepository.findByEmail).toHaveBeenCalledWith(mockEmail);
        });

        test("Case: Handles unknown errors during registration", async () => {
            // Arrange
            const mockEmail = "test@example.com";
            const mockPassword = "password123";
            const mockFirstName = "Test User FirstName";
            const mockLastName = "Test User LastName";
            const mockMobile = "Test User Mobile";

            (UserRepository.findByEmail as jest.Mock).mockImplementation(() => {
                throw new Error("Database connection error");
            });

            // Act & Assert
            await expect(userService.register(mockEmail, mockPassword, mockFirstName, mockLastName, mockMobile))
                .rejects
                .toThrow("Error during user registration: Database connection error");
        });
    });

    describe("authenticate", () => {
        test("Case: Successfully authenticates user", async () => {
            // Arrange
            const mockEmail = "test@example.com";
            const mockPassword = "password123";
            const mockUser = {
                id: "user123",
                email: mockEmail,
                password: "hashedPassword123"
            };
            const mockAccessToken = "access-token-123";
            const mockRefreshToken = "refresh-token-123";

            (UserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
            (generateToken as jest.Mock).mockImplementation((user, expiry) => {
                if (expiry === "1h") return mockAccessToken;
                if (expiry === "1d") return mockRefreshToken;
                return "";
            });
            (UserRepository.updateRefreshToken as jest.Mock).mockResolvedValue(true);

            // Act
            const result = await userService.authenticate(mockEmail, mockPassword);

            // Assert
            expect(UserRepository.findByEmail).toHaveBeenCalledWith(mockEmail);
            expect(bcrypt.compareSync).toHaveBeenCalledWith(mockPassword, mockUser.password);
            expect(generateToken).toHaveBeenCalledWith(mockUser, "1h");
            expect(generateToken).toHaveBeenCalledWith(mockUser, "1d");
            expect(UserRepository.updateRefreshToken).toHaveBeenCalledWith(
                mockUser.id,
                mockRefreshToken,
                expect.any(Date)
            );
            expect(result).toEqual({
                data: mockUser,
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken
            });
        });

        test("Case: Throws error when user does not exist", async () => {
            // Arrange
            const mockEmail = "nonexistent@example.com";
            const mockPassword = "password123";

            (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);

            // Act & Assert
            await expect(userService.authenticate(mockEmail, mockPassword))
                .rejects
                .toThrow(`Authentication failed: The account with email = [${mockEmail}] does not exist`);
        });

        test("Case: Throws error when password is invalid", async () => {
            // Arrange
            const mockEmail = "test@example.com";
            const mockPassword = "wrongpassword";
            const mockUser = {
                id: "user123",
                email: mockEmail,
                password: "hashedPassword123"
            };

            (UserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

            // Act & Assert
            await expect(userService.authenticate(mockEmail, mockPassword))
                .rejects
                .toThrow(`Authentication failed: Invalid password for email = [${mockEmail}]`);
        });
    });

    describe("refreshAccessToken", () => {
        test("Case: Successfully refreshes access token with valid refresh token", async () => {
            // Arrange
            const mockRefreshToken = "valid-refresh-token";
            const mockNewAccessToken = "new-access-token";
            const mockNewRefreshToken = "new-refresh-token";
            const mockDecodedToken = {
                id: "user123",
                email: "test@example.com",
                role: "user"
            };
            const mockUser = {
                id: "user123",
                refreshToken: mockRefreshToken,
                refreshTokenExpiresAt: new Date(Date.now() + 3600000) // Valid for 1 more hour
            };

            process.env.JWT_SECRET = "test-secret";

            (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
            (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
            (generateToken as jest.Mock).mockImplementation((user, expiry) => {
                if (expiry === "1h") return mockNewAccessToken;
                if (expiry === "1d") return mockNewRefreshToken;
                return "";
            });
            (UserRepository.updateRefreshToken as jest.Mock).mockResolvedValue(true);

            // Act
            const result = await userService.refreshAccessToken(mockRefreshToken);

            // Assert
            expect(jwt.verify).toHaveBeenCalledWith(mockRefreshToken, "test-secret");
            expect(UserRepository.findById).toHaveBeenCalledWith(mockDecodedToken.id);
            expect(generateToken).toHaveBeenCalledWith(mockUser, "1h");
            expect(generateToken).toHaveBeenCalledWith(mockUser, "1d");
            expect(UserRepository.updateRefreshToken).toHaveBeenCalledWith(
                mockUser.id,
                mockNewRefreshToken,
                expect.any(Date)
            );
            expect(result).toEqual({
                accessToken: mockNewAccessToken,
                refreshToken: mockNewRefreshToken
            });
        });

        test("Case: Throws error when JWT_SECRET is not defined", async () => {
            // Arrange
            const mockRefreshToken = "valid-refresh-token";
            const originalSecret = process.env.JWT_SECRET; // store old secret
            delete process.env.JWT_SECRET;

            // Act & Assert
            try {
            await expect(userService.refreshAccessToken(mockRefreshToken))
                .rejects
                .toThrow("Failed to refresh token: JWT_SECRET is not defined");
            }
            finally {
                process.env.JWT_SECRET = originalSecret; // restore secret
            }
        });

        test("Case: Throws error when refresh token is invalid", async () => {
            // Arrange
            const mockRefreshToken = "invalid-refresh-token";
            const mockDecodedToken = {
                id: "user123",
                email: "test@example.com",
                role: "user"
            };

            process.env.JWT_SECRET = "test-secret";

            (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
            (UserRepository.findById as jest.Mock).mockResolvedValue(null);

            // Act & Assert
            await expect(userService.refreshAccessToken(mockRefreshToken))
                .rejects
                .toThrow("Failed to refresh token: Invalid refresh token");
        });

        test("Case: Throws error when refresh token does not match stored token", async () => {
            // Arrange
            const mockRefreshToken = "valid-refresh-token";
            const mockDecodedToken = {
                id: "user123",
                email: "test@example.com",
                role: "user"
            };
            const mockUser = {
                id: "user123",
                refreshToken: "different-refresh-token",
                refreshTokenExpiresAt: new Date(Date.now() + 3600000)
            };

            process.env.JWT_SECRET = "test-secret";

            (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
            (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);

            // Act & Assert
            await expect(userService.refreshAccessToken(mockRefreshToken))
                .rejects
                .toThrow("Failed to refresh token: Invalid refresh token");
        });

        test("Case: Throws error when refresh token has expired", async () => {
            // Arrange
            const mockRefreshToken = "expired-refresh-token";
            const mockDecodedToken = {
                id: "user123",
                email: "test@example.com",
                role: "user"
            };
            const mockUser = {
                id: "user123",
                refreshToken: mockRefreshToken,
                refreshTokenExpiresAt: new Date(Date.now() - 3600000) // Expired 1 hour ago
            };

            process.env.JWT_SECRET = "test-secret";

            (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
            (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);

            // Act & Assert
            await expect(userService.refreshAccessToken(mockRefreshToken))
                .rejects
                .toThrow("Failed to refresh token: Refresh token has expired");
        });
    });

    describe("getAllUser", () => {
        test("Case: Successfully retrieves all users", async () => {
            // Arrange
            const mockUsers = [
                { id: "user1", email: "user1@example.com" },
                { id: "user2", email: "user2@example.com" }
            ];

            (UserRepository.findAll as jest.Mock).mockResolvedValue(mockUsers);

            // Act
            const result = await userService.getAllUser();

            // Assert
            expect(UserRepository.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockUsers);
        });
    });

    describe("getUserById", () => {
        test("Case: Successfully retrieves user by ID", async () => {
            // Arrange
            const mockUserId = "user123";
            const mockUser = {
                id: mockUserId,
                email: "test@example.com"
            };

            (UserRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

            // Act
            const result = await userService.getUserById(mockUserId);

            // Assert
            expect(UserRepository.findOne).toHaveBeenCalledWith({ _id: mockUserId });
            expect(result).toEqual(mockUser);
        });
    });

    describe("getUserByEmail", () => {
        test("Case: Successfully retrieves user by email", async () => {
            // Arrange
            const mockEmail = "test@example.com";
            const mockUser = {
                id: "user123",
                email: mockEmail
            };

            (UserRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

            // Act
            const result = await userService.getUserByEmail(mockEmail);

            // Assert
            expect(UserRepository.findOne).toHaveBeenCalledWith({ email: mockEmail });
            expect(result).toEqual(mockUser);
        });
    });

    describe("hashPassword", () => {
        test("Case: Successfully hashes password", async () => {
            // Arrange
            const mockPassword = "password123";
            const mockSalt = "salt123";
            const mockHashedPassword = "hashedPassword123";

            (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
            (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);

            // Act
            const result = await userService.hashPassword(mockPassword);

            // Assert
            expect(bcrypt.genSalt).toHaveBeenCalled();
            expect(bcrypt.hash).toHaveBeenCalledWith(mockPassword, mockSalt);
            expect(result).toEqual(mockHashedPassword);
        });
    });
});