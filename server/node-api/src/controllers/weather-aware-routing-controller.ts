import { Request, Response } from "express";
import WeatherAwareRoutingService from "../services/weather-aware-routing-service";

export default class WeatherAwareRoutingController {
  static async predict(req: Request, res: Response) {
    try {
      const { year, start_lat, start_lon } = req.body;

      // validation
      if (
        year === undefined ||
        start_lat === undefined ||
        start_lon === undefined
      ) {
        return res.status(400).json({
          message: "year, start_lat and start_lon are required",
        });
      }

      const result = await WeatherAwareRoutingService.getPrediction({
        year,
        start_lat,
        start_lon,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Internal server error",
      });
    }
  }
}