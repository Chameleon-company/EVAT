import mongoose from 'mongoose';
import Vehicle, { IVehicle } from '../../src/models/vehicle-model';
import vehicleRepository from '../../src/repositories/vehicle-repository';

// Mock the Vehicle model
jest.mock('../../src/models/vehicle-model', () => {
    return {
        findById: jest.fn(),
        find: jest.fn(),
    };
});

describe('VehicleRepository', () => {
    // Reset all mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findById', () => {
        test('Case: Successfully retrieves a vehicle by ID', async () => {
            // Arrange
            const mockVehicleId = '6714c0';
            const mockVehicle = {
                _id: mockVehicleId,
                make: 'Toyota',
                model: 'Camry',
                model_release_year: 2020,
            };

            // Mock the exec function to return our mock vehicle
            const mockExec = jest.fn().mockResolvedValue(mockVehicle);
            (Vehicle.findById as jest.Mock).mockReturnValue({ exec: mockExec });

            // Act
            const result = await vehicleRepository.findById(mockVehicleId);

            // Assert
            expect(Vehicle.findById).toHaveBeenCalledWith(mockVehicleId);
            expect(mockExec).toHaveBeenCalled();
            expect(result).toEqual(mockVehicle);
        });

        test('Case: Returns null when no vehicle is found', async () => {
            // Arrange
            const mockVehicleId = 'nonexistent-id';

            // Mock the exec function to return null
            const mockExec = jest.fn().mockResolvedValue(null);
            (Vehicle.findById as jest.Mock).mockReturnValue({ exec: mockExec });

            // Act
            const result = await vehicleRepository.findById(mockVehicleId);

            // Assert
            expect(Vehicle.findById).toHaveBeenCalledWith(mockVehicleId);
            expect(mockExec).toHaveBeenCalled();
            expect(result).toBeNull();
        });

        test('Case: Throws error when database operation fails', async () => {
            // Arrange
            const mockVehicleId = '6e8552';
            const mockError = new Error('Database error');

            // Mock the exec function to throw an error
            const mockExec = jest.fn().mockRejectedValue(mockError);
            (Vehicle.findById as jest.Mock).mockReturnValue({ exec: mockExec });

            // Act & Assert
            await expect(vehicleRepository.findById(mockVehicleId)).rejects.toThrow('Database error');
            expect(Vehicle.findById).toHaveBeenCalledWith(mockVehicleId);
            expect(mockExec).toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        test('Case: Successfully retrieves all vehicles with no filter', async () => {
            // Arrange
            const mockVehicles = [
                { _id: '6c5b36', make: 'Toyota', model: 'Camry', model_release_year: 2020 },
                { _id: '8724f9', make: 'Honda', model: 'Civic', model_release_year: 2019 },
            ];

            // Mock the exec function to return our mock vehicles
            const mockExec = jest.fn().mockResolvedValue(mockVehicles);
            (Vehicle.find as jest.Mock).mockReturnValue({ exec: mockExec });

            // Act
            const result = await vehicleRepository.findAll();

            // Assert
            expect(Vehicle.find).toHaveBeenCalledWith({});
            expect(mockExec).toHaveBeenCalled();
            expect(result).toEqual(mockVehicles);
        });

        test('Case: Successfully retrieves vehicles with specific filter', async () => {
            // Arrange
            const mockFilter = { make: 'Toyota' };
            const mockVehicles = [
                { _id: '6c5b36', make: 'Toyota', model: 'Camry', model_release_year: 2020 },
                { _id: '8724f9', make: 'Toyota', model: 'Corolla', model_release_year: 2021 },
            ];

            // Mock the exec function to return our filtered mock vehicles
            const mockExec = jest.fn().mockResolvedValue(mockVehicles);
            (Vehicle.find as jest.Mock).mockReturnValue({ exec: mockExec });

            // Act
            const result = await vehicleRepository.findAll(mockFilter);

            // Assert
            expect(Vehicle.find).toHaveBeenCalledWith(mockFilter);
            expect(mockExec).toHaveBeenCalled();
            expect(result).toEqual(mockVehicles);
        });

        test('Case: Returns empty array when no vehicles match filter', async () => {
            // Arrange
            const mockFilter = { make: 'Nonexistent' };

            // Mock the exec function to return an empty array
            const mockExec = jest.fn().mockResolvedValue([]);
            (Vehicle.find as jest.Mock).mockReturnValue({ exec: mockExec });

            // Act
            const result = await vehicleRepository.findAll(mockFilter);

            // Assert
            expect(Vehicle.find).toHaveBeenCalledWith(mockFilter);
            expect(mockExec).toHaveBeenCalled();
            expect(result).toEqual([]);
        });

        test('Case: Throws error when database operation fails', async () => {
            // Arrange
            const mockError = new Error('Database error');

            // Mock the exec function to throw an error
            const mockExec = jest.fn().mockRejectedValue(mockError);
            (Vehicle.find as jest.Mock).mockReturnValue({ exec: mockExec });

            // Act & Assert
            await expect(vehicleRepository.findAll()).rejects.toThrow('Database error');
            expect(Vehicle.find).toHaveBeenCalledWith({});
            expect(mockExec).toHaveBeenCalled();
        });
    });
});