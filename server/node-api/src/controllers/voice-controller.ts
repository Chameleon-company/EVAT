import { Request, Response } from "express";
import VoiceService, { VoiceQueryContext } from "../services/voice-service";

export default class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  async query(req: Request, res: Response): Promise<Response> {
    try {
      const query = req.body?.query;

      if (typeof query !== "string" || query.trim().length < 1) {
        return res.status(400).json({
          message: "query is required and must be a non-empty string",
        });
      }

      const mapCenter =
        typeof req.body?.map_center?.lat === "number" &&
        typeof req.body?.map_center?.lng === "number"
          ? { lat: req.body.map_center.lat, lng: req.body.map_center.lng }
          : undefined;
      const userLocation =
        typeof req.body?.user_location?.lat === "number" &&
        typeof req.body?.user_location?.lng === "number"
          ? { lat: req.body.user_location.lat, lng: req.body.user_location.lng }
          : undefined;

      const context: VoiceQueryContext | undefined =
        mapCenter || userLocation
          ? { map_center: mapCenter, user_location: userLocation }
          : undefined;

      const result = await this.voiceService.processQuery(query, context);
      return res.status(200).json(result);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return res.status(500).json({ message });
    }
  }
}
