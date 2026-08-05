import { Request, Response } from "express";
import ReliabilityScoringService from "../services/reliability-scoring-service";

export default class ReliabilityScoringController {
  constructor(
    private readonly reliabilityScoringService: ReliabilityScoringService
  ) {}

  private errorStatus(error: any): number {
    const status = Number(error?.status);
    if (status >= 400 && status < 600) return status;
    return 500;
  }

  /** GET /api/reliability/health → GET /health */
  async getHealth(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.reliabilityScoringService.getHealth();
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(this.errorStatus(error)).json({ message: error.message });
    }
  }

  /** GET /api/reliability/suburbs → GET /suburbs */
  async getSuburbs(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.reliabilityScoringService.getSuburbs();
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(this.errorStatus(error)).json({ message: error.message });
    }
  }

  /** GET /api/reliability/summary → GET /summary */
  async getSummary(req: Request, res: Response): Promise<Response> {
    try {
      const suburb =
        typeof req.query.suburb === "string" ? req.query.suburb : undefined;
      const result = await this.reliabilityScoringService.getSummary({ suburb });
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(this.errorStatus(error)).json({ message: error.message });
    }
  }

  /** GET /api/reliability/stations → GET /stations */
  async getStations(req: Request, res: Response): Promise<Response> {
    try {
      const suburb =
        typeof req.query.suburb === "string" ? req.query.suburb : undefined;
      const sentiment =
        typeof req.query.sentiment === "string" ? req.query.sentiment : undefined;
      const minScoreRaw = req.query.min_score ?? req.query.minScore;
      const limitRaw = req.query.limit;
      const offsetRaw = req.query.offset;

      const min_score =
        minScoreRaw !== undefined ? Number(minScoreRaw) : undefined;
      const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
      const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;

      if (min_score !== undefined && Number.isNaN(min_score)) {
        return res.status(400).json({ message: "min_score must be a number" });
      }
      if (limit !== undefined && Number.isNaN(limit)) {
        return res.status(400).json({ message: "limit must be a number" });
      }
      if (offset !== undefined && Number.isNaN(offset)) {
        return res.status(400).json({ message: "offset must be a number" });
      }

      const result = await this.reliabilityScoringService.getStations({
        suburb,
        sentiment,
        min_score,
        limit,
        offset,
      });
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(this.errorStatus(error)).json({ message: error.message });
    }
  }

  /** GET /api/reliability/stations/:id → GET /stations/:id */
  async getStation(req: Request, res: Response): Promise<Response> {
    try {
      const chargerId = req.params.id;
      if (!chargerId) {
        return res.status(400).json({ message: "Missing station id" });
      }
      const result = await this.reliabilityScoringService.getStation(chargerId);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(this.errorStatus(error)).json({ message: error.message });
    }
  }

  /** GET /api/reliability/top → GET /top */
  async getTop(req: Request, res: Response): Promise<Response> {
    try {
      const kind =
        typeof req.query.kind === "string" ? req.query.kind : undefined;
      const suburb =
        typeof req.query.suburb === "string" ? req.query.suburb : undefined;
      const limitRaw = req.query.limit;
      const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;

      if (limit !== undefined && Number.isNaN(limit)) {
        return res.status(400).json({ message: "limit must be a number" });
      }

      const result = await this.reliabilityScoringService.getTop({
        kind,
        suburb,
        limit,
      });
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(this.errorStatus(error)).json({ message: error.message });
    }
  }

  /**
   * POST /api/reliability/score → POST /score
   * Body: { status, power_kw, station_id?, name?, max_power_kw? }
   */
  async score(req: Request, res: Response): Promise<Response> {
    try {
      const { status, power_kw, station_id, name, max_power_kw } = req.body ?? {};

      if (typeof status !== "string" || !status.trim()) {
        return res.status(400).json({
          message: "Missing required field: status (string)",
        });
      }
      if (power_kw === undefined || power_kw === null || Number.isNaN(Number(power_kw))) {
        return res.status(400).json({
          message: "Missing required field: power_kw (number)",
        });
      }

      const result = await this.reliabilityScoringService.score({
        status,
        power_kw: Number(power_kw),
        station_id,
        name,
        max_power_kw:
          max_power_kw === undefined || max_power_kw === null
            ? undefined
            : Number(max_power_kw),
      });
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(this.errorStatus(error)).json({ message: error.message });
    }
  }

  /**
   * POST /api/reliability/score/batch → POST /score/batch
   * Body: { records: [{ status, power_kw, ... }], max_power_kw? }
   */
  async scoreBatch(req: Request, res: Response): Promise<Response> {
    try {
      const { records, max_power_kw } = req.body ?? {};

      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({
          message: "Missing required field: records (non-empty array)",
        });
      }

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        if (typeof record?.status !== "string" || !record.status.trim()) {
          return res.status(400).json({
            message: `records[${i}].status must be a non-empty string`,
          });
        }
        if (
          record?.power_kw === undefined ||
          record?.power_kw === null ||
          Number.isNaN(Number(record.power_kw))
        ) {
          return res.status(400).json({
            message: `records[${i}].power_kw must be a number`,
          });
        }
      }

      const result = await this.reliabilityScoringService.scoreBatch({
        records: records.map((r: any) => ({
          station_id: r.station_id,
          name: r.name,
          status: r.status,
          power_kw: Number(r.power_kw),
        })),
        max_power_kw:
          max_power_kw === undefined || max_power_kw === null
            ? undefined
            : Number(max_power_kw),
      });
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(this.errorStatus(error)).json({ message: error.message });
    }
  }

  /**
   * POST /api/reliability/sentiment → POST /sentiment
   * Body: { text }
   */
  async analyzeSentiment(req: Request, res: Response): Promise<Response> {
    try {
      const { text } = req.body ?? {};
      if (typeof text !== "string") {
        return res.status(400).json({
          message: "Missing required field: text (string)",
        });
      }

      const result = await this.reliabilityScoringService.analyzeSentiment({
        text,
      });
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(this.errorStatus(error)).json({ message: error.message });
    }
  }
}
