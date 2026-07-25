import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { isAdminAuthenticated } from "../../src/middlewares/is-admin-auth";

// Mock dependencies
jest.mock("jsonwebtoken");

describe("is-admin-auth", () => {

  describe("isAdminAuthenticated", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: jest.Mock;

    beforeEach(() => {
      // Reset mocks before each test
      mockRequest = {
        headers: {}
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      nextFunction = jest.fn();
      jest.clearAllMocks();
    });

    test("Case: Returns 401 when no token is provided", () => {
      // Arrange
      mockRequest.headers = { authorization: undefined };

      // Act
      isAdminAuthenticated(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "No token provided" });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    test("Case: Returns 401 when the authorisation header is empty", () => {
      // Arrange
      mockRequest.headers = { authorization: "" };

      // Act
      isAdminAuthenticated(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "No token provided" });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    test("Case: Return 401 if token is invalid", () => {
      // Arrange
      mockRequest.headers = { authorization: "Bearer invalidtoken" };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      // Act
      isAdminAuthenticated(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith("invalidtoken", process.env.JWT_SECRET);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "Invalid token" });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    test("Case: Return 403 if user is not an admin", () => {
      // Arrange
      mockRequest.headers = { authorization: "Bearer validtoken" };
      (jwt.verify as jest.Mock).mockReturnValue({ admin: false });

      // Act
      isAdminAuthenticated(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith("validtoken", process.env.JWT_SECRET);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "Access denied" });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    test("Case: Calls next middleware if token is valid", () => {
      // Arrange
      mockRequest.headers = { authorization: "Bearer validadmintoken" };
      (jwt.verify as jest.Mock).mockReturnValue({ admin: true });

      // Act
      isAdminAuthenticated(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith("validadmintoken", process.env.JWT_SECRET);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});