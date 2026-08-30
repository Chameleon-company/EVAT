import { Request, Response } from "express";
import PricePredictionService from "../services/price-prediction-service";

/**
 * Core vehicle inputs a caller must supply. Mirrors USER_INPUT_COLUMNS in the
 * Price Prediction FastAPI service and the payload the web form already sends.
 *
 * Without these the service still answers, because it fills every gap from
 * training-data defaults. That produces a confident price for input that never
 * described a vehicle, so the request is rejected here instead.
 */
const TEXT_FEATURES = ["Brand", "Model", "Fuel Type", "Transmission", "Condition"] as const;

const NUMERIC_FEATURES: Record<string, { min: number; max?: number }> = {
  Year: { min: 1900, max: new Date().getFullYear() + 1 },
  Mileage: { min: 0 },
  "Engine Size": { min: 0 },
};

const REQUIRED_FEATURES: string[] = [...TEXT_FEATURES, ...Object.keys(NUMERIC_FEATURES)];

export default class PricePredictionController {
  constructor(private readonly pricePredictionService: PricePredictionService) {}

  private errorStatus(error: any): number {
    const status = Number(error?.status);
    if (status >= 400 && status < 600) return status;
    return 500;
  }

  /**
   * Returns an error message when the feature set could not describe a real
   * vehicle, or null when it is acceptable.
   *
   * Only structure and types are checked. Whether a value is one the model was
   * trained on (an unknown brand, say) is a model concern, not an integration
   * one, and is deliberately left to the ML service.
   */
  private validateFeatures(features: Record<string, unknown>): string | null {
    const isBlank = (value: unknown) =>
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "");

    const missing = REQUIRED_FEATURES.filter((key) => isBlank(features[key]));
    if (missing.length > 0) {
      return `Missing required feature(s): ${missing.join(", ")}`;
    }

    for (const key of TEXT_FEATURES) {
      if (typeof features[key] !== "string") {
        return `Invalid value for ${key}: expected text`;
      }
    }

    for (const [key, rule] of Object.entries(NUMERIC_FEATURES)) {
      const value = Number(features[key]);
      if (!Number.isFinite(value)) {
        return `Invalid value for ${key}: expected a number`;
      }
      if (value < rule.min || (rule.max !== undefined && value > rule.max)) {
        const range =
          rule.max !== undefined ? `between ${rule.min} and ${rule.max}` : `at least ${rule.min}`;
        return `Invalid value for ${key}: expected a number ${range}`;
      }
    }

    return null;
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

      const invalid = this.validateFeatures(features);
      if (invalid) {
        return res.status(400).json({ message: invalid });
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

        const invalid = this.validateFeatures(record.features);
        if (invalid) {
          return res.status(400).json({ message: `records[${i}]: ${invalid}` });
        }
      }

      const result = await this.pricePredictionService.predictBatch({ records });
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(this.errorStatus(error)).json({ message: error.message });
    }
  }
}
