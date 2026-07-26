import UserStats, { IUserStats, ICounters, IFlags } from "../models/user-stats-model";
import { Types } from "mongoose";

export class UserStatsRepository {

  /**
   * Get full user stats document
   * 
   * @param userId String: a specific users ID
   * @returns UserStats: Returns the specified users stats
   */
  async findByUserId(userId: string): Promise<IUserStats | null> {
    return UserStats.findOne({ userId });
  }

  /**
   * Create stats document if it doesn't exist, or return existing one
   * 
   * @param userId String: a specific users ID
   * @returns UserStats: Returns the specified users stats
   */
  async upsertUserStats(userId: string): Promise<IUserStats> {
    const result = await UserStats.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          counters: {},
          flags: {},
          lastUpdated: new Date(),
        },
      },
      {
        upsert: true,
        new: true,           // Return the updated document
        runValidators: true,
      }
    );

    return result!;
  }

  /**
   * Increment one or more counters atomically
   * ICounters hold the key and value, the value does not need to be 1
   * 
   * @param userId String: a specific users ID
   * @param updatedCounters ICounters: a partial counter to update
   * @returns UserStats: Returns the updated users stats
   */
  async incrementCounters(
    userId: string,
    updatedCounters: Partial<ICounters>
  ): Promise<IUserStats | null> {
    if (Object.keys(updatedCounters).length === 0) return null;

    const updatePayload: any = {
      $inc: {},
      $set: { lastUpdated: new Date() },
    };

    // $inc object (e.g. { "counters.totalWhCharged": 1200 })
    Object.entries(updatedCounters).forEach(([key, value]) => {
      updatePayload.$inc[`counters.${key}`] = value;
    });

    return UserStats.findOneAndUpdate(
      { userId },
      updatePayload,
      { new: true, upsert: true } 
    );
  }

  /**
   * Set one or more flags atomically
   * 
   * @param userId String: a specific users ID
   * @param updatedFlags IFlags: a partial flag to update
   * @returns UserStats: Returns the updated users stats
   */
  async setFlags(
    userId: string,
    updatedFlags: Partial<IFlags>
  ): Promise<IUserStats | null> {
    if (Object.keys(updatedFlags).length === 0) return null;

    const updatePayload: any = {
      $set: { lastUpdated: new Date() },
    };

    // $set (e.g. { "flags.setProfilePic": true })
    Object.entries(updatedFlags).forEach(([key, value]) => {
      updatePayload.$set[`flags.${key}`] = value;
    });

    return UserStats.findOneAndUpdate(
      { userId },
      updatePayload,
      { new: true, upsert: true }
    );
  }

  /**
   * Set counters and flags at the same time
   * A more general function used for more complex cases
   * 
   * @param userId String: a specific users ID
   * @param updates Dictionary for the updated interfaces
   * @param counters ICounters: a partial counter to update
   * @param flags IFlags: a partial flag to update
   * @returns UserStats: Returns the updated users stats
   */
  async updateUserStats(
    userId: string,
    updates: {
      counters?: Partial<ICounters>;
      flags?: Partial<IFlags>;
    }
  ): Promise<IUserStats | null> {
    const updatePayload: any = {
      $set: { lastUpdated: new Date() },
    };

    if (updates.counters) {
      updatePayload.$inc = {};
      Object.entries(updates.counters).forEach(([key, value]) => {
        updatePayload.$inc[`counters.${key}`] = value;
      });
    }

    if (updates.flags) {
      Object.entries(updates.flags).forEach(([key, value]) => {
        updatePayload.$set[`flags.${key}`] = value;
      });
    }

    return UserStats.findOneAndUpdate(
      { userId },
      updatePayload,
      { new: true, upsert: true }
    );
  }

  /**
   * Reset a single counter to 0
   * 
   * @param userId String: a specific users ID
   * @param counterName String: name of the counter to be reset
   * @returns UserStats: Returns the updated users stats
   */
  async resetCounters(userId: string) : Promise<IUserStats | null> {
    return UserStats.findOneAndUpdate(
      { userId },
      {
        $set: {
          counters: {
            totalChargeTimeSeconds: 0,
            totalWhCharged: 0,
            totalMetresTravelled: 0,
            totalCO2KgAvoided: 0,
            totalBookings: 0,
            totalChargersUsed: 0,
            totalChargingSessions: 0,
            totalPetrolSavingsCents: 0,
            totalChargingCostsCents: 0,
            totalReviewsWritten: 0,
            totalRatingsGiven: 0,
            totalFaultReports: 0,
            yearsJoined: 0,
            totalLoginDays: 0,
            consecutiveLoginDays: 0,
          },
          lastUpdated: new Date(),
        },
      },
      { new: true }
    );
  }

  /**
   * Reset a single flag to false
   * 
   * @param userId String: a specific users ID
   * @param flagName String: name of the flag to be reset
   * @param value Bool: the value the flag will be set to. Sets to false if nothing is provided.
   * @returns UserStats: Returns the updated users stats
   */
  async resetFlags(userId: string): Promise<IUserStats | null> {
    return UserStats.findOneAndUpdate(
      { userId },
      {
        $set: {
          flags: {
            setProfilePic: false,
            useSmartFilter: false,
            useChatBot: false,
            setProfileVehicle: false,
            saveFavouriteCharge: false,
            postReview: false,
            giveRating: false,
            useTeslaNetwork: false,
            useEvieNetwork: false,
            christmasDayCharge: false,
            earthDayCharge: false,
            winterSolsticeCharge: false,
            summerSolsticeCharge: false,
            autumalEquinoxCharge: false,
            springEquinoxCharge: false,
          },
          lastUpdated: new Date(),
        },
      },
      { new: true, upsert: true }
    );
  }

  /**
   * Reset ALL counters and flags back to defaults
   * 
   * @param userId String: a specific users ID
   * @returns UserStats: Returns the updated users stats
   */
  async resetAll(userId: string): Promise<IUserStats | null> {
    return UserStats.findOneAndUpdate(
      { userId },
      {
        $set: {
          counters: {
            totalChargeTimeSeconds: 0,
            totalWhCharged: 0,
            totalMetresTravelled: 0,
            totalCO2KgAvoided: 0,
            totalBookings: 0,
            totalChargersUsed: 0,
            totalChargingSessions: 0,
            totalPetrolSavingsCents: 0,
            totalChargingCostsCents: 0,
            totalReviewsWritten: 0,
            totalRatingsGiven: 0,
            totalFaultReports: 0,
            yearsJoined: 0,
            totalLoginDays: 0,
            consecutiveLoginDays: 0,
          },
          flags: {
            setProfilePic: false,
            useSmartFilter: false,
            useChatBot: false,
            setProfileVehicle: false,
            saveFavouriteCharge: false,
            postReview: false,
            giveRating: false,
            useTeslaNetwork: false,
            useEvieNetwork: false,
            christmasDayCharge: false,
            earthDayCharge: false,
            winterSolsticeCharge: false,
            summerSolsticeCharge: false,
            autumalEquinoxCharge: false,
            springEquinoxCharge: false,
          },
          lastUpdated: new Date(),
        },
      },
      { new: true, upsert: true }
    );
  }
}

export default new UserStatsRepository();