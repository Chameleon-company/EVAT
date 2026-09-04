import { Types } from "mongoose";
import RecommendationHistoryRepository from "../../src/repositories/recommendation-history-repository";
import RecommendationHistoryService from "../../src/services/recommendation-history-service";

describe("recommendation-history-service", () => {
    let repository: jest.Mocked<RecommendationHistoryRepository>;
    let service: RecommendationHistoryService;

    beforeEach(() => {
        repository = {
            create: jest.fn(),
            findById: jest.fn(),
            findRecentByUser: jest.fn(),
            recordSelection: jest.fn(),
        } as unknown as jest.Mocked<RecommendationHistoryRepository>;

        service = new RecommendationHistoryService(repository);
    });

    describe("createSession", () => {
        test("Case: Should create a recommendation session and return its ID", async () => {
            // Arrange
            const userId = new Types.ObjectId();
            const sessionId = new Types.ObjectId();
            const sessionInput = {
                userId: userId.toString(),
                userLocation: {
                    latitude: -37.8136,
                    longitude: 144.9631,
                },
                candidates: [],
            };

            repository.create.mockResolvedValue({
                _id: sessionId,
            } as any);

            // Act
            const result = await service.createSession(sessionInput);

            // Assert
            expect(repository.create).toHaveBeenCalledWith({
                userId,
                userLocation: sessionInput.userLocation,
                candidates: sessionInput.candidates,
                selection: {
                    stationId: null,
                    selectedAt: null,
                },
            });
            expect(result).toEqual(sessionId);
        });

        test("Case: Should reject an invalid user ID", async () => {
            const sessionInput = {
                userId: "invalid-user-id",
                userLocation: {
                    latitude: -37.8136,
                    longitude: 144.9631,
                },
                candidates: [],
            };

            await expect(service.createSession(sessionInput)).rejects.toThrow(
                "A valid user ID is required.",
            );
            expect(repository.create).not.toHaveBeenCalled();
        });

        test("Case: Should reject a missing user location", async () => {
            const sessionInput = {
                userId: new Types.ObjectId().toString(),
                candidates: [],
            };

            await expect(
                service.createSession(sessionInput as any),
            ).rejects.toThrow("User location is required.");
            expect(repository.create).not.toHaveBeenCalled();
        });

        test("Case: Should reject candidates that are not an array", async () => {
            const sessionInput = {
                userId: new Types.ObjectId().toString(),
                userLocation: {
                    latitude: -37.8136,
                    longitude: 144.9631,
                },
                candidates: "not-an-array",
            };

            await expect(
                service.createSession(sessionInput as any),
            ).rejects.toThrow("Candidates must be an array of");
            expect(repository.create).not.toHaveBeenCalled();
        });
    });

    describe("recordSelection", () => {
        test.each([
            {
                description: "an invalid session ID",
                sessionId: "invalid",
                stationId: new Types.ObjectId().toString(),
                userId: new Types.ObjectId().toString(),
                error: "Invalid session ID.",
            },
            {
                description: "an invalid station ID",
                sessionId: new Types.ObjectId().toString(),
                stationId: "invalid",
                userId: new Types.ObjectId().toString(),
                error: "Invalid charging station ID",
            },
            {
                description: "an invalid requesting user ID",
                sessionId: new Types.ObjectId().toString(),
                stationId: new Types.ObjectId().toString(),
                userId: "invalid",
                error: "Invalid user ID",
            },
        ])("Case: Should reject $description", async ({
            sessionId,
            stationId,
            userId,
            error,
        }) => {
            await expect(
                service.recordSelection(
                    sessionId,
                    stationId,
                    userId,
                    new Date(),
                ),
            ).rejects.toThrow(error);
            expect(repository.findById).not.toHaveBeenCalled();
            expect(repository.recordSelection).not.toHaveBeenCalled();
        });

        test("Case: Should reject a selection when the session is not found", async () => {
            const sessionId = new Types.ObjectId().toString();
            const stationId = new Types.ObjectId().toString();
            const userId = new Types.ObjectId().toString();
            repository.findById.mockResolvedValue(null);

            await expect(
                service.recordSelection(
                    sessionId,
                    stationId,
                    userId,
                    new Date(),
                ),
            ).rejects.toThrow("Recommendation session not found");
            expect(repository.recordSelection).not.toHaveBeenCalled();
        });

        test("Case: Should reject a selection belonging to another user", async () => {
            const sessionId = new Types.ObjectId().toString();
            const stationId = new Types.ObjectId().toString();
            const requestingUserId = new Types.ObjectId().toString();

            repository.findById.mockResolvedValue({
                userId: new Types.ObjectId(),
                candidates: [{ stationId: new Types.ObjectId(stationId) }],
            } as any);

            await expect(
                service.recordSelection(
                    sessionId,
                    stationId,
                    requestingUserId,
                    new Date(),
                ),
            ).rejects.toThrow("Session does not belong to requesting user.");
            expect(repository.recordSelection).not.toHaveBeenCalled();
        });

        test("Case: Should reject a station that is not one of the candidates", async () => {
            const sessionId = new Types.ObjectId().toString();
            const stationId = new Types.ObjectId().toString();
            const requestingUserId = new Types.ObjectId().toString();

            repository.findById.mockResolvedValue({
                userId: new Types.ObjectId(requestingUserId),
                candidates: [{ stationId: new Types.ObjectId() }],
            } as any);

            await expect(
                service.recordSelection(
                    sessionId,
                    stationId,
                    requestingUserId,
                    new Date(),
                ),
            ).rejects.toThrow(
                "Selected station is not in the candidates list for this session.",
            );
            expect(repository.recordSelection).not.toHaveBeenCalled();
        });

        test("Case: Should record a valid station selection", async () => {
            const sessionId = new Types.ObjectId().toString();
            const stationId = new Types.ObjectId().toString();
            const requestingUserId = new Types.ObjectId().toString();
            const updatedAt = new Date("2026-08-11T10:00:00.000Z");

            repository.findById.mockResolvedValue({
                userId: new Types.ObjectId(requestingUserId),
                candidates: [{ stationId: new Types.ObjectId(stationId) }],
            } as any);
            repository.recordSelection.mockResolvedValue({} as any);

            await service.recordSelection(
                sessionId,
                stationId,
                requestingUserId,
                updatedAt,
            );

            expect(repository.findById).toHaveBeenCalledWith(sessionId);
            expect(repository.recordSelection).toHaveBeenCalledWith(
                sessionId,
                stationId,
                updatedAt,
            );
        });
    });

    describe("getRecentSessions", () => {
        test("Case: Should return the user's recent sessions with the default limit", async () => {
            const userId = new Types.ObjectId().toString();
            const sessions = [{ _id: new Types.ObjectId() }];
            repository.findRecentByUser.mockResolvedValue(sessions as any);

            const result = await service.getRecentSessions(userId);

            expect(repository.findRecentByUser).toHaveBeenCalledWith(userId, 10);
            expect(result).toEqual(sessions);
        });

        test("Case: Should pass a custom limit to the repository", async () => {
            const userId = new Types.ObjectId().toString();
            repository.findRecentByUser.mockResolvedValue([]);

            await service.getRecentSessions(userId, 5);

            expect(repository.findRecentByUser).toHaveBeenCalledWith(userId, 5);
        });

        test("Case: Should reject an invalid user ID", async () => {
            await expect(
                service.getRecentSessions("invalid-user-id"),
            ).rejects.toThrow("Invalid user ID");
            expect(repository.findRecentByUser).not.toHaveBeenCalled();
        });

        test.each([0, -1, 1.5])(
            "Case: Should reject invalid limit %s",
            async (limit) => {
                const userId = new Types.ObjectId().toString();

                await expect(
                    service.getRecentSessions(userId, limit),
                ).rejects.toThrow("Limit must be a positive integer.");
                expect(repository.findRecentByUser).not.toHaveBeenCalled();
            },
        );
    });
});
