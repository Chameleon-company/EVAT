import ChargingStationRepository from "../../src/repositories/station-repository";
import ChargingStation from "../../src/models/station-model";
import mongoose from "mongoose";

// Mock the ChargingStation model
jest.mock("../../src/models/station-model", () => {
    return {
        __esModule: true,
        default: {
            find: jest.fn(),
            findById: jest.fn(),
            findOne: jest.fn(),
        },
    };
});

describe("station-repository", () => {
    // Reset all mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("findAll", () => {
        test("Case: Returns all charging stations when no filter is provided", async () => {
            // Arrange
            const mockStations = [
                { _id: "station1", name: "Station 1" },
                { _id: "station2", name: "Station 2" },
            ];
            const mockExec = jest.fn().mockResolvedValue(mockStations);
            (ChargingStation.find as jest.Mock).mockReturnValue({ exec: mockExec });

            // Act
            const result = await ChargingStationRepository.findAll();

            // Assert
            expect(ChargingStation.find).toHaveBeenCalledWith({});
            expect(mockExec).toHaveBeenCalled();
            expect(result).toEqual(mockStations);
        });

        test("Case: Returns filtered charging stations when filter is provided", async () => {
            // Arrange
            const filter = { current_type: "AC" };
            const mockStations = [{ _id: "station1", name: "Station 1", current_type: "AC" }];
            const mockExec = jest.fn().mockResolvedValue(mockStations);
            (ChargingStation.find as jest.Mock).mockReturnValue({ exec: mockExec });

            // Act
            const result = await ChargingStationRepository.findAll(filter);

            // Assert
            expect(ChargingStation.find).toHaveBeenCalledWith(filter);
            expect(mockExec).toHaveBeenCalled();
            expect(result).toEqual(mockStations);
        });
    });

    describe("findById", () => {
        test("Case: Returns a charging station when valid ID is provided", async () => {
            // Arrange
            const stationId = "validStationId";
            const mockStation = { _id: stationId, name: "Valid Station" };
            const mockExec = jest.fn().mockResolvedValue(mockStation);
            (ChargingStation.findById as jest.Mock).mockReturnValue({ exec: mockExec });

            // Act
            const result = await ChargingStationRepository.findById(stationId);

            // Assert
            expect(ChargingStation.findById).toHaveBeenCalledWith(stationId);
            expect(mockExec).toHaveBeenCalled();
            expect(result).toEqual(mockStation);
        });

        test("Case: Returns null when station with ID does not exist", async () => {
            // Arrange
            const stationId = "nonExistentId";
            const mockExec = jest.fn().mockResolvedValue(null);
            (ChargingStation.findById as jest.Mock).mockReturnValue({ exec: mockExec });

            // Act
            const result = await ChargingStationRepository.findById(stationId);

            // Assert
            expect(ChargingStation.findById).toHaveBeenCalledWith(stationId);
            expect(mockExec).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });

    describe("findByIdIn", () => {
        test("Case: Returns multiple stations when valid IDs are provided", async () => {
            // Arrange
            const stationIds = ["station1", "station2"];
            const mockStations = [
                { _id: "station1", name: "Station 1" },
                { _id: "station2", name: "Station 2" },
            ];
            (ChargingStation.find as jest.Mock).mockResolvedValue(mockStations);

            // Act
            const result = await ChargingStationRepository.findByIdIn(stationIds);

            // Assert
            expect(ChargingStation.find).toHaveBeenCalledWith({
                _id: { $in: stationIds },
            });
            expect(result).toEqual(mockStations);
        });

        test("Case: Returns empty array when no matching stations found", async () => {
            // Arrange
            const stationIds = ["nonExistent1", "nonExistent2"];
            (ChargingStation.find as jest.Mock).mockResolvedValue([]);

            // Act
            const result = await ChargingStationRepository.findByIdIn(stationIds);

            // Assert
            expect(ChargingStation.find).toHaveBeenCalledWith({
                _id: { $in: stationIds },
            });
            expect(result).toEqual([]);
        });
    });

    describe("findNearest", () => {
        test("Case: Returns nearest charging station when no filter is provided", async () => {
            // Arrange
            const mockStation = { _id: "nearest", name: "Nearest Station" };
            const mockExec = jest.fn().mockResolvedValue(mockStation);
            (ChargingStation.findOne as jest.Mock).mockReturnValue({ exec: mockExec });

            // Act
            const result = await ChargingStationRepository.findNearest();

            // Assert
            expect(ChargingStation.findOne).toHaveBeenCalledWith({});
            expect(mockExec).toHaveBeenCalled();
            expect(result).toEqual(mockStation);
        });

        test("Case: Returns nearest charging station with filter criteria", async () => {
            // Arrange
            const filter = { is_operational: true };
            const mockStation = { _id: "nearestActive", name: "Nearest Active Station" };
            const mockExec = jest.fn().mockResolvedValue(mockStation);
            (ChargingStation.findOne as jest.Mock).mockReturnValue({ exec: mockExec });

            // Act
            const result = await ChargingStationRepository.findNearest(filter);

            // Assert
            expect(ChargingStation.findOne).toHaveBeenCalledWith(filter);
            expect(mockExec).toHaveBeenCalled();
            expect(result).toEqual(mockStation);
        });

        test("Case: Returns null when no station matches criteria", async () => {
            // Arrange
            const filter = { operator: "Green Co" };
            const mockExec = jest.fn().mockResolvedValue(null);
            (ChargingStation.findOne as jest.Mock).mockReturnValue({ exec: mockExec });

            // Act
            const result = await ChargingStationRepository.findNearest(filter);

            // Assert
            expect(ChargingStation.findOne).toHaveBeenCalledWith(filter);
            expect(mockExec).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });
});