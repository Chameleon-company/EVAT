import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authGuard } from "../../src/middlewares/auth-middleware";
import UserRepository from "../../src/repositories/user-repository";

// Mock dependencies
jest.mock("jsonwebtoken");
jest.mock("../../src/repositories/user-repository");

describe("auth-middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    req = {
      headers: {},
      user: undefined
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();

    process.env.JWT_SECRET = "test-secret";
  });
  
  // This file doesnt have separate functions for each logical flow
  describe("authGuard function", () => {
    test("Case: Returns a middleware function", () => {
      // Arrange
      const allowedRoles = ["user"];
      
      // Act
      const middleware = authGuard(allowedRoles);
      
      // Assert
      expect(typeof middleware).toBe("function");
    });
  });
  
  describe("Token validation", () => {
    test("Case: Returns 401 when no authorization header is provided", async () => {
      // Arrange
      const middleware = authGuard(["user"]);
      req.headers = {};
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "No token provided" });
      expect(next).not.toHaveBeenCalled();
    });
    
    // Use escape character as a double measure
    test("Case: Returns 401 when authorisation header doesn\'t start with Bearer", async () => {
      // Arrange
      const middleware = authGuard(["user"]);
      req.headers = { authorization: "Basic token123" };
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "No token provided" });
      expect(next).not.toHaveBeenCalled();
    });
    
    test("Case: Returns 401 when token is invalid", async () => {
      // Arrange
      const middleware = authGuard(["user"]);
      req.headers = { authorization: "Bearer invalid_token" };
      
      // Mock jwt.verify to throw an error
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  describe("Admin flow", () => {
    test("Case: Allows admin access when admin role is permitted", async () => {
      // Arrange
      const middleware = authGuard(["admin"]);
      req.headers = { authorization: "Bearer admin_token" };
      
      // Mock jwt.verify to return admin payload
      (jwt.verify as jest.Mock).mockReturnValue({
        admin: true,
        email: "admin@example.com"
      });
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(req.user).toEqual({
        id: "admin",
        email: "admin@example.com",
        role: "admin"
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    test("Case: Denies admin access when admin role is not permitted", async () => {
      // Arrange
      const middleware = authGuard(["user"]);
      req.headers = { authorization: "Bearer admin_token" };
      
      // Mock jwt.verify to return admin payload
      (jwt.verify as jest.Mock).mockReturnValue({
        admin: true,
        email: "admin@example.com"
      });
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Admin not authorized for this route" });
      expect(next).not.toHaveBeenCalled();
    });
    
    test("Case: Uses default admin email when none provided in token", async () => {
      // Arrange
      const middleware = authGuard(["admin"]);
      req.headers = { authorization: "Bearer admin_token" };
      
      // Mock jwt.verify to return admin payload without email
      (jwt.verify as jest.Mock).mockReturnValue({
        admin: true
      });
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(req.user).toEqual({
        id: "admin",
        email: "admin@evat.com",
        role: "admin"
      });
      expect(next).toHaveBeenCalled();
    });
  });
  
  describe("User flow", () => {
    test("Case: Returns 401 when user ID is missing from token", async () => {
      // Arrange
      const middleware = authGuard(["user"]);
      req.headers = { authorization: "Bearer user_token" };
      
      // Mock jwt.verify to return payload without ID
      (jwt.verify as jest.Mock).mockReturnValue({
        email: "user@example.com",
        role: "user"
      });
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid token: missing user ID" });
      expect(next).not.toHaveBeenCalled();
    });
    
    test("Case: Returns 401 when user no longer exists", async () => {
      // Arrange
      const middleware = authGuard(["user"]);
      req.headers = { authorization: "Bearer user_token" };
      
      // Mock jwt.verify to return valid user payload
      (jwt.verify as jest.Mock).mockReturnValue({
        id: "user123",
        email: "user@example.com"
      });
      
      // Mock UserRepository to return null
      (UserRepository.findById as jest.Mock).mockResolvedValue(null);
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "User no longer exists" });
      expect(next).not.toHaveBeenCalled();
    });
    
    test("Case: Returns 403 when user role is not allowed", async () => {
      // Arrange
      const middleware = authGuard(["admin"]);
      req.headers = { authorization: "Bearer user_token" };
      
      // Mock jwt.verify to return valid user payload
      (jwt.verify as jest.Mock).mockReturnValue({
        id: "user123",
        email: "user@example.com"
      });
      
      // Mock UserRepository to return a user with "user" role
      const mockUser = {
        id: "user123",
        email: "user@example.com",
        role: "user"
      };
      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Not authorized to access this route" });
      expect(next).not.toHaveBeenCalled();
    });
    
    test("Case: Allows access when user role is allowed", async () => {
      // Arrange
      const middleware = authGuard(["user"]);
      req.headers = { authorization: "Bearer user_token" };
      
      // Mock jwt.verify to return valid user payload
      (jwt.verify as jest.Mock).mockReturnValue({
        id: "user123",
        email: "user@example.com"
      });
      
      // Mock UserRepository to return a user with "user" role
      const mockUser = {
        id: "user123",
        email: "user@example.com",
        role: "user"
      };
      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});