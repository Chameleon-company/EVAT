import achievementRepository from "../repositories/achievement-repository";
import userStatsService from "./user-stats-service";
import { IAchievement } from "../models/achievement-model";

export class AchievementService {

    /**
     * Evaluate achievements and return only the newly unlocked ones
     */
    async checkForNewAchievements(
        userId: string,
        changedStatNames: string[]
    ): Promise<any[]> {
        const newlyUnlocked = await this.evaluateAndAwardAchievements(userId, changedStatNames);
        
        if (newlyUnlocked.length === 0) return [];

        // Return rich data for frontend
        return newlyUnlocked.map(ach => ({
            id: ach._id.toString(),
            name: ach.name,
            description: ach.description,
            icon: ach.icon,
            rarity: ach.rarity,
            points: ach.points,
            unlockedAt: new Date(),
        }));
    }

    /**
     * Main evaluation function
     * Call this after any stat update
    */
    async evaluateAndAwardAchievements(
        userId: string,
        changedStatNames: string[]   // e.g. ["setProfilePic", "totalChargingSessions"]
    ): Promise<IAchievement[]> {
        const newlyUnlocked: IAchievement[] = [];

        // For MVP: Fetch all active achievements
        const allAchievements = await achievementRepository.getAllActiveAchievements();
        
        const currentStats = await userStatsService.getStats(userId);
        if (!currentStats) return [];

        for (const achievement of allAchievements) {
            const { milestone } = achievement;
            const statName = milestone.statName;

            // Only evaluate achievements related to the stats that just changed
            if (!changedStatNames.includes(statName)) {
                continue;
            }

            // Skip if user already has this achievement
            const alreadyHas = await achievementRepository.hasAchievement(
                userId, 
                achievement._id.toString()
            );
            if (alreadyHas) continue;

            // Evaluate milestone
            let isUnlocked = false;

            if (milestone.statType === "flag") {
                const flagValue = (currentStats.flags as any)[statName];
                isUnlocked = flagValue === milestone.targetValue;
            } 
            else if (milestone.statType === "counter") {
                const counterValue = (currentStats.counters as any)[statName];
                
                if (milestone.operator === ">=") {
                isUnlocked = counterValue >= Number(milestone.targetValue);
                }
            }

            if (isUnlocked) {
                await achievementRepository.awardAchievement(userId, achievement);
                newlyUnlocked.push(achievement);
            }
        }

        return newlyUnlocked;
    }

    /** Get all unlocked achievements for a user (for frontend) */
    async getUserAchievements(userId: string) {
        return achievementRepository.getUserUnlockedAchievements(userId);
    }

    /**
     * Get ALL active achievements (for frontend to show locked + unlocked)
     */
    async getAllAchievements() {
        const allAchievements = await achievementRepository.getAllActiveAchievements();

        return allAchievements.map(achievement => ({
            ...achievement.toObject(),
            _id: achievement._id.toString(),   // ensure string ID for frontend
        }));
    }

    /**
     * Get ALL achievements with unlock status for a specific user
     * Best endpoint for frontend achievement gallery
     */
    async getAllAchievementsWithProgress(userId: string) {
        const allAchievements = await achievementRepository.getAllActiveAchievements();
        const unlockedList = await achievementRepository.getUserUnlockedAchievements(userId);

        // Use a Map for fast lookup of both ID and unlockedAt
        const unlockedMap = new Map(unlockedList.map(item => [item.achievementId, item.unlockedAt]));

        return allAchievements.map(achievement => {
            const achievementId = achievement._id.toString();
            const unlockedAt = unlockedMap.get(achievementId);

            return {
                ...achievement.toObject(),
                _id: achievementId,
                unlocked: unlockedAt !== undefined,     // clearer than Set + has()
                unlockedAt: unlockedAt || null,
            };
        });
    }

    /**
     * Get the N (default 6) most recently unlocked achievements for a user
     */
    async getRecentUnlockedAchievements(userId: string, limit: number = 6) {
        const recent = await achievementRepository.getUserUnlockedAchievements(userId);
        
        // Sort by unlockedAt (newest first) and limit
        return recent
        .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
        .slice(0, limit);
    }
}

export default new AchievementService();