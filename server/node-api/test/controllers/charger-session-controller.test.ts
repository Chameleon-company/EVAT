import { Request, Response } from 'express';
import ChargerSessionController from '../../src/controllers/charger-session-controller';
import ChargerSessionService from '../../src/services/charger-session-service';

// Mock the service layer interactions
const mockService = {
  createSession: jest.fn(),
  endSession: jest.fn(),
  getSessionById: jest.fn(),
  getSessionsByUser: jest.fn(),
  getSessionsByStation: jest.fn(),
};

// Mock charger-session-controller behaviour
describe('charger-session-controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let controller: ChargerSessionController;

  // Prepare the statements (req/res objects)
  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    // Mock service instance
    controller = new ChargerSessionController(mockService as unknown as ChargerSessionService);
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    test('Case: should return 201 with created session', async () => {
      // Arrange
      req.body = { userId: 'user1', stationId: 'stationA' };
      const mockSession = { _id: '123', userId: 'user1', stationId: 'stationA', status: 'in_progress' };
      mockService.createSession.mockResolvedValue(mockSession);

      // Act
      await controller.createSession(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: `Charging session ID ${mockSession._id} started.`,
        data: mockSession,
      });
    });

    test('Case: should handle error if service throws', async () => {
      // Arrange
      req.body = {};
      mockService.createSession.mockRejectedValue(new Error('User ID or Station ID are required'));

      // Act
      await controller.createSession(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User ID or Station ID are required' });
    });
  });

  describe('endSession', () => {
    test('Case: should end session successfully', async () => {
      // Arrange
      req.params = { sessionId: '123' };
      const mockSession = { _id: '123', status: 'completed', endTime: new Date() };
      mockService.endSession.mockResolvedValue(mockSession);

      // Act
      await controller.endSession(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: `Charging session ID ${mockSession._id} ended.`,
        data: mockSession,
      });
    });

    test('Case: should handle not found error', async () => {
      // Arrange
      req.params = { sessionId: 'nonexistent' };
      mockService.endSession.mockRejectedValue(new Error('Session with ID nonexistent not found.'));

      // Act
      await controller.endSession(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Session with ID nonexistent not found.' });
    });
  });

  describe('getSessionById', () => {
    test('Case: should fetch session successfully', async () => {
      // Arrange
      req.params = { sessionId: '123' };
      const mockSession = { _id: '123', status: 'in_progress' };
      mockService.getSessionById.mockResolvedValue(mockSession);

      // Act
      await controller.getSessionById(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: `Success! Session ID ${mockSession._id} found.`,
        data: mockSession,
      });
    });

    test('Case: should handle not found', async () => {
      // Arrange
      req.params = { sessionId: 'nonexistent' };
      mockService.getSessionById.mockRejectedValue(new Error('Session with ID nonexistent not found.'));

      // Act
      await controller.getSessionById(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Session with ID nonexistent not found.' });
    });
  });

  describe('getSessionsByUser', () => {
    test('Case: should fetch user sessions successfully', async () => {
      // Arrange
      req.params = { userId: 'user1' };
      const mockSessions = [{ _id: '1', userId: 'user1', status: 'in_progress' }];
      mockService.getSessionsByUser.mockResolvedValue(mockSessions);

      // Act
      await controller.getSessionsByUser(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: `User ID ${req.params.userId} sessions found.`,
        data: mockSessions,
      });
    });

    test('Case: should handle service error', async () => {
      // Arrange
      req.params = { userId: 'user1' };
      mockService.getSessionsByUser.mockRejectedValue(new Error('Database error'));

      // Act
      await controller.getSessionsByUser(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('getSessionsByStation', () => {
    test('Case: should fetch station sessions successfully', async () => {
      // Arrange
      req.params = { stationId: 'stationA' };
      const mockSessions = [{ _id: '1', stationId: 'stationA', status: 'in_progress' }];
      mockService.getSessionsByStation.mockResolvedValue(mockSessions);

      // Act
      await controller.getSessionsByStation(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: `Station sessions ID ${req.params.stationId} found.`,
        data: mockSessions,
      });
    });

    test('Case: should handle service error', async () => {
      // Arrange
      req.params = { stationId: 'stationA' };
      mockService.getSessionsByStation.mockRejectedValue(new Error('Database error'));

      // Act
      await controller.getSessionsByStation(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });
});
