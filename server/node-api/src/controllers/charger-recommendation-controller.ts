import { Request, Response } from "express";
import ChargerRecommendationService from "../services/charger-recommendation-service";

export default class ChargerRecommendationController {
  constructor(
    private readonly chargerRecommendationService: ChargerRecommendationService
  ) {}

  async getRecommendations(req: Request, res: Response): Promise<Response> {
    const { userId, latitude, longitude, radiusKm } = req.body;

    if (userId === undefined || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: "userId, latitude, and longitude are required.",
      });
    }

    try {
      const recommendations = await this.chargerRecommendationService.getRecommendations({
        userId,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusKm: radiusKm !== undefined ? Number(radiusKm) : undefined,
      });

      return res.status(200).json({
        message: "success",
        data: recommendations,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async saveSelection(req: Request, res: Response): Promise<Response> {
    const { sessionId } = req.params;
    const { stationId } = req.body;

    if (!stationId) {
      return res.status(400).json({ message: "stationId is required." });
    }

    try {
      await this.chargerRecommendationService.saveSelection(sessionId, stationId);

      return res.status(200).json({
        message: "Station selection saved successfully",
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}