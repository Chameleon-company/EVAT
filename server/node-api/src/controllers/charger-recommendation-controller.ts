import { Response } from "express";
import { AuthRequest } from "../middlewares/auth-middleware";
import ChargerRecommendationService from "../services/charger-recommendation-service";

export default class ChargerRecommendationController {
  constructor(
    private readonly chargerRecommendationService: ChargerRecommendationService
  ) {}

  async getRecommendations(req: AuthRequest, res: Response): Promise<Response> {
    const { latitude, longitude, radiusKm } = req.body;
    const userId = req.user.id;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: "latitude and longitude are required.",
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

  async saveSelection(req: AuthRequest, res: Response): Promise<Response> {
    const { sessionId } = req.params;
    const { stationId } = req.body;
    const userId = req.user.id;

    if (!stationId) {
      return res.status(400).json({ message: "stationId is required." });
    }

    try {
      await this.chargerRecommendationService.saveSelection(sessionId, stationId, userId);

      return res.status(200).json({
        message: "Station selection saved successfully",
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}