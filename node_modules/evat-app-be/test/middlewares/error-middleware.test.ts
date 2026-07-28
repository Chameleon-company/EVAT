import { notFound, errorHandler } from "../../src/middlewares/error-middleware";

describe("error-middleware", () => {
  describe("notFound", () => {
    test("Case: Sets 404 status and passes error to next function", async () => {
      // Arrange
      const req: any = {
        originalUrl: "/test-url"
      };
      const res: any = {
        status: jest.fn()
      };
      const next = jest.fn();

      // Act
      await notFound(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toBe("Not Found /test-url");
    });
  });

  describe("errorHandler", () => {
    test("Case: Uses existing status code when not 200", () => {
      // Arrange
      const err = new Error("Test error");
      const req: any = {};
      const res: any = {
        statusCode: 400,
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      errorHandler(err, req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Test error"
      });
    });

    test("Case: Uses status code 500 when current status is 200", () => {
      // Arrange
      const err = new Error("Server error");
      const req: any = {};
      const res: any = {
        statusCode: 200,
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      errorHandler(err, req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Server error"
      });
    });

    test("Case: Handles errors without message property", () => {
      // Arrange
      const err = { custom: "error without message" };
      const req: any = {};
      const res: any = {
        statusCode: 404,
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      errorHandler(err, req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: undefined
      });
    });
  });
});