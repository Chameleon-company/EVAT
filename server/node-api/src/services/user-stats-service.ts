import userStatsRepository from "../repositories/user-stats-repository";
import achievementService from "../services/achievement-service";
import { IUserStats, ICounters, IFlags } from "../models/user-stats-model";

// This service handles all the achievement system items
// It is the place to put calculations and derived values (like "1 year since joining")
// Extend as needed
// It is currently split into categories to manage service types

export class UserStatsService {
  /**
   * Get current stats for a user
   * 
   * @param userId String: a specific users ID
   * @returns UserStats: Returns the specified users stats
   */
  async getStats(userId: string): Promise<IUserStats | null> {
    return userStatsRepository.findByUserId(userId);
  }

  /**
   * Ensure user stats document exists
   * Call this on user registration or first activity
   * 
   * @param userId String: a specific users ID
   * @returns UserStats: Returns the specified users stats
   */
  async initializeStats(userId: string): Promise<IUserStats> {
    return userStatsRepository.upsertUserStats(userId);
  }

  // ====================== CHARGING RELATED ======================

  /**
   * Record a completed charging session
   * ====== This is to mimick a charging session                            ======
   * ====== Needs proper implementation when sessions are added             ======
   * 
   * @param userId String: a specific users ID
   * @param data Dictionary: the data that is being changed during a charge
   * @returns UserStats: Returns the specified users stats
   */
  async recordChargingSession(
    userId: string,
    data: {
      chargeTimeSeconds: number;    // required
      whCharged: number;            // required
      metresTravelled?: number;
      chargingCostCents?: number;
    }
  ): Promise<{
    stats: IUserStats | null; 
    newAchievements: any[]
  }> {

    // create update data
    const updates: any = {
      totalChargeTimeSeconds: data.chargeTimeSeconds,
      totalWhCharged: data.whCharged,
      totalChargingSessions: 1,
    };
    // if distance travelled is provided
    if (data.metresTravelled) {
      updates.totalMetresTravelled = data.metresTravelled;
    }
    // if charging cost is provided
    if (data.chargingCostCents) {
      updates.totalChargingCostsCents = data.chargingCostCents;
    }

    // IMPORTANT
    // You can add derived calculations here (CO2, petrol savings, etc.)
    // Example:
    // updates.totalCO2KgAvoided = Math.round(data.whCharged * 0.0005); // rough factor
    // updates.totalPetrolSavingsCents = Math.round(data.whCharged * 0.015);

    // Update stats
    const updatedStats = await userStatsRepository.incrementCounters(userId, updates);

    // Check for new achievements
    let newAchievements: any[] = [];
    if (updatedStats) {
      newAchievements = await achievementService.evaluateAndAwardAchievements(userId, [
        "totalChargeTimeSeconds",
        "totalWhCharged",
        "totalChargingSessions",
        "totalMetresTravelled",
        "totalChargingCostsCents"
      ]);
    }

    return { stats: updatedStats, newAchievements };
  }

  // ====================== LOGIN & STREAKS ======================

  /**
   * Record a user login + handle login streaks
   * 
   * @param userId String: a specific users ID
   * @returns UserStats: Returns the specified users stats
   */
  async recordLogin(
    userId: string
  ): Promise<{
    stats: IUserStats | null; 
    newAchievements: any[]
  }> {
    const updatedStats = await userStatsRepository.incrementCounters(userId, {
      totalLoginDays: 1,
      consecutiveLoginDays: 1,
    });

    // Check for new achievements
    let newAchievements: any[] = [];
    if (updatedStats) {
      newAchievements = await achievementService.evaluateAndAwardAchievements(userId, [
        "totalLoginDays",
        "consecutiveLoginDays"
      ]);
    }

    return { stats: updatedStats, newAchievements };
  }

  // ====================== PROFILE & ONBOARDING ======================

  /**
   * Sets one time flags to true to specific stats
   * 
   * @param userId String: a specific users ID
   * @returns UserStats: Returns the specified users stats
   */
  async markProfilePicSet(
    userId: string
  ): Promise<{
    stats: IUserStats | null; 
    newAchievements: any[]
  }> {
    // Get current stats to check the existing value
    const currentStats = await userStatsRepository.findByUserId(userId);
    // Early return if already set to true
    if (currentStats?.flags?.setProfilePic === true) {
      return { stats: currentStats, newAchievements: [] };
    }
    // Update the flag because it is currently false
    const updatedStats = await userStatsRepository.setFlags(userId, { setProfilePic: true });
    // Evaluate and Award the Achievement
    let newAchievements: any[] = [];
    if (updatedStats) {
      newAchievements = await achievementService.evaluateAndAwardAchievements(userId, ["setProfilePic"]);
    }
    return { stats: updatedStats, newAchievements };
  }

  async markProfileVehicleSet(
    userId: string
  ): Promise<{
    stats: IUserStats | null; 
    newAchievements: any[]
  }> {
    // Get current stats to check the existing value
    const currentStats = await userStatsRepository.findByUserId(userId);
    // Early return if already set to true
    if (currentStats?.flags?.setProfileVehicle === true) {
      return { stats: currentStats, newAchievements: [] };
    }
    // Update the flag because it is currently false
    const updatedStats = await userStatsRepository.setFlags(userId, { setProfileVehicle: true });
    // Evaluate and Award the Achievement
    let newAchievements: any[] = [];
    if (updatedStats) {
      newAchievements = await achievementService.evaluateAndAwardAchievements(userId, ["setProfileVehicle"]);
    }
    return { stats: updatedStats, newAchievements };
  }

  async markFavouriteChargeSaved(
    userId: string
  ): Promise<{
    stats: IUserStats | null; 
    newAchievements: any[]
  }> {
    // Get current stats to check the existing value
    const currentStats = await userStatsRepository.findByUserId(userId);
    // Early return if already set to true
    if (currentStats?.flags?.saveFavouriteCharger === true) {
      return { stats: currentStats, newAchievements: [] };
    }
    // Update the flag because it is currently false
    const updatedStats = await userStatsRepository.setFlags(userId, { saveFavouriteCharger: true });
    // Evaluate and Award the Achievement
    let newAchievements: any[] = [];
    if (updatedStats) {
      newAchievements = await achievementService.evaluateAndAwardAchievements(userId, ["saveFavouriteCharger"]);
    }

    return { stats: updatedStats, newAchievements };
  }

  // ====================== REVIEWS & SOCIAL ======================

  /**
   * Adds increment values to specific stats
   * 
   * @param userId String: a specific users ID
   * @returns UserStats: Returns the specified users stats
   */
  async recordReviewWritten(
    userId: string
  ): Promise<{
    stats: IUserStats | null; 
    newAchievements: any[]
  }> {
    const updatedStats = await userStatsRepository.incrementCounters(userId, {
      totalReviewsWritten: 1,
    });

    // Check for new achievements
    let newAchievements: any[] = [];
    if (updatedStats) {
      newAchievements = await achievementService.evaluateAndAwardAchievements(userId, ["totalReviewsWritten"]);
    }

    return { stats: updatedStats, newAchievements };
  }

  async recordRatingGiven(
    userId: string
  ): Promise<{
    stats: IUserStats | null; 
    newAchievements: any[]
  }> {
    const updatedStats = await userStatsRepository.incrementCounters(userId, {
      totalRatingsGiven: 1,
    });

    // Check for new achievements
    let newAchievements: any[] = [];
    if (updatedStats) {
      newAchievements = await achievementService.evaluateAndAwardAchievements(userId, ["totalRatingsGiven"]);
    }

    return { stats: updatedStats, newAchievements };
  }

  // TESTING HELPERS - direct access to user stats and resets stats
  async incrementCounters(userId: string, updates: Partial<ICounters>) {
    const updatedStats = await userStatsRepository.incrementCounters(userId, updates);
    
    if (updatedStats) {
      await achievementService.evaluateAndAwardAchievements(userId, Object.keys(updates));
    }
    
    return updatedStats;
  }

  async setFlags(userId: string, updates: Partial<IFlags>) {
    const updatedStats = await userStatsRepository.setFlags(userId, updates);
    
    if (updatedStats) {
      await achievementService.evaluateAndAwardAchievements(userId, Object.keys(updates));
    }
    
    return updatedStats;
  }

  async resetAllStats(userId: string): Promise<IUserStats | null> {
    return userStatsRepository.resetAll(userId);
  }

  async resetCounters(userId: string) {
    return userStatsRepository.resetCounters(userId);
  }

  async resetFlags(userId: string) {
    return userStatsRepository.resetFlags(userId);
  }
}

export default new UserStatsService();