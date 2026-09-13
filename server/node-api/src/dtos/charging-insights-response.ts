/**
 * ChargingInsightsResponse DTO
 * Response object for charging time insights endpoint
 */

export interface IOccupancyByHour {
  hour: number;
  avgSessionsPerHour: number;
  isPeak: boolean;
}

export interface IPrediction {
  predictedOccupancy: number; // 0-100%
  busyHours: number[];
  confidence: number;
}

export class ChargingInsightsResponse {
  public stationId: string;
  public occupancyByHour: IOccupancyByHour[];
  public predictions: IPrediction | null;
  public recommendation: string;
  public totalSessions: number;
  public dateRange: {
    start: Date;
    end: Date;
  };

  constructor(data: {
    stationId: string;
    occupancyByHour: { [hour: number]: number };
    predictions?: {
      predictedOccupancy: number;
      busyHours: number[];
      confidence: number;
    } | null;
    recommendation: string;
    totalSessions: number;
    dateRange: { start: Date; end: Date };
  }) {
    this.stationId = data.stationId;
    this.occupancyByHour = this.formatOccupancyByHour(
      data.occupancyByHour,
      data.occupancyByHour
    );
    this.predictions = data.predictions || null;
    this.recommendation = data.recommendation;
    this.totalSessions = data.totalSessions;
    this.dateRange = data.dateRange;
  }

  private formatOccupancyByHour(
    occupancy: { [hour: number]: number },
    allOccupancy: { [hour: number]: number }
  ): IOccupancyByHour[] {
    // Calculate average occupancy for peak determination
    const occupancyValues = Object.values(allOccupancy).filter(v => v > 0);
    const avgOccupancy = occupancyValues.length > 0
      ? occupancyValues.reduce((a, b) => a + b) / occupancyValues.length
      : 0;

    const peakThreshold = avgOccupancy * 1.5;

    return Object.entries(occupancy)
      .map(([hour, avg]) => ({
        hour: parseInt(hour),
        avgSessionsPerHour: parseFloat(avg.toFixed(2)),
        isPeak: avg > peakThreshold,
      }))
      .sort((a, b) => a.hour - b.hour);
  }
}
