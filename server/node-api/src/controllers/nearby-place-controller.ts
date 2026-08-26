import { Request, Response } from "express";
import NearbyPlaceService from "../services/nearby-place-service";

export default class NearbyPlaceController {
  constructor(private readonly nearbyPlaceService: NearbyPlaceService) {}

  async getNearby(req: Request, res: Response): Promise<Response> {
    try {
      const latitude = Number(req.query.lat ?? req.query.latitude);
      const longitude = Number(req.query.lon ?? req.query.lng ?? req.query.longitude);
      const radiusKm = req.query.radiusKm != null ? Number(req.query.radiusKm) : undefined;
      const category = req.query.category as string | undefined;

      const places = await this.nearbyPlaceService.getNearbyPlaces(
        latitude,
        longitude,
        radiusKm,
        category
      );

      return res.status(200).json({
        message: "Nearby places retrieved successfully",
        data: { count: places.length, places },
      });
    } catch (error: any) {
      const status =
        error.message?.includes("required") ||
        error.message?.includes("must") ||
        error.message?.includes("Invalid")
          ? 400
          : 500;
      return res.status(status).json({ message: error.message });
    }
  }

  async getNearbyForStation(req: Request, res: Response): Promise<Response> {
    try {
      const { stationId } = req.params;
      const radiusKm = req.query.radiusKm != null ? Number(req.query.radiusKm) : undefined;
      const category = req.query.category as string | undefined;

      const places = await this.nearbyPlaceService.getNearbyForStation(
        stationId,
        radiusKm,
        category
      );

      return res.status(200).json({
        message: "Nearby places retrieved successfully",
        data: { count: places.length, places },
      });
    } catch (error: any) {
      if (error.message === "Charging station not found") {
        return res.status(404).json({ message: error.message });
      }
      const status =
        error.message?.includes("required") ||
        error.message?.includes("must") ||
        error.message?.includes("unavailable") ||
        error.message?.includes("Invalid")
          ? 400
          : 500;
      return res.status(status).json({ message: error.message });
    }
  }

  async getPhoto(req: Request, res: Response): Promise<Response | void> {
    try {
      const photoName = String(req.query.name || "");
      const photoUri = await this.nearbyPlaceService.getPhotoUri(photoName);
      res.set("Cache-Control", "public, max-age=86400");
      return res.redirect(302, photoUri);
    } catch (error: any) {
      const status =
        error.message?.includes("required") ||
        error.message?.includes("Invalid")
          ? 400
          : error.message?.includes("unavailable")
            ? 404
            : 500;
      return res.status(status).json({ message: error.message });
    }
  }
}
