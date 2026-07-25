import ChargingStationService from "../../src/services/station-service";
import ChargingStationRepository from "../../src/repositories/station-repository";
import { StationFilterOptions } from "../../src/models/station-model";

// Mock the repository
jest.mock("../../src/repositories/station-repository");

describe("station-service", () => {
  let service: ChargingStationService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ChargingStationService();
  });

  describe("getAllStations", () => {
    test("Case: Returns all stations with no filters", async () => {
      // Arrange
      const options: StationFilterOptions = {};
      const mockStations = [{ id: "1", name: "Station 1" }, { id: "2", name: "Station 2" }];
      (ChargingStationRepository.findAll as jest.Mock).mockResolvedValue(mockStations);

      // Act
      const result = await service.getAllStations(options);

      // Assert
      expect(ChargingStationRepository.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockStations);
    });

    test("Case: Filters by connector types", async () => {
      // Arrange
      const options: StationFilterOptions = {
        connectorTypes: ["Type 1", "Type 2"]
      };
      const mockStations = [{ id: "1", name: "Station 1" }];
      (ChargingStationRepository.findAll as jest.Mock).mockResolvedValue(mockStations);

      // Act
      const result = await service.getAllStations(options);

      // Assert
      expect(ChargingStationRepository.findAll).toHaveBeenCalledWith({
        connection_type: {
          $in: expect.arrayContaining([expect.any(RegExp), expect.any(RegExp)])
        }
      });
      expect(result).toEqual(mockStations);
    });

    test("Case: Filters by charging currents", async () => {
      // Arrange
      const options: StationFilterOptions = {
        chargingCurrents: ["AC", "DC"]
      };
      const mockStations = [{ id: "1", name: "Station 1" }];
      (ChargingStationRepository.findAll as jest.Mock).mockResolvedValue(mockStations);

      // Act
      const result = await service.getAllStations(options);

      // Assert
      expect(ChargingStationRepository.findAll).toHaveBeenCalledWith({
        current_type: {
          $in: expect.arrayContaining([expect.any(RegExp), expect.any(RegExp)])
        }
      });
      expect(result).toEqual(mockStations);
    });

    test("Case: Filters by operators", async () => {
      // Arrange
      const options: StationFilterOptions = {
        operators: ["Blue Inc", "Red Inc"]
      };
      const mockStations = [{ id: "1", name: "Station 1" }];
      (ChargingStationRepository.findAll as jest.Mock).mockResolvedValue(mockStations);

      // Act
      const result = await service.getAllStations(options);

      // Assert
      expect(ChargingStationRepository.findAll).toHaveBeenCalledWith({
        operator: {
          $in: expect.arrayContaining([expect.any(RegExp), expect.any(RegExp)])
        }
      });
      expect(result).toEqual(mockStations);
    });

    test("Case: Filters by location", async () => {
      // Arrange
      const options: StationFilterOptions = {
        location: {
          latitude: -37.725743,
          longitude: 144.893414,
          radiusKm: 5
        }
      };
      const mockStations = [{ id: "1", name: "Station 1" }];
      (ChargingStationRepository.findAll as jest.Mock).mockResolvedValue(mockStations);

      // Act
      const result = await service.getAllStations(options);

      // Assert
      expect(ChargingStationRepository.findAll).toHaveBeenCalledWith({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [144.893414, -37.725743]
            },
            $maxDistance: 5000
          }
        }
      });
      expect(result).toEqual(mockStations);
    });

    test("Case: Combines multiple filters", async () => {
      // Arrange
      const options: StationFilterOptions = {
        connectorTypes: ["Type 1"],
        chargingCurrents: ["AC"],
        operators: ["Red Inc"],
        location: {
          latitude: -37.725743,
          longitude: 144.893414,
          radiusKm: 5
        }
      };
      const mockStations = [{ id: "1", name: "Station 1" }];
      (ChargingStationRepository.findAll as jest.Mock).mockResolvedValue(mockStations);

      // Act
      const result = await service.getAllStations(options);

      // Assert
      expect(ChargingStationRepository.findAll).toHaveBeenCalledWith({
        connection_type: { $in: expect.arrayContaining([expect.any(RegExp)]) },
        current_type: { $in: expect.arrayContaining([expect.any(RegExp)]) },
        operator: { $in: expect.arrayContaining([expect.any(RegExp)]) },
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [144.893414, -37.725743]
            },
            $maxDistance: 5000
          }
        }
      });
      expect(result).toEqual(mockStations);
    });
  });

  describe("getStationById", () => {
    test("Case: Returns a station when valid ID is provided", async () => {
      // Arrange
      const stationId = "123";
      const mockStation = { id: "123", name: "Test Station" };
      (ChargingStationRepository.findById as jest.Mock).mockResolvedValue(mockStation);

      // Act
      const result = await service.getStationById(stationId);

      // Assert
      expect(ChargingStationRepository.findById).toHaveBeenCalledWith(stationId);
      expect(result).toEqual(mockStation);
    });

    test("Case: Returns null when station is not found", async () => {
      // Arrange
      const stationId = "nonexistent";
      (ChargingStationRepository.findById as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.getStationById(stationId);

      // Assert
      expect(ChargingStationRepository.findById).toHaveBeenCalledWith(stationId);
      expect(result).toBeNull();
    });
  });

  describe("getStationsWithIdIn", () => {
    test("Case: Returns stations when valid IDs are provided", async () => {
      // Arrange
      const stationIds = ["123", "456"];
      const mockStations = [
        { id: "123", name: "Station 1" },
        { id: "456", name: "Station 2" }
      ];
      (ChargingStationRepository.findByIdIn as jest.Mock).mockResolvedValue(mockStations);

      // Act
      const result = await service.getStationsWithIdIn(stationIds);

      // Assert
      expect(ChargingStationRepository.findByIdIn).toHaveBeenCalledWith(stationIds);
      expect(result).toEqual(mockStations);
    });

    test("Case: Returns empty array when no stations are found", async () => {
      // Arrange
      const stationIds = ["nonexistent1", "nonexistent2"];
      (ChargingStationRepository.findByIdIn as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await service.getStationsWithIdIn(stationIds);

      // Assert
      expect(ChargingStationRepository.findByIdIn).toHaveBeenCalledWith(stationIds);
      expect(result).toEqual([]);
    });
  });

  describe("getNearestStation", () => {
    test("Case: Returns nearest station with location filter", async () => {
      // Arrange
      const options: StationFilterOptions = {
        location: {
          latitude: -37.725743,
          longitude: 144.893414
        }
      };
      const mockStation = { id: "1", name: "Nearest Station" };
      (ChargingStationRepository.findNearest as jest.Mock).mockResolvedValue(mockStation);

      // Act
      const result = await service.getNearestStation(options);

      // Assert
      expect(ChargingStationRepository.findNearest).toHaveBeenCalledWith({
        location: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [144.893414, -37.725743]
            }
          }
        }
      });
      expect(result).toEqual(mockStation);
    });

    test("Case: Returns nearest station with combined filters", async () => {
      // Arrange
      const options: StationFilterOptions = {
        connectorTypes: ["Type 1"],
        chargingCurrents: ["AC"],
        operators: ["Red Inc"],
        location: {
          latitude: -37.725743,
          longitude: 144.893414
        }
      };
      const mockStation = { id: "1", name: "Nearest Station" };
      (ChargingStationRepository.findNearest as jest.Mock).mockResolvedValue(mockStation);

      // Act
      const result = await service.getNearestStation(options);

      // Assert
      expect(ChargingStationRepository.findNearest).toHaveBeenCalledWith({
        connection_type: { $in: expect.arrayContaining([expect.any(RegExp)]) },
        current_type: { $in: expect.arrayContaining([expect.any(RegExp)]) },
        operator: { $in: expect.arrayContaining([expect.any(RegExp)]) },
        location: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [144.893414, -37.725743]
            }
          }
        }
      });
      expect(result).toEqual(mockStation);
    });

    test("Case: Returns null when no nearest station is found", async () => {
      // Arrange
      const options: StationFilterOptions = {
        location: {
          latitude: -37.725743,
          longitude: 144.893414
        }
      };
      (ChargingStationRepository.findNearest as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.getNearestStation(options);

      // Assert
      expect(ChargingStationRepository.findNearest).toHaveBeenCalledWith({
        location: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [144.893414, -37.725743]
            }
          }
        }
      });
      expect(result).toBeNull();
    });
  });
});