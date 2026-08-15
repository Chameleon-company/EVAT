import { Request, Response } from "express";
import PromotionService from "../services/promotion-service";
import { PromotionResponse } from "../dtos/promotion-response";

export default class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  async getNearby(req: Request, res: Response): Promise<Response> {
    try {
      const latitude = Number(req.query.lat ?? req.query.latitude);
      const longitude = Number(req.query.lon ?? req.query.lng ?? req.query.longitude);
      const radiusKm = req.query.radiusKm != null ? Number(req.query.radiusKm) : undefined;
      const category = req.query.category as string | undefined;
      const stationId = req.query.stationId as string | undefined;
      const includeFallbacks = req.query.includeFallbacks !== "false";

      const promotions = await this.promotionService.getNearbyPromotions({
        latitude,
        longitude,
        radiusKm,
        category,
        stationId,
        includeFallbacks,
      });

      return res.status(200).json({
        message: "Nearby promotions retrieved successfully",
        data: {
          count: promotions.length,
          promotions: promotions.map((promo) => new PromotionResponse(promo)),
        },
      });
    } catch (error: any) {
      const status = error.message?.includes("required") || error.message?.includes("must")
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
      const includeFallbacks = req.query.includeFallbacks !== "false";

      const promotions = await this.promotionService.getNearbyForStation(
        stationId,
        radiusKm,
        category,
        includeFallbacks
      );

      return res.status(200).json({
        message: "Nearby promotions retrieved successfully",
        data: {
          count: promotions.length,
          promotions: promotions.map((promo) => new PromotionResponse(promo)),
        },
      });
    } catch (error: any) {
      if (error.message === "Charging station not found") {
        return res.status(404).json({ message: error.message });
      }
      const status =
        error.message?.includes("required") ||
        error.message?.includes("must") ||
        error.message?.includes("unavailable")
          ? 400
          : 500;
      return res.status(status).json({ message: error.message });
    }
  }

  async getPromotionById(req: Request, res: Response): Promise<Response> {
    try {
      const promotion = await this.promotionService.getPromotionById(req.params.id);
      if (!promotion) {
        return res.status(404).json({ message: "Promotion not found" });
      }
      return res.status(200).json({
        message: "Promotion retrieved successfully",
        data: new PromotionResponse(promotion),
      });
    } catch (error: any) {
      const status = error.message?.includes("required") ? 400 : 500;
      return res.status(status).json({ message: error.message });
    }
  }

  async getAllPromotions(req: Request, res: Response): Promise<Response> {
    try {
      const page = parseInt((req.query.page as string) || "1", 10);
      const limit = parseInt((req.query.limit as string) || "20", 10);
      const category = req.query.category as string | undefined;
      const activeOnly = req.query.activeOnly === "true";

      const result = await this.promotionService.getAllPromotions(
        page,
        limit,
        category,
        activeOnly
      );

      return res.status(200).json({
        message: "Promotions retrieved successfully",
        data: {
          promotions: result.promotions.map((promo) => new PromotionResponse(promo)),
          pagination: {
            total: result.total,
            page: result.page,
            totalPages: result.totalPages,
            limit,
          },
        },
      });
    } catch (error: any) {
      const status = error.message?.includes("Invalid") ? 400 : 500;
      return res.status(status).json({ message: error.message });
    }
  }

  async createPromotion(req: Request, res: Response): Promise<Response> {
    try {
      const promotion = await this.promotionService.createPromotion(req.body);
      return res.status(201).json({
        message: "Promotion created successfully",
        data: new PromotionResponse(promotion),
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async updatePromotion(req: Request, res: Response): Promise<Response> {
    try {
      const promotion = await this.promotionService.updatePromotion(
        req.params.id,
        req.body
      );
      if (!promotion) {
        return res.status(404).json({ message: "Promotion not found" });
      }
      return res.status(200).json({
        message: "Promotion updated successfully",
        data: new PromotionResponse(promotion),
      });
    } catch (error: any) {
      const status = error.message?.includes("required") || error.message?.includes("Invalid")
        ? 400
        : 500;
      return res.status(status).json({ message: error.message });
    }
  }

  async deletePromotion(req: Request, res: Response): Promise<Response> {
    try {
      const promotion = await this.promotionService.deletePromotion(req.params.id);
      if (!promotion) {
        return res.status(404).json({ message: "Promotion not found" });
      }
      return res.status(200).json({
        message: "Promotion deleted successfully",
        data: new PromotionResponse(promotion),
      });
    } catch (error: any) {
      const status = error.message?.includes("required") ? 400 : 500;
      return res.status(status).json({ message: error.message });
    }
  }

  async seedPromotions(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.promotionService.seedSamplePromotions();
      return res.status(result.skipped ? 200 : 201).json({
        message: result.skipped
          ? "Sample promotions already exist"
          : "Sample promotions seeded successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}
