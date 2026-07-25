import { Request, Response } from "express";
import { UserStatsService } from "../services/user-stats-service"; 

export default class UserStatsController {
  constructor(
    private readonly userStatsService: UserStatsService
  ) {}

  /**
   * GET /api/user-stats/me
   * Get the authenticated user's stats
   * 
   * @param req Request object containing the authenticated user
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful 
   */
  async getMyStats(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req.user as any)?.id || (req.user as any)?._id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized - No user ID found" });
      }

      const stats = await this.userStatsService.getStats(userId);

      if (!stats) {
        return res.status(404).json({ message: "User stats not found" });
      }

      return res.status(200).json({
        message: "success",
        data: stats,
      });
    } catch (error: any) {
      console.error("getMyStats error:", error);
      return res.status(500).json({ message: error.message || "Internal server error" });
    }
  }

  /**
   * POST /api/user-stats/initialize
   * Initialize stats for a user
   * Called during registration
   * 
   * @param req Request object containing the authenticated user
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful 
   */
  async initializeStats(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req.user as any)?.id || (req.user as any)?._id || req.body.userId;

      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const stats = await this.userStatsService.initializeStats(userId);

      return res.status(201).json({
        message: "User stats initialized successfully",
        data: stats,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Internal server error" });
    }
  }

// ===============================================================================================
//                          DEVELOPER ONLY (for testing)
// ===============================================================================================

  /**
   * POST /api/user-stats/reset (Development / Testing only)
   * Reset all stats for the current user
   * 
   * @param req Request object containing the authenticated user
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful 
   */
  async resetAllStats(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req.user as any)?.id || (req.user as any)?._id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const stats = await this.userStatsService.resetAllStats(userId);

      return res.status(200).json({
        message: "All stats have been reset successfully",
        data: stats,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Internal server error" });
    }
  }
  
  /**
   * POST /api/user-stats/reset-counters (Development / Testing only)
   * Reset all counters for the current user
   * 
   * @param req Request object containing the authenticated user
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful 
   */
  async resetCounters(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req.user as any)?.id || (req.user as any)?._id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const stats = await this.userStatsService.resetCounters(userId);

      return res.status(200).json({
        message: "All counters have been reset successfully",
        data: stats,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Internal server error" });
    }
  }
  
  /**
   * POST /api/user-stats/reset-flags (Development / Testing only)
   * Reset all flags for the current user
   * 
   * @param req Request object containing the authenticated user
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful 
   */
  async resetFlags(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req.user as any)?.id || (req.user as any)?._id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const stats = await this.userStatsService.resetFlags(userId);

      return res.status(200).json({
        message: "All flags have been reset successfully",
        data: stats,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Internal server error" });
    }
  }

  /**
   * POST /api/user-stats/test/increment (Development / Testing only)
   * Developer tool: Increment a counter
   * 
   * @param req Request object containing the authenticated user
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful 
   */
  async testIncrementCounter(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, counterName, value = 1 } = req.body;

      if (!userId || !counterName) {
        return res.status(400).json({ message: "userId and counterName are required" });
      }

      const updates = { [counterName]: Number(value) };

      const stats = await this.userStatsService.incrementCounters(userId, updates);

      return res.status(200).json({
        message: `Successfully added ${value} to ${counterName}`,
        data: stats
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Internal server error" });
    }
  }

  /**
   * POST /api/user-stats/test/set-flag (Development / Testing only)
   * Developer tool: Set a flag to true
   * 
   * @param req Request object containing the authenticated user
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful 
   */
  async testSetFlag(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, flagName } = req.body;

      if (!userId || !flagName) {
        return res.status(400).json({ message: "userId and flagName are required" });
      }

      const stats = await this.userStatsService.setFlags(userId, { [flagName]: true });

      return res.status(200).json({
        message: `Successfully set ${flagName} to true`,
        data: stats
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Internal server error" });
    }
  }
}