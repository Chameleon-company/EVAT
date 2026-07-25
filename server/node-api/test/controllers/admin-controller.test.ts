import { Request, Response } from 'express';
import {
    listUsers, deleteUser, updateUser, getLogs, getInsights,
} from '../../src/controllers/admin-controller';
import User from '../../src/models/user-model';
import Vehicle from '../../src/models/vehicle-model';

// Write tests using the AAA model https://automationpanda.com/2020/07/07/arrange-act-assert-a-pattern-for-writing-good-tests/

// Mock the User and Vehicle models
jest.mock('../../src/models/user-model', () => ({
    find: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
}));

jest.mock('../../src/models/vehicle-model', () => ({
    countDocuments: jest.fn(),
}));

describe('admin-controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        // Initialise mock request and response objects
        req = {
            params: {},
            body: {},
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(), // For chaining
        };
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe('listUsers', () => {
        test('Case: Return all users excluding passwords', async () => {
            // Arrange
            const mockUsers = [
                { id: '1', email: 'user1@example.com', password: 'password1' },
                { id: '2', email: 'user2@example.com', password: 'password2' },
            ];
            (User.find as jest.Mock).mockResolvedValue(mockUsers);
            // Act
            await listUsers(req as Request, res as Response);
            // Assert
            expect(User.find).toHaveBeenCalledWith({}, '-password');
            expect(res.json).toHaveBeenCalledWith(mockUsers);
        });
    });

    describe('deleteUser', () => {
        test('Case: Delete user by ID and return success message', async () => {
            // Arrange
            req.params = { id: '1' };
            (User.findByIdAndDelete as jest.Mock).mockResolvedValue({ message: 'User deleted' })
            // Act
            await deleteUser(req as Request, res as Response);
            // Assert
            expect(User.findByIdAndDelete).toHaveBeenCalledWith('1');
            expect(res.json).toHaveBeenCalledWith({ message: 'User deleted' })
        });
    });

    describe('updateUser', () => {
        test('Case: Update a user by ID and return the updated user', async () => {
            // Arrange
            req.params = { id: '1' };
            req.body = { email: 'newemail@example.com' };
            const updatedUser = { id: '1', email: 'newemail@example.com' };
            (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedUser);

            // Act
            await updateUser(req as Request, res as Response);

            // Assert
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith('1', { email: 'newemail@example.com' }, { new: true });
            expect(res.json).toHaveBeenCalledWith(updatedUser);
        });
    });

    describe('getLogs', () => {
        test('Case: Should return dummy logs', async () => {
            // Arrange
            const expectedLogs = [{ action: 'login', user: 'admin', timestamp: expect.any(Date) }];
            // Act
            await getLogs(req as Request, res as Response);
            // Assert
            expect(res.json).toHaveBeenCalledWith(expectedLogs);
        });
    });

    describe('getInsights', () => {
        test('Case: Return the total number of users and vehicles', async () => {
            // Arrange
            (User.countDocuments as jest.Mock).mockResolvedValue(10);
            (Vehicle.countDocuments as jest.Mock).mockResolvedValue(5);
            // Act
            await getInsights(req as Request, res as Response);
            // Assert
            expect(User.countDocuments).toHaveBeenCalled();
            expect(Vehicle.countDocuments).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ totalUsers: 10, totalVehicles: 5 });
        });
    });

});