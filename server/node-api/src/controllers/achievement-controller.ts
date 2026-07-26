import { Request, Response } from "express";
import { AchievementService } from "../services/achievement-service";

export default class AchievementController {
    constructor(
        private readonly achievementService: AchievementService
    ) {}

    /**
     * GET /api/achievements/me
     * Get all unlocked achievements for the authenticated user
     */
    async getMyAchievements(req: Request, res: Response): Promise<Response> {
        try {
            const userId = (req.user as any)?.id || (req.user as any)?._id;

            if (!userId) {
                return res.status(401).json({ message: "Unauthorized - No user ID found" });
            }

            const unlockedAchievements = await this.achievementService.getUserAchievements(userId);

            return res.status(200).json({
                message: "success",
                count: unlockedAchievements.length,
                data: unlockedAchievements,
            });
        } catch (error: any) {
            console.error("getMyAchievements error:", error);
            return res.status(500).json({ message: error.message || "Internal server error" });
        }
    }

    /**
     * GET /api/achievements/all
     * Get all available achievements in the system (for frontend display of locked ones)
     * Useful for showing progress / full achievement list
     */
    async getAllAchievements(req: Request, res: Response): Promise<Response> {
        try {
            const allAchievements = await this.achievementService.getAllAchievements();
            return res.status(200).json({
                message: "success",
                count: allAchievements.length,
                data: allAchievements,
            });
        } catch (error: any) {
            console.error("getAllAchievements error:", error);
            return res.status(500).json({ message: error.message || "Internal server error" });
        }
    }

    /**
   * GET /api/achievements
   * Get ALL achievements with user's unlock status (Recommended main endpoint)
   */
    async getAchievementsWithProgress(req: Request, res: Response): Promise<Response> {
        try {
        const userId = (req.user as any)?.id || (req.user as any)?._id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const achievementsWithProgress = await this.achievementService.getAllAchievementsWithProgress(userId);

        return res.status(200).json({
            message: "success",
            count: achievementsWithProgress.length,
            data: achievementsWithProgress,
        });
        } catch (error: any) {
            console.error("getAchievementsWithProgress error:", error);
            return res.status(500).json({ message: error.message || "Internal server error" });
        }
    }

    /**
     * GET /api/achievements/me-recent
     * Get the N most recently unlocked achievements
     */
    async getRecentAchievements(req: Request, res: Response): Promise<Response> {
        try {
            const userId = (req.user as any)?.id || (req.user as any)?._id;

            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            // Support ?limit=10 query parameter
            const limit = parseInt(req.query.limit as string) || 6;
            // Clamp between 1 and 20
            const clampedLimit = Math.min(Math.max(limit, 1), 20); 

            const recentAchievements = await this.achievementService.getRecentUnlockedAchievements(userId, clampedLimit);

            return res.status(200).json({
                message: "success",
                count: recentAchievements.length,
                data: recentAchievements,
            });
        } catch (error: any) {
            console.error("getRecentAchievements error:", error);
            return res.status(500).json({ message: error.message || "Internal server error" });
        }
    }
}