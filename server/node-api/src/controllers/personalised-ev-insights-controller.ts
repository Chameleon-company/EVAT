import { Request, Response } from "express";
import UserService from "../services/user-service";
import PersonalisedEVInsightsService from "../services/personalised-ev-insights-service";

export default class PersonalisedEVInsightsController {
  constructor(
    private readonly userService: UserService,
    private readonly personalisedEVInsightsService: PersonalisedEVInsightsService
  ) {}

  async submitInsights(req: Request, res: Response): Promise<Response> {
    const { user } = req as any;

    try {
      const existingUser = await this.userService.getUserById(user?.id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const result = await this.personalisedEVInsightsService.submitInsights(
        user?.id || "",
        existingUser.email || "",
        req.body
      );

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async getMyInsights(req: Request, res: Response): Promise<Response> {
    const { user } = req as any;

    try {
      const existingUser = await this.userService.getUserById(user?.id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingInsight =
        await this.personalisedEVInsightsService.getLatestInsightByUserId(
          user?.id || ""
        );

      if (!existingInsight) {
        return res.status(404).json({
          message: "No personalised EV insights found for this user",
        });
      }

      return res.status(200).json({
        message: "success",
        data: existingInsight,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}