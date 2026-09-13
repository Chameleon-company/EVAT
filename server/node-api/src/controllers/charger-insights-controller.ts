/**
 * ChargerInsightsController
 * Handles HTTP requests for charging time insights
 */

import { Request, Response } from 'express';
import ChargingInsightsService from '../services/charger-insights-service';

export default class ChargerInsightsController {
  constructor(private readonly insightsService: ChargingInsightsService) {}

  /**
   * Get charging insights for a single station
   * GET /api/v1/insights/station/:stationId
   *
   * Query params:
   *   - daysBack: Number of days of historical data (default: 30)
   */
  async getStationInsights(req: Request, res: Response): Promise<Response> {
    try {
      const { stationId } = req.params;
      const daysBack = parseInt(req.query.daysBack as string) || 30;

      if (!stationId) {
        return res.status(400).json({
          message: 'stationId is required',
          error: 'Bad Request',
        });
      }

      if (daysBack < 1 || daysBack > 365) {
        return res.status(400).json({
          message: 'daysBack must be between 1 and 365',
          error: 'Bad Request',
        });
      }

      const insights = await this.insightsService.getStationInsights(
        stationId,
        daysBack
      );

      return res.status(200).json({
        message: 'Insights retrieved successfully',
        data: insights,
      });
    } catch (error: any) {
      console.error('Error getting station insights:', error);
      return res.status(500).json({
        message: 'Failed to retrieve insights',
        error: error.message,
      });
    }
  }

  /**
   * Get charging insights for multiple stations
   * POST /api/v1/insights/stations
   *
   * Request body:
   * {
   *   "stationIds": ["id1", "id2", ...],
   *   "daysBack": 30 (optional)
   * }
   */
  async getBulkInsights(req: Request, res: Response): Promise<Response> {
    try {
      const { stationIds, daysBack = 30 } = req.body;

      if (!stationIds || !Array.isArray(stationIds) || stationIds.length === 0) {
        return res.status(400).json({
          message: 'stationIds must be a non-empty array',
          error: 'Bad Request',
        });
      }

      if (stationIds.length > 50) {
        return res.status(400).json({
          message: 'Maximum 50 stations per request',
          error: 'Bad Request',
        });
      }

      if (daysBack < 1 || daysBack > 365) {
        return res.status(400).json({
          message: 'daysBack must be between 1 and 365',
          error: 'Bad Request',
        });
      }

      const insights = await this.insightsService.getBulkInsights(
        stationIds,
        daysBack
      );

      return res.status(200).json({
        message: `Retrieved insights for ${insights.length} out of ${stationIds.length} stations`,
        data: insights,
        count: insights.length,
      });
    } catch (error: any) {
      console.error('Error getting bulk insights:', error);
      return res.status(500).json({
        message: 'Failed to retrieve bulk insights',
        error: error.message,
      });
    }
  }
}
