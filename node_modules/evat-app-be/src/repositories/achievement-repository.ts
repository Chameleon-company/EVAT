import Achievement, { IAchievement } from "../models/achievement-model";
import UserAchievement, { IUserAchievement } from "../models/user-achievement-model";

export class AchievementRepository {

  /** Get all active achievements */
    async getAllActiveAchievements(): Promise<IAchievement[]> {
        return Achievement.find({ isActive: true });
    }

  /** Get achievements that watch a specific stat */
    async getAchievementsByStat(statName: string): Promise<IAchievement[]> {
        return Achievement.find({
            "milestone.statName": statName,
            isActive: true
        });
    }

  /** Check if user already has this achievement */
    async hasAchievement(userId: string, achievementId: string): Promise<boolean> {
        const count = await UserAchievement.countDocuments({ userId, achievementId });
        return count > 0;
    }

  /** Award an achievement to a user */
    async awardAchievement(
        userId: string,
        achievement: IAchievement
    ): Promise<IUserAchievement> {
        return UserAchievement.create({
            userId,
            achievementId: achievement._id,
            pointsAwarded: achievement.points || 10,
        });
    }

  /** Get all unlocked achievements for a user */
    async getUserUnlockedAchievements(userId: string): Promise<IUserAchievement[]> {
        return UserAchievement.find({ userId }).sort({ unlockedAt: -1 });
    }
}

export default new AchievementRepository();