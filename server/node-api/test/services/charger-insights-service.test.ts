import axios from 'axios';
import ChargerSessionRepository from '../../src/repositories/charger-session-repository';
import ChargingInsightsService from '../../src/services/charger-insights-service';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ChargingInsightsService', () => {
	let service: ChargingInsightsService;
	let repository: jest.Mocked<ChargerSessionRepository>;

	const occupancyData = {
		occupancyByHour: { 8: 1, 9: 1, 10: 1, 14: 4, 15: 4, 16: 4 },
		totalSessions: 15,
		dateRange: {
			start: new Date('2026-08-01T00:00:00.000Z'),
			end: new Date('2026-09-01T00:00:00.000Z'),
		},
	};

	beforeEach(() => {
		repository = {
			getStationOccupancyByHour: jest.fn(),
		} as unknown as jest.Mocked<ChargerSessionRepository>;
		service = new ChargingInsightsService(repository);
		jest.clearAllMocks();
	});

	test('returns occupancy insights with Python predictions', async () => {
		repository.getStationOccupancyByHour.mockResolvedValue(occupancyData);
		mockedAxios.post.mockResolvedValue({
			data: {
				status: 'success',
				predicted_occupancy: 80,
				busy_hours: [14, 15, 16],
				confidence: 0.75,
			},
		} as any);

		const result = await service.getStationInsights('station-1', 30);

		expect(repository.getStationOccupancyByHour).toHaveBeenCalledWith('station-1', 30);
		expect(mockedAxios.post).toHaveBeenCalledWith(
			expect.stringContaining('/occupancyPrediction/predict'),
			expect.objectContaining({
				station_id: 'station-1',
				historical_occupancy: occupancyData.occupancyByHour,
			}),
			{ timeout: 12000 },
		);
		expect(result.predictions).toEqual({
			predictedOccupancy: 80,
			busyHours: [14, 15, 16],
			confidence: 0.75,
		});
		expect(result.recommendation).toContain('14:00-17:00');
	});

	test('falls back to database insights when Python prediction fails', async () => {
		repository.getStationOccupancyByHour.mockResolvedValue(occupancyData);
		mockedAxios.post.mockRejectedValue(new Error('timeout'));

		const result = await service.getStationInsights('station-1');

		expect(result.predictions).toBeNull();
		expect(result.totalSessions).toBe(15);
		expect(result.recommendation).toContain('Station is busy');
	});

	test('returns successful stations when one bulk station fails', async () => {
		repository.getStationOccupancyByHour
			.mockResolvedValueOnce(occupancyData)
			.mockRejectedValueOnce(new Error('station unavailable'));
		mockedAxios.post.mockResolvedValue({
			data: {
				status: 'success',
				predicted_occupancy: 50,
				busy_hours: [],
				confidence: 0.5,
			},
		} as any);

		const result = await service.getBulkInsights(['station-1', 'station-2']);

		expect(result).toHaveLength(1);
		expect(result[0].stationId).toBe('station-1');
	});

	test('returns a low-occupancy recommendation when no peak exists', async () => {
		repository.getStationOccupancyByHour.mockResolvedValue({
			...occupancyData,
			occupancyByHour: { 8: 1, 9: 1, 10: 1, 11: 1 },
		});
		mockedAxios.post.mockResolvedValue({
			data: {
				status: 'success',
				predicted_occupancy: 25,
				busy_hours: [],
				confidence: 0.2,
			},
		} as any);

		const result = await service.getStationInsights('station-1');

		expect(result.recommendation).toContain('Good time to charge anytime');
	});

	test('formats separated hours as separate ranges', () => {
		const formatHours = (service as any).formatHours.bind(service);

		expect(formatHours([8, 9, 14, 16])).toBe(
			'8:00-10:00, 14:00-15:00, 16:00-17:00',
		);
	});
});
