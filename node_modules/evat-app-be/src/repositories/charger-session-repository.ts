// Db operations (CRUD) with Mongoose

// Import interface for charging session model
import ChargerSession, {
  IChargerSession,
  IChargerSessionDocument,
} from '../models/charger-session-model';
import { Types } from 'mongoose';


export default class ChargerSessionRepository {
  // Create a new charging session
  async create(sessionData: Partial<IChargerSession>): Promise<IChargerSessionDocument> {
    const session = new ChargerSession(sessionData);
    return await session.save();
  }

  // Find a session by ID
  async findById(sessionId: string): Promise<IChargerSessionDocument | null> {
    return await ChargerSession.findById(sessionId)
      // Fill in User and Station info
      .populate('userId')
      .populate('stationId');
  }

  // End a session by setting endTime and status
  async endSession(sessionId: string, endTime: Date): Promise<IChargerSessionDocument | null> {
    return await ChargerSession.findByIdAndUpdate(
      sessionId,
      {
        endTime,
        status: 'completed',
      },
      { new: true }
    );
  }

  // Get all sessions for a specific user
  async findByUser(userId: string): Promise<IChargerSessionDocument[]> {
    return await ChargerSession.find({ userId: new Types.ObjectId(userId) }).sort({ startTime: -1 });
  }

  // Get all sessions for a specific station
  async findByStation(stationId: string): Promise<IChargerSessionDocument[]> {
    return await ChargerSession.find({ stationId: new Types.ObjectId(stationId) }).sort({ startTime: -1 });
  }

  // Expose MongoDB Change Stream (return what MongoDB give out)
  watch(pipeline: any[] = []) {
    return ChargerSession.watch(pipeline, { fullDocument: 'updateLockup' });
  }

  // Find the historical logs for DS pipelines and admin queries
  async findLogs(filter: any = {}, limit = 100, skip = 0) {
    return ChargerSession.find(filter)
    .sort({createdAt: -1})
    .skip(skip)
    .limit(limit);
  }
}
