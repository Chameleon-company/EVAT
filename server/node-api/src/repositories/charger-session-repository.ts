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

  // Get occupancy statistics by hour for a station (for insights & predictions)
  async getStationOccupancyByHour(
    stationId: string,
    dateRangeInDays: number = 30
  ): Promise<{
    occupancyByHour: { [hour: number]: number };
    totalSessions: number;
    dateRange: { start: Date; end: Date };
  }> {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - dateRangeInDays);

      // Query sessions for this station within the date range
      const sessions = await ChargerSession.find({
        stationId: new Types.ObjectId(stationId),
        startTime: { $gte: startDate, $lte: endDate },
        status: { $in: ['completed', 'in_progress'] },
      })
        .select('startTime')
        .lean();

      // Group sessions by hour-of-day and count
      const occupancyByHour: { [hour: number]: number[] } = {};
      for (let i = 0; i < 24; i++) {
        occupancyByHour[i] = [];
      }

      sessions.forEach((session) => {
        const hour = new Date(session.startTime).getHours();
        if (!occupancyByHour[hour]) {
          occupancyByHour[hour] = [];
        }
        occupancyByHour[hour].push(1);
      });

      // Calculate average sessions per hour
      const occupancyStats: { [hour: number]: number } = {};
      for (let i = 0; i < 24; i++) {
        const count = occupancyByHour[i].length;
        occupancyStats[i] = count > 0
          ? Math.round((count / dateRangeInDays) * 100) / 100 // average sessions per that hour per day
          : 0;
      }

      return {
        occupancyByHour: occupancyStats,
        totalSessions: sessions.length,
        dateRange: { start: startDate, end: endDate },
      };
    } catch (error: any) {
      console.error(`Error getting occupancy for station ${stationId}:`, error);
      throw error;
    }
  }
}
