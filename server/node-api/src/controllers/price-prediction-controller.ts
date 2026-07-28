import { Request, Response } from "express";
import PricePredictionService from "../services/price-prediction-service";

export default class PricePredictionController {
  constructor(private readonly pricePredictionService: PricePredictionService) {}

  private errorStatus(error: any): number {
    const status = Number(error?.status);
    if (status >= 400 && status < 600) return status;
    return 500;
  }

  /** GET /api/predict/price/health → GET /health */
  async getHealth(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.pricePredictionService.getHealth();
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(this.errorStatus(error)).json({ message: error.message });
    }
  }

  /** GET /api/predict/price/schema → GET /schema */
  async getSchema(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.pricePredictionService.getSchema();
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(this.errorStatus(error)).json({ message: error.message });
    }
  }

  /** GET /api/predict/price/model/info → GET /model/info */
  async getModelInfo(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.pricePredictionService.getModelInfo();
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(this.errorStatus(error)).json({ message: error.message });
    }
  }

  /**
   * POST /api/predict/price → POST /predict
   * Body: { row_id?, features }
   */
  async predict(req: Request, res: Response): Promise<Response> {
    try {
      const { features, row_id } = req.body;

      if (!features || typeof features !== "object" || Array.isArray(features)) {
        return res.status(400).json({
          message: "Missing required field: features (object)",
        });
      }

      const result = await this.pricePredictionService.predict({ features, row_id });
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(this.errorStatus(error)).json({ message: error.message });
    }
  }

  /**
   * POST /api/predict/price/batch → POST /predict/batch
   * Body: { records: [{ row_id?, features }] }
   */
  async predictBatch(req: Request, res: Response): Promise<Response> {
    try {
      const { records } = req.body;

      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({
          message: "Missing required field: records (non-empty array)",
        });
      }

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        if (!record?.features || typeof record.features !== "object" || Array.isArray(record.features)) {
          return res.status(400).json({
            message: `records[${i}].features must be an object`,
          });
        }
      }

      const result = await this.pricePredictionService.predictBatch({ records });
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(this.errorStatus(error)).json({ message: error.message });
    }
  }
}
