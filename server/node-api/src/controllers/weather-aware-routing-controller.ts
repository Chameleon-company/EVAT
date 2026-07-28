import { Request, Response } from "express";
import WeatherAwareRoutingService from "../services/weather-aware-routing-service";

export default class WeatherAwareRoutingController {
  static async predict(req: Request, res: Response) {
    try {
      const { origin, destination, ac_on } = req.body;

      // validation
      if (!origin || !destination) {
        return res.status(400).json({
          message: "origin and destination are required",
        });
      }

      if (typeof origin !== "string" || origin.trim() === "") {
        return res.status(400).json({
          message: "origin must be a non-empty string",
        });
      }

      if (typeof destination !== "string" || destination.trim() === "") {
        return res.status(400).json({
          message: "destination must be a non-empty string",
        });
      }

      if (ac_on !== undefined && typeof ac_on !== "boolean") {
        return res.status(400).json({
          message: "ac_on must be a boolean value",
        });
      }

      const result = await WeatherAwareRoutingService.getPrediction({
        origin: origin.trim(),
        destination: destination.trim(),
        ac_on: ac_on ?? true,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Internal server error",
      });
    }
  }
}