// /test/routes/charger-session-route.test.ts

import request from 'supertest';
import express from 'express';
import ChargerSessionController from '../../src/controllers/charger-session-controller';
import ChargerSessionService from '../../src/services/charger-session-service';
import { Types } from 'mongoose';
import { IChargerSessionDocument, SessionStatus, SessionOperationType } from '../../src/models/charger-session-model';

describe('ChargerSession Routes', () => {
    let app: express.Application;
    let service: jest.Mocked<ChargerSessionService>;

    beforeEach(() => {
        // Mock the service layer
        service = {
            getLogs: jest.fn(),
            streamSessions: jest.fn(),
            getSessionById: jest.fn(),
            getSessionsByUser: jest.fn(),
            getSessionsByStation: jest.fn(),
            createSession: jest.fn(),
            endSession: jest.fn(),
        } as unknown as jest.Mocked<ChargerSessionService>;

        // Setup express app
        const controller = new ChargerSessionController(service);
        app = express();
        app.use(express.json());

        // Mount routes
        app.get('/api/charger-sessions/sessions/stream', (req, res) =>
            controller.streamSessions(req, res));
        app.get('/api/charger-sessions/sessions/logs', (req, res) =>
            controller.getLogs(req, res));

        // Default streamSessions mock
        // service.streamSessions.mockImplementation((callback) => {
        //     callback({
        //         sessionId: 'session1',
        //         userId: 'user1',
        //         stationId: 'station1',
        //         status: 'in_progress' as SessionStatus,
        //         timestamp: new Date(),
        //         operationType: 'insert' as SessionOperationType,
        //         energyDelivered: 10.0,
        //         cost: 2.00,
        //     });
        // });
        // jest.clearAllMocks();
    });

    describe('GET /api/charger-sessions/sessionslogs', () => {
        test('Case: should return logs sucessfully', async () => {
            // Arrange
            const mockLogs= [
                {
                    _id: new Types.ObjectId('53c2aa11837643ef084c5684'),
                    userId: new Types.ObjectId('5ac30514d3f5d02a0fbe3b02'),
                    stationId: new Types.ObjectId('0dbabe16ef9c0c9bc32d8aca'),
                    startTime: new Date().toISOString(),
                    endTime: undefined,
                    status: 'in_progress',
                    energyDelivered: 0,
                    cost: 0,
                },
                {
                    _id: new Types.ObjectId('301f719691119d2112ed1c01'),
                    userId: new Types.ObjectId('813aaa04446cfd6139863a82'),
                    stationId: new Types.ObjectId('5656462797d55b675c532651'),
                    startTime: new Date().toISOString(),
                    endTime: undefined,
                    status: 'completed',
                    energyDelivered: 10.00,
                    cost: 4.00,
                },
            ];
            service.getLogs.mockResolvedValue(mockLogs as any);

            // Convert ObjectIds in mockLogs to appropriate types
            const expected = mockLogs.map(log => ({
                ...log,
                _id: log._id.toHexString(),
                userId: log.userId.toHexString(),
                stationId: log.stationId.toHexString(),
                startTime: log.startTime,
                // Removed endTime for conversion
                status: log.status,
                energyDelivered: log.energyDelivered,
                cost: log.cost,
            }));

            // Act
            const res = await request(app).get('/api/charger-sessions/sessions/logs');

            // Assert
            expect(res.status).toBe(200);
            expect(res.body).toEqual(expected);
            expect(service.getLogs).toHaveBeenCalledWith({}, 100, 0);
        });

        test('Case: should return 500 if service throws', async () => {
            // Arrange
            service.getLogs.mockRejectedValue(new Error('Failed to fetch logs'));

            // Act
            const res = await request(app).get('/api/charger-sessions/sessions/logs');

            // Assert
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: 'Failed to fetch logs' });
        });
    });

    describe('GET /api/charger-sessions/sessions/stream', () => {
        test('Case: should set SSE headers and call service.streamSessions', async () => {
        // Arrange
        let sentData: string[] = [];

        service.streamSessions.mockImplementation((callback) => {
            callback({
                sessionId: '53c2aa11837643ef084c5684',
                userId: '5ac30514d3f5d02a0fbe3b02',
                stationId: '0dbabe16ef9c0c9bc32d8aca',
                status: 'in_progress' as SessionStatus,
                timestamp: new Date(),
                operationType: 'insert' as SessionOperationType,
                energyDelivered: 10.00,
                cost: 5.00,
            });
        });

        // Request/reponse mock
        const req: any = {};
        const res: any = {
            setHeader: jest.fn(),
            write: jest.fn((data: string) => sentData.push(data)),
            end: jest.fn(),
        };

        // Act
        const controller = new ChargerSessionController(service);
        controller.streamSessions(req, res)

        // Assert
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
        expect(sentData).toEqual(expect.arrayContaining([
            expect.stringContaining('"sessionId":"53c2aa11837643ef084c5684"'),
        ]));
        expect(service.streamSessions).toHaveBeenCalled();
    });

        test('Case: stream should send at least one event', async () => {
            // Arrange
            let sentData: string | null = null;
            service.streamSessions.mockImplementation((callback) => {
                const event = {
                    sessionId: '53c2aa11837643ef084c5684',
                    userId: '5ac30514d3f5d02a0fbe3b02',
                    stationId: '0dbabe16ef9c0c9bc32d8aca',
                    status: 'in_progress' as SessionStatus,
                    timestamp: new Date(),
                    operationType: 'insert' as SessionOperationType,
                    energyDelivered: 10.00,
                    cost: 5.00,
                };
                callback(event);
            });

            // Override res.write to capture the SSE data
            const res: any = {
                setHeader: jest.fn(),
                write: jest.fn((data: string) => { sentData = data; }),
            };
            const req: any = {};

            // Act
            const controller = new ChargerSessionController(service);
            controller.streamSessions(req, res);

            // Assert
            expect(sentData).toContain('"sessionId":"53c2aa11837643ef084c5684"');
            expect(sentData).toContain('"status":"in_progress"');
        });
    });
});

