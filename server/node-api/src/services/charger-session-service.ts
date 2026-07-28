// Between controller and repository (bussiness layer to validate data before going to repository)
import { Types } from 'mongoose';
import ChargerSessionRepository from '../repositories/charger-session-repository';
import { IChargerSession, IChargerSessionEvent, SessionOperationType } from '../models/charger-session-model';
//
import { ChangeStreamDocument, ChangeStreamInsertDocument, ChangeStreamDeleteDocument } from 'mongodb';

// Object
type CreateSessionInput = {
  userId: string;
  stationId: string;
  startTime?: Date;
  status?: 'in_progress' | 'completed' | 'error';
}

export default class ChargerSessionService {
  // Constructor
  constructor(private readonly sessionRepo: ChargerSessionRepository) {}

  // Create a new session
  async createSession(sessionData: CreateSessionInput) {
    // Simple exist check
    if (!sessionData.userId || !sessionData.stationId) {
      throw new Error('User ID or Station ID are required to start a session.');
    }

    // Convert string IDs to ObjectId
    const userObjectId = new Types.ObjectId(sessionData.userId);
    const stationObjectId = new Types.ObjectId(sessionData.stationId);

    // Set status and default start time object
    const toCreate: Partial<IChargerSession> = {
      userId: userObjectId,
      stationId: stationObjectId,
      status: sessionData.status || 'in_progress',
      startTime: sessionData.startTime || new Date(),
    };

    return await this.sessionRepo.create(toCreate);
  }

  // End a session by ID
  async endSession(sessionId: string) {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found.`);
    }

    if (session.endTime) {
      throw new Error('Session is already ended.');
    }

    const now = new Date();
    const updatedSession = await this.sessionRepo.endSession(sessionId, now);
    // Safeguard temp code for null
    if (!updatedSession) {
      throw new Error('Failed to update session.');
    }
    return updatedSession;
  }

  // Get a single session by ID
  async getSessionById(sessionId: string) {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found.`);
    }
    return session;
  }

  // Get sessions for a user
  async getSessionsByUser(userId: string) {
    return await this.sessionRepo.findByUser(userId);
  }

  // Get sessions for a station
  async getSessionsByStation(stationId: string) {
    return await this.sessionRepo.findByStation(stationId);
  }

  // Stream sessions using MongoDB Change Stream
  streamSessions(callback: (event: IChargerSessionEvent) => void) {
    const changeStream = this.sessionRepo.watch();

    changeStream.on('change', (change: ChangeStreamDocument<IChargerSession>) => {
      const operationType = change.operationType as SessionOperationType;

      // Event object depending on the operations (insert/update vs delete)
      if ('fullDocument' in change && change.fullDocument) {
        const fullDoc = change.fullDocument!;
        callback({
          sessionId: change.documentKey._id.toString(),
          userId: fullDoc.userId?.toString(),
          stationId: fullDoc.stationId?.toString(),
          status: fullDoc.status,
          timestamp: new Date(),
          operationType,
          energyDelivered: fullDoc.energyDelivered,
          cost: fullDoc.cost,
        });
      } else if (operationType === 'delete') {
        const deleteChange = change as ChangeStreamDeleteDocument<IChargerSession>;
        callback({
          sessionId: deleteChange.documentKey._id.toString(),
          userId: '',
          stationId: '',
          status: 'deleted',
          timestamp: new Date(),
          operationType,
        });
      }
    });
  }

  // Grab the historical logs
  async getLogs(filter: any = {}, limit = 100, skip = 0) {
    return this.sessionRepo.findLogs(filter, limit, skip);
  }
}
