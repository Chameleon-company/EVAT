/**
 * ChargingInsightsService
 * Calculates charging station occupancy insights and predictions
 * Queries historical session data and calls Python ML service for predictions
 */

import ChargerSessionRepository from '../repositories/charger-session-repository';
import { ChargingInsightsResponse } from '../dtos/charging-insights-response';
import axios from 'axios';

export default class ChargingInsightsService {
  private readonly repository: ChargerSessionRepository;
  private readonly PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5000';
  private readonly TIMEOUT_MS = 12000; // 12 second timeout for Python service + latency

  constructor(repository?: ChargerSessionRepository) {
    this.repository = repository || new ChargerSessionRepository();
  }

  /**
   * Calculate occupancy insights for a single station
   * @param stationId - The station ID
   * @param daysBack - Number of days of historical data to analyze (default: 30)
   */
  async getStationInsights(
    stationId: string,
    daysBack: number = 30
  ): Promise<ChargingInsightsResponse> {
    try {
      // Query historical occupancy from database
      const occupancyData = await this.repository.getStationOccupancyByHour(
        stationId,
        daysBack
      );

      // Get predictions from Python service
      let predictions = null;
      try {
        predictions = await this.predictOccupancy(
          stationId,
          occupancyData.occupancyByHour
        );
      } catch (error: any) {
        console.warn(`Python prediction service failed for station ${stationId}:`, error.message);
        // Fallback to DB-only data if Python service fails
        predictions = null;
      }

      // Generate recommendation based on occupancy and predictions
      const recommendation = this.generateRecommendation(
        occupancyData.occupancyByHour,
        predictions
      );

      return new ChargingInsightsResponse({
        stationId,
        occupancyByHour: occupancyData.occupancyByHour,
        predictions,
        recommendation,
        totalSessions: occupancyData.totalSessions,
        dateRange: occupancyData.dateRange,
      });
    } catch (error: any) {
      throw new Error(`Failed to get insights for station ${stationId}: ${error.message}`);
    }
  }

  /**
   * Calculate occupancy insights for multiple stations
   * @param stationIds - Array of station IDs
   * @param daysBack - Number of days of historical data to analyze (default: 30)
   */
  async getBulkInsights(
    stationIds: string[],
    daysBack: number = 30
  ): Promise<ChargingInsightsResponse[]> {
    try {
      const promises = stationIds.map((stationId) =>
        this.getStationInsights(stationId, daysBack).catch((error) => {
          console.error(`Error getting insights for station ${stationId}:`, error);
          return null;
        })
      );

      const results = await Promise.all(promises);
      return results.filter((r) => r !== null) as ChargingInsightsResponse[];
    } catch (error: any) {
      throw new Error(`Failed to get bulk insights: ${error.message}`);
    }
  }

  /**
   * Call Python occupancy prediction service
   * @param stationId - The station ID
   * @param historicalOccupancy - Historical occupancy by hour
   */
  private async predictOccupancy(
    stationId: string,
    historicalOccupancy: { [hour: number]: number }
  ): Promise<{
    predictedOccupancy: number;
    busyHours: number[];
    confidence: number;
  } | null> {
    try {
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5); // HH:MM

      const response = await axios.post(
        `${this.PYTHON_API_URL}/occupancyPrediction/predict`,
        {
          station_id: stationId,
          date: currentDate,
          time: currentTime,
          historical_occupancy: historicalOccupancy,
        },
        { timeout: this.TIMEOUT_MS }
      );

      if (response.data && (response.data as any).status === 'success') {
        const data = response.data as any;
        return {
          predictedOccupancy: data.predicted_occupancy,
          busyHours: data.busy_hours || [],
          confidence: data.confidence || 0.7,
        };
      }

      return null;
    } catch (error: any) {
      // Fallback: log error but don't crash
      if (error.code === 'ECONNREFUSED' || error.message.includes('timeout')) {
        console.warn(`Python API unavailable (${error.message}). Using DB-only data.`);
      } else {
        console.error(`Python prediction API error:`, error.message);
      }
      return null;
    }
  }

  /**
   * Generate human-readable recommendation based on occupancy data
   * @param occupancyByHour - Historical occupancy by hour
   * @param predictions - Predictions from Python service (optional)
   */
  private generateRecommendation(
    occupancyByHour: { [hour: number]: number },
    predictions: any | null
  ): string {
    try {
      // Calculate occupancy statistics
      const occupancyValues = Object.values(occupancyByHour).filter((v) => v > 0);
      if (occupancyValues.length === 0) {
        return 'Insufficient data to generate recommendations. Try any time.';
      }

      const avgOccupancy =
        occupancyValues.reduce((a, b) => a + b) / occupancyValues.length;
      const peakThreshold = avgOccupancy * 1.5;

      // Identify busy and off-peak hours
      const busyHours = Object.entries(occupancyByHour)
        .filter(([_, occ]) => occ > peakThreshold)
        .map(([hour, _]) => parseInt(hour))
        .sort((a, b) => a - b);

      const offPeakHours = Object.entries(occupancyByHour)
        .filter(([_, occ]) => occ < avgOccupancy * 0.75)
        .map(([hour, _]) => parseInt(hour))
        .sort((a, b) => a - b);

      // Build recommendation message
      if (busyHours.length === 0) {
        return 'Station generally has low occupancy throughout the day. Good time to charge anytime.';
      }

      const busyHoursStr = this.formatHours(busyHours);

      if (offPeakHours.length > 0) {
        const offPeakHoursStr = this.formatHours(offPeakHours);
        return `Station is busy ${busyHoursStr}. Best time to charge: ${offPeakHoursStr}`;
      }

      return `Station is busy ${busyHoursStr}. Consider charging during early morning or late evening hours.`;
    } catch (error: any) {
      console.error('Error generating recommendation:', error);
      return 'Unable to generate recommendations. Please try again later.';
    }
  }

  /**
   * Format hour numbers into readable time ranges
   * @param hours - Array of hours (0-23)
   */
  private formatHours(hours: number[]): string {
    if (hours.length === 0) return '';

    // Group consecutive hours
    const groups: [number, number][] = [];
    let start = hours[0];
    let end = hours[0];

    for (let i = 1; i < hours.length; i++) {
      if (hours[i] === end + 1) {
        end = hours[i];
      } else {
        groups.push([start, end]);
        start = hours[i];
        end = hours[i];
      }
    }
    groups.push([start, end]);

    // Format groups
    const formatted = groups.map(([s, e]) => {
      if (s === e) {
        return `${s}:00-${s + 1}:00`;
      } else {
        return `${s}:00-${e + 1}:00`;
      }
    });

    return formatted.join(', ');
  }
}
