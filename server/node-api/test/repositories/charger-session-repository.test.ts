import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import ChargerSessionRepository from '../../src/repositories/charger-session-repository';
import User from '../../src/models/profile-model';  // Import User model
import Station from '../../src/models/station-model'; // Import Station model
import ChargerSession from '../../src/models/charger-session-model';  // Import ChargerSession model

// Mock charger-session-repository
describe('ChargerSessionRepository', () => {
  let mongoServer: MongoMemoryServer;
  let repository: ChargerSessionRepository;

  // Prepare statements
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Register all models before running tests
    mongoose.model('User', User.schema);
    mongoose.model('ChargingStation', Station.schema);
    mongoose.model('ChargerSession', ChargerSession.schema);

    repository = new ChargerSessionRepository();
  });

  // Clean up after run
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Delete test case in case of interference
  afterEach(async () => {
    await ChargerSession.deleteMany({});
  });

  describe('create', () => {
    test('Case: should create a new session', async () => {
      // Arrange
      const data = {
        userId: new mongoose.Types.ObjectId(),
        stationId: new mongoose.Types.ObjectId(),
      };

      // Act
      const session = await repository.create(data);

      // Assert
      expect(session._id).toBeDefined();
      expect(session.status).toBe('in_progress');
      expect(session.startTime).toBeDefined();
    });
  });

  describe('findById', () => {
    test('Case: should find a session by ID', async () => {
      // Arrange
      const data = {
        userId: new mongoose.Types.ObjectId(),
        stationId: new mongoose.Types.ObjectId(),
      };
      const created = await repository.create(data);

      // Act
      const found = await repository.findById(created._id.toString());

      // Assert
      expect(found).not.toBeNull();
      expect(found?._id.toString()).toBe(created._id.toString());
    });
  });

  describe('endSession', () => {
    test('Case: should mark session as completed', async () => {
      // Arrange
      const data = {
        userId: new mongoose.Types.ObjectId(),
        stationId: new mongoose.Types.ObjectId(),
      };
      const created = await repository.create(data);

      // Act
      const endTime = new Date();
      const ended = await repository.endSession(created._id.toString(), endTime);

      // Assert
      expect(ended).not.toBeNull();
      expect(ended?.status).toBe('completed');
      expect(ended?.endTime?.getTime()).toBe(endTime.getTime());
    });
  });

  describe('findByUser', () => {
    test('should return all sessions for a user', async () => {
      // Arrange
      const userId = new mongoose.Types.ObjectId();
      await repository.create({ userId, stationId: new mongoose.Types.ObjectId() });
      await repository.create({ userId, stationId: new mongoose.Types.ObjectId() });

      // Act
      const sessions = await repository.findByUser(userId.toString());
      
      // Assert
      expect(sessions.length).toBe(2);
    });
  });

  describe('findByStation', () => {
    test('should return all sessions for a station', async () => {
      // Arrange
      const stationId = new mongoose.Types.ObjectId();
      await repository.create({ userId: new mongoose.Types.ObjectId(), stationId });
      await repository.create({ userId: new mongoose.Types.ObjectId(), stationId });

      // Act
      const sessions = await repository.findByStation(stationId.toString());

      // Assert
      expect(sessions.length).toBe(2);
    });
  });
});
