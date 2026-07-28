// /test/services/charger-session-service.test.ts
import { Types } from 'mongoose';
import ChargerSessionService from '../../src/services/charger-session-service';
import ChargerSessionRepository from '../../src/repositories/charger-session-repository';
import { IChargerSession } from '../../src/models/charger-session-model';

describe('ChargerSessionService', () => {
  let service: ChargerSessionService;
  let repo: jest.Mocked<ChargerSessionRepository>;

  beforeEach(() => {
    // Mock the repository
    repo = {
      create: jest.fn(),
      findById: jest.fn(),
      endSession: jest.fn(),
      findByUser: jest.fn(),
      findByStation: jest.fn(),
    } as unknown as jest.Mocked<ChargerSessionRepository>;

    service = new ChargerSessionService(repo);
  });

  describe('createSession', () => {
    test('Case: should throw error if userId or stationId missing', async () => {
      // Arrange
      const invalidData = { userId: '123' };

      // Act and Assert
      await expect(service.createSession(invalidData as any))
      .rejects
      .toThrow('User ID or Station ID are required to start a session.');
    });

    test('Case: should create session with defaults', async () => {
      // Arrange
      // Create ObjectId
      const userId = new Types.ObjectId();
      const stationId = new Types.ObjectId();

      const input = {   // Generates 24-char hexadecimal on the ObjectId
        userId: userId.toHexString(),
        stationId: stationId.toHexString(),
      };

      // Mock return uses ObjectId
      const created = {
        ...input,
        userId,
        stationId,
        status: 'in_progress',
        startTime: new Date(),
      };
      repo.create.mockResolvedValue(created as any);

      // Act
      const result = await service.createSession(input);

      // Assert
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: expect.any(Types.ObjectId),
        stationId: expect.any(Types.ObjectId),
        status: 'in_progress',
        startTime: expect.any(Date),
      }));
      expect(result).toEqual(created);
    });
  });

  describe('endSession', () => {
    test('Case: should throw error if session not found', async () => {
      // Arrange
      repo.findById.mockResolvedValue(null);

      // Act and Assert
      await expect(service.endSession('nonexistent'))
        .rejects
        .toThrow('Session with ID nonexistent not found.');
    });

    test('Case: should throw error if session already ended', async () => {
      // Arrange
      const endedSession = { endTime: new Date() };
      repo.findById.mockResolvedValue(endedSession as any);

      // Act and Assert
      await expect(service.endSession('alreadyEnded'))
        .rejects
        .toThrow('Session is already ended.');
    });

    test('Case: should end session successfully', async () => {
      // Arrange
      const session = { _id: 'abc', endTime: null, status: 'in_progress' };
      const updatedSession = { ...session, endTime: new Date(), status: 'completed' };
      repo.findById.mockResolvedValue(session as any);
      repo.endSession.mockResolvedValue(updatedSession as any);

      // Act
      const result = await service.endSession('abc');

      // Assert
      expect(repo.endSession).toHaveBeenCalledWith('abc', expect.any(Date));
      expect(result).toEqual(updatedSession);
    });
  });

  describe('getSessionById', () => {
    test('Case: should throw if not found', async () => {
      // Arrange
      repo.findById.mockResolvedValue(null);
      
      // Act and Assert
      await expect(service.getSessionById('123')).rejects.toThrow('Session with ID 123 not found.');
    });

    test('Case: should return session if found', async () => {
      // Arrange
      const session = { _id: 'abc' };
      repo.findById.mockResolvedValue(session as any);

      // Act
      const result = await service.getSessionById('abc');

      // Assert
      expect(result).toEqual(session);
    });
  });

  describe('getSessionsByUser', () => {
    test('Case: should return user sessions', async () => {
      // Arrange
      const sessions = [{ _id: '1' }, { _id: '2' }];
      repo.findByUser.mockResolvedValue(sessions as any);

      // Act
      const result = await service.getSessionsByUser('user123');

      // Assert
      expect(result).toEqual(sessions);
      expect(repo.findByUser).toHaveBeenCalledWith('user123');
    });
  });

  describe('getSessionsByStation', () => {
    test('Case: should return station sessions', async () => {
      // Arrange
      const sessions = [{ _id: '1' }, { _id: '2' }];
      repo.findByStation.mockResolvedValue(sessions as any);

      // Act
      const result = await service.getSessionsByStation('station123');

      // Assert
      expect(result).toEqual(sessions);
      expect(repo.findByStation).toHaveBeenCalledWith('station123');
    });
  });
});
