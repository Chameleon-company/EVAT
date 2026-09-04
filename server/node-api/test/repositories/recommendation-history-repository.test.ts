import { Types } from "mongoose";
import RecommendationSession from "../../src/models/recommendation-history-model";
import RecommendationHistoryRepository from "../../src/repositories/recommendation-history-repository";

// Replace the Mongoose model with a Jest mock.
jest.mock("../../src/models/recommendation-history-model");

describe("recommendation-history-repository", () => {
    let repository: RecommendationHistoryRepository;

    beforeEach(() => {
        repository = new RecommendationHistoryRepository();
        jest.clearAllMocks();
    });

    describe("create", () => {
        test("Case: Should create and save a recommendation session", async () => {
            // Arrange
            // Mock up session data
            const sessionData = {
                userId: new Types.ObjectId("64a000000000000000000001"),
                userLocation: {
                    latitude: -37.8136,
                    longitude: 144.9631,
                },
                candidates: [],
                selection: {
                    stationId: null,
                    selectedAt: null,
                },
            };

            // Mock up what MongoDB would return upon saving a session
            const savedSession = {
                _id: new Types.ObjectId("64a000000000000000000002"),
                ...sessionData,
            };

            // Mock MongoDB's async save() method. Returns a promise that resolves to `savedSession`.
            const saveMock = jest.fn().mockResolvedValue(savedSession);

            (RecommendationSession as unknown as jest.Mock).mockImplementation(
                () => ({
                    // Return a fake session whose save() method is `saveMock`.
                    save: saveMock,
                }),
            );

            // Act
            const result = await repository.create(sessionData);

            // Assert
            expect(RecommendationSession).toHaveBeenCalledWith(sessionData);
            expect(saveMock).toHaveBeenCalledTimes(1);
            expect(result).toEqual(savedSession);
        });
    });

    describe("findById", () => {
        test("Case: Should find a recommendation session by ID", async () => {
            // Arrange
            const sessionId = "64a000000000000000000002";

            const mockSession = {
                _id: new Types.ObjectId(sessionId),
                userId: new Types.ObjectId("64a000000000000000000001"),
            };

            const execMock = jest.fn().mockResolvedValue(mockSession);

            (RecommendationSession.findById as jest.Mock).mockReturnValue({
                exec: execMock,
            });

            // Act
            const result = await repository.findById(sessionId);

            // Assert
            expect(RecommendationSession.findById).toHaveBeenCalledWith(
                sessionId,
            );
            expect(execMock).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockSession);
        });

        test("Case: Should return null if the session is not found", async () => {
            // Arrange
            const sessionId = "64a000000000000000000002";
            const execMock = jest.fn().mockResolvedValue(null);

            (RecommendationSession.findById as jest.Mock).mockReturnValue({
                exec: execMock,
            });

            // Act
            const result = await repository.findById(sessionId);

            // Assert
            expect(RecommendationSession.findById).toHaveBeenCalledWith(
                sessionId,
            );
            expect(execMock).toHaveBeenCalledTimes(1);
            expect(result).toBeNull();
        });
    });

    describe("findRecentByUser", () => {
        test("Case: Should find a user's recent sessions in newest-first order", async () => {
            // Arrange
            const userId = "64a000000000000000000001";
            const limit = 5;

            const mockSessions = [
                {
                    _id: new Types.ObjectId(
                        "64a000000000000000000002",
                    ),
                    userId: new Types.ObjectId(userId),
                },
                {
                    _id: new Types.ObjectId(
                        "64a000000000000000000003",
                    ),
                    userId: new Types.ObjectId(userId),
                },
            ];

            const execMock = jest.fn().mockResolvedValue(mockSessions);
            const limitMock = jest.fn().mockReturnValue({
                exec: execMock,
            });
            const sortMock = jest.fn().mockReturnValue({
                limit: limitMock,
            });

            (RecommendationSession.find as jest.Mock).mockReturnValue({
                sort: sortMock,
            });

            // Act
            const result = await repository.findRecentByUser(userId, limit);

            // Assert
            expect(RecommendationSession.find).toHaveBeenCalledWith({
                userId: new Types.ObjectId(userId),
            });
            expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
            expect(limitMock).toHaveBeenCalledWith(limit);
            expect(execMock).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockSessions);
        });

        test("Case: Should return an empty array if the user has no sessions", async () => {
            // Arrange
            const userId = "64a000000000000000000001";
            const limit = 5;

            const execMock = jest.fn().mockResolvedValue([]);
            const limitMock = jest.fn().mockReturnValue({
                exec: execMock,
            });
            const sortMock = jest.fn().mockReturnValue({
                limit: limitMock,
            });

            (RecommendationSession.find as jest.Mock).mockReturnValue({
                sort: sortMock,
            });

            // Act
            const result = await repository.findRecentByUser(userId, limit);

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe("recordSelection", () => {
        test("Case: Should record the station selected by the user", async () => {
            // Arrange
            const sessionId = "64a000000000000000000002";
            const stationId = "64a000000000000000000003";
            const selectedAt = new Date("2026-08-11T10:00:00.000Z");

            const updatedSession = {
                _id: new Types.ObjectId(sessionId),
                selection: {
                    stationId: new Types.ObjectId(stationId),
                    selectedAt,
                },
            };

            const execMock = jest.fn().mockResolvedValue(updatedSession);

            (
                RecommendationSession.findByIdAndUpdate as jest.Mock
            ).mockReturnValue({
                exec: execMock,
            });

            // Act
            const result = await repository.recordSelection(
                sessionId,
                stationId,
                selectedAt,
            );

            // Assert
            expect(
                RecommendationSession.findByIdAndUpdate,
            ).toHaveBeenCalledWith(
                sessionId,
                {
                    $set: {
                        "selection.stationId": new Types.ObjectId(stationId),
                        "selection.selectedAt": selectedAt,
                    },
                },
                {
                    new: true,
                    runValidators: true,
                },
            );

            expect(execMock).toHaveBeenCalledTimes(1);
            expect(result).toEqual(updatedSession);
        });

        test("Case: Should return null if the session is not found", async () => {
            // Arrange
            const sessionId = "64a000000000000000000002";
            const stationId = "64a000000000000000000003";
            const selectedAt = new Date("2026-08-11T10:00:00.000Z");

            const execMock = jest.fn().mockResolvedValue(null);

            (
                RecommendationSession.findByIdAndUpdate as jest.Mock
            ).mockReturnValue({
                exec: execMock,
            });

            // Act
            const result = await repository.recordSelection(
                sessionId,
                stationId,
                selectedAt,
            );

            // Assert
            expect(execMock).toHaveBeenCalledTimes(1);
            expect(result).toBeNull();
        });
    });
});