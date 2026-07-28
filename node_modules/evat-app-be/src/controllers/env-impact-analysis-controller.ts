import { Request, Response } from "express";
import mongoose from "mongoose";
import EnvImpactAnalysisService from "../services/env-impact-analysis-service";

export default class EnvImpactAnalysisController {
  constructor(
    private readonly envImpactAnalysisService: EnvImpactAnalysisService
  ) {}

  async compare(req: Request, res: Response): Promise<Response> {
    try {
      const { evVehicleId, iceVehicleId } = req.body;

      if (!evVehicleId || typeof evVehicleId !== "string") {
        return res.status(400).json({
          message: "evVehicleId is required and must be a string",
        });
      }

      if (!iceVehicleId || typeof iceVehicleId !== "string") {
        return res.status(400).json({
          message: "iceVehicleId is required and must be a string",
        });
      }

      const evId = evVehicleId.trim();
      const iceId = iceVehicleId.trim();

      if (
        !mongoose.Types.ObjectId.isValid(evId) ||
        !mongoose.Types.ObjectId.isValid(iceId)
      ) {
        return res.status(400).json({
          message: "Invalid evVehicleId or iceVehicleId",
        });
      }

      const result = await this.envImpactAnalysisService.getComparison(
        evId,
        iceId
      );

      return res.status(200).json({
        message: "Environmental impact comparison retrieved successfully",
        data: result,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";

      if (
        message.includes("not found") ||
        message.includes("is not an electric") ||
        message.includes("Please select an ICE")
      ) {
        return res.status(404).json({ message });
      }

      return res.status(500).json({ message });
    }
  }
}

