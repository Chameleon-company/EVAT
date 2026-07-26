import { Request, Response } from 'express';
import { Client } from '@googlemaps/google-maps-services-js';
import axios from 'axios';
import { createRouteFromPoints, createRouteFromSentence } from '../../src/controllers/navigation-controller';


// Mock the Google Maps Client
jest.mock('@googlemaps/google-maps-services-js', () => {
    const mockClient = {
        directions: jest.fn(),
    };
    return {
        Client: jest.fn().mockImplementation(() => mockClient)
    };
});

// Mock axios
jest.mock('axios');

describe('navigation-controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let mapsClient: any;

    beforeEach(() => {
        // Initialise mock req and res objects
        req = {
            body: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        // Get the mocked client
        mapsClient = new Client();
        // Clear all mocks before each test
        jest.clearAllMocks();
        // Set Google API Keys
        process.env.GOOGLE_MAPS_API_KEY = 'test_google_maps_api_key';
        process.env.GOOGLE_AI_API_KEY = 'test_google_ai_api_key';
    });

    describe('createRouteFromPoints', () => {
        test('Case: Return 400 if start and or destination is missing', async () => {
            // No start and destination
            // Arrange
            req.body = { stops: ['stop1'] };
            // Act
            await createRouteFromPoints(req as Request, res as Response);
            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Start and destination are required." });

            // No destination
            // Arrange
            req.body = { start: 'start1' };
            // Act
            await createRouteFromPoints(req as Request, res as Response);
            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Start and destination are required." });

            // No start
            // Arrange
            req.body = { destination: 'dest1' };
            // Act
            await createRouteFromPoints(req as Request, res as Response);
            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Start and destination are required." });
        });

        test('Case: Call Google Maps with correct parameters', async () => {
            // Arrange
            req.body = {
                start: 'start1',
                stops: ['stop1', 'stop2',],
                destination: 'dest1'
            }
            const mockResponse = {
                data: {
                    routes: [{
                        overview_polyline: { points: 'test_route' }
                    }]
                }
            };
            mapsClient.directions.mockResolvedValue(mockResponse);

            // Act
            await createRouteFromPoints(req as Request, res as Response);

            // Assert
            expect(mapsClient.directions).toHaveBeenCalledWith({
                params: {
                    origin: 'start1',
                    destination: 'dest1',
                    waypoints: ['stop1', 'stop2'],
                    key: 'test_google_maps_api_key',
                }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ route: mockResponse.data.routes[0] });
        });

        test('Case: Should handle Google Maps API error', async () => {
            // Arrange
            req.body = { start: 'start1', destination: 'dest1' };
            const errorMessage = 'Google Maps API error';
            mapsClient.directions.mockRejectedValue(new Error(errorMessage));

            // Act
            await createRouteFromPoints(req as Request, res as Response);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Failed to get route',
                error: errorMessage,
            });
        });
    });

    describe('createRoutesFromSentance', () => {
        test('Case: Should return 400 if sentence is missing', async () => {
            // Arrange
            req.body = {}; // Missing sentence
            // Act
            await createRouteFromSentence(req as Request, res as Response);
            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Sentence is required.' });
        });

        test('Case: Should call Gemini API with the correct prompt and headers', async () => {
            // Arrange
            req.body = { sentence: 'Take me from A to B via C' };
            const mockGeminiResponse = {
                data: {
                    candidates: [{
                        content: {
                            parts: [{
                                text: '```json\n{ "start": "A", "stops": ["C"], "destination": "B" }\n```',
                            }]
                        }
                    }]
                }
            };
            (axios.post as jest.Mock).mockResolvedValue(mockGeminiResponse);

            // Act
            await createRouteFromSentence(req as Request, res as Response);

            // Assert
            expect(axios.post).toHaveBeenCalledWith(
                `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=test_google_ai_api_key`,
                {
                    contents: [{
                        parts: [{
                            text: 'Extract the start location, optional stops, and destination from this sentence: "Take me from A to B via C". Return only valid JSON like: { "start": "...", "stops": ["..."], "destination": "..." }',
                        }
                        ]
                    }
                    ]
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );
        });

        test('Case: Should handle Gemini API error', async () => {
            // Arrange
            req.body = { sentence: 'Go from X to Y' };
            const errorMessage = 'Gemini API error';
            (axios.post as jest.Mock).mockRejectedValue(new Error(errorMessage));

            // Act
            await createRouteFromSentence(req as Request, res as Response);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Error processing sentence', error: errorMessage });
        });

        test('Case: Should handle invalid JSON response from Gemini', async () => {
            // Arrange
            req.body = { sentence: 'Drive' };
            (axios.post as jest.Mock).mockResolvedValue({
                data: { candidates: [{ content: { parts: [{ text: 'invalid json' }] } }] },
            });

            // Act
            await createRouteFromSentence(req as Request, res as Response);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Failed to parse Gemini output as JSON' })
            );
        });

        test('Case: Should handle missing start or destination in extracted data', async () => {
            // Arrange
            req.body = { sentence: 'Stop at z' };
            (axios.post as jest.Mock).mockResolvedValue({
                data: { candidates: [{ content: { parts: [{ text: '```json\n{ "stops": ["z"] }\n```' }] } }] },
            });

            // Act
            await createRouteFromSentence(req as Request, res as Response);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Failed to extract start or destination from sentence.' })
            );
        });
    });
});
