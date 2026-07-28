import * as adminController from '../../src/controllers/admin-auth-controller';
import Admin from '../../src/models/admin';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// Mock dependencies
jest.mock('../../src/models/admin');
jest.mock('jsonwebtoken');
jest.mock('nodemailer', () => { // Mock the whole module since other methods don't work
    const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
    return {
        createTransport: jest.fn().mockReturnValue({
            sendMail: mockSendMail,
        }),
        mockSendMail // Add this line to export the mockSendMail
    };
});
jest.mock('dotenv', () => ({
    config: jest.fn()
}));

describe('admin-auth-controller', () => {
    // Mock request and response objects
    let req: any;
    let res: any;
    let mockAdmin: any;
    let mockSendMail: jest.Mock;
    let mockTransporter: any;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Mock response object with spies
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Mock request object
        req = {
            body: {}
        };

        // Mock admin model
        mockAdmin = {
            username: 'testuser',
            password: 'password123',
            twoFactorCode: '',
            twoFactorCodeExpiry: new Date(),
            save: jest.fn().mockResolvedValue(true)
        };

        (Admin.findOne as jest.Mock).mockResolvedValue(mockAdmin);

        // Mock nodemailer transport and sendMail function
        mockSendMail = (nodemailer as any).mockSendMail; // Access the mockSendMail
        mockTransporter = {
            sendMail: mockSendMail
        };


        // Mock environment variables
        process.env.EMAIL_USER = 'test@example.com';
        process.env.EMAIL_PASS = 'testpass';
        process.env.ADMIN_EMAIL = 'admin@example.com';
        process.env.JWT_SECRET = 'testsecret';
    });

    describe('adminLogin', () => {
        test('Case: Return 401 for invalid credentials', async () => {
            // Arrange
            req.body = { username: 'invalid', password: 'wrong' };
            (Admin.findOne as jest.Mock).mockResolvedValue(null);

            // Act
            await adminController.adminLogin(req, res);

            // Assert
            expect(Admin.findOne).toHaveBeenCalledWith({ username: 'invalid' });
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid admin credentials' });
        });

        test('Case: Return 401 when password does not match', async () => {
            // Arrange
            req.body = { username: 'testuser', password: 'wrong' };
            (Admin.findOne as jest.Mock).mockResolvedValue({
                ...mockAdmin,
                password: 'correctpassword'
            });

            // Act
            await adminController.adminLogin(req, res);

            // Assert
            expect(Admin.findOne).toHaveBeenCalledWith({ username: 'testuser' });
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid admin credentials' });
        });

        test('Case: 2FA code sent when credentials are valid', async () => {
            // Arrange
            // Mock Math.random for consistent testing
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(0.5); // Will generate code 550000

            req.body = { username: 'testuser', password: 'password123' };

            // Act
            await adminController.adminLogin(req, res);

            // Assert
            expect(Admin.findOne).toHaveBeenCalledWith({ username: 'testuser' });
            expect(mockAdmin.twoFactorCode).toBe('550000');
            expect(mockAdmin.save).toHaveBeenCalled();

            // Check that the email was sent
            expect(mockSendMail).toHaveBeenCalled();


            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Verification code sent to admin email' });

            // Restore Math.random
            Math.random = originalRandom;
        });

        test('Case: Handle server errors', async () => {
            // Arrange
            req.body = { username: 'testuser', password: 'password123' };
            const error = new Error('Database error');
            (Admin.findOne as jest.Mock).mockRejectedValue(error);

            // Spy on console.error
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Act
            await adminController.adminLogin(req, res);

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith('Login error:', error);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });

            // Restore console.error
            consoleSpy.mockRestore();
        });
    });

    describe('verifyAdmin2FA', () => {
        test('Case: Return 404 when admin is not found', async () => {
            // Arrange
            req.body = { username: 'nonexistent', code: '123456' };
            (Admin.findOne as jest.Mock).mockResolvedValue(null);

            // Act
            await adminController.verifyAdmin2FA(req, res);

            // Assert
            expect(Admin.findOne).toHaveBeenCalledWith({ username: 'nonexistent' });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Admin not found' });
        });

        test('Case: Return 403 when verification code is invalid', async () => {
            // Arrange
            req.body = { username: 'testuser', code: '123456' };
            (Admin.findOne as jest.Mock).mockResolvedValue({
                ...mockAdmin,
                twoFactorCode: '654321'
            });

            // Act
            await adminController.verifyAdmin2FA(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired verification code' });
        });

        test('Case: Return 403 when verification code is expired', async () => {
            // Arrange
            req.body = { username: 'testuser', code: '123456' };
            const expiredDate = new Date();
            expiredDate.setMinutes(expiredDate.getMinutes() - 10); // 10 minutes in the past

            (Admin.findOne as jest.Mock).mockResolvedValue({
                ...mockAdmin,
                twoFactorCode: '123456',
                twoFactorCodeExpiry: expiredDate
            });

            // Act
            await adminController.verifyAdmin2FA(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired verification code' });
        });

        test('Case: Return JWT token when verification is successful', async () => {
            // Arrange
            req.body = { username: 'testuser', code: '123456' };
            const validDate = new Date();
            validDate.setMinutes(validDate.getMinutes() + 3); // 3 minutes in the future

            (Admin.findOne as jest.Mock).mockResolvedValue({
                ...mockAdmin,
                twoFactorCode: '123456',
                twoFactorCodeExpiry: validDate
            });

            const mockToken = 'valid.jwt.token';
            (jwt.sign as jest.Mock).mockReturnValue(mockToken);

            // Act
            await adminController.verifyAdmin2FA(req, res);

            // Assert
            expect(jwt.sign).toHaveBeenCalledWith({ admin: true }, 'testsecret', { expiresIn: '1d' });
            expect(mockAdmin.twoFactorCode).toBe('');
            expect(mockAdmin.twoFactorCodeExpiry).toEqual(expect.any(Date));
            expect(mockAdmin.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ token: mockToken });
        });

        test('Case: Handle server errors', async () => {
            // Arrange
            req.body = { username: 'testuser', code: '123456' };
            const error = new Error('Database error');
            (Admin.findOne as jest.Mock).mockRejectedValue(error);

            // Spy on console.error
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Act
            await adminController.verifyAdmin2FA(req, res);

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith('2FA verification error:', error);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });

            // Restore console.error
            consoleSpy.mockRestore();
        });
    });

    describe('updateAdminCredentials', () => {
        test('Case: Return 404 when admin is not found', async () => {
            // Arrange
            req.body = { username: 'newuser', password: 'newpass' };
            (Admin.findOne as jest.Mock).mockResolvedValue(null);

            // Act
            await adminController.updateAdminCredentials(req, res);

            // Assert
            expect(Admin.findOne).toHaveBeenCalledWith({});
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Admin not found' });
        });

        test('Case: Updates admin username', async () => {
            // Arrange
            req.body = { username: 'newuser' };

            // Act
            await adminController.updateAdminCredentials(req, res);

            // Assert
            expect(mockAdmin.username).toBe('newuser');
            expect(mockAdmin.password).toBe('password123'); // Unchanged
            expect(mockAdmin.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Admin credentials updated' });
        });

        test('Case: Should updates admin password', async () => {
            // Arrange
            req.body = { password: 'newpassword' };

            // Act
            await adminController.updateAdminCredentials(req, res);

            // Assert
            expect(mockAdmin.username).toBe('testuser'); // Unchanged
            expect(mockAdmin.password).toBe('newpassword');
            expect(mockAdmin.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Admin credentials updated' });
        });

        test('Case: Update both username and password', async () => {
            // Arrange
            req.body = { username: 'newuser', password: 'newpassword' };

            // Act
            await adminController.updateAdminCredentials(req, res);

            // Assert
            expect(mockAdmin.username).toBe('newuser');
            expect(mockAdmin.password).toBe('newpassword');
            expect(mockAdmin.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Admin credentials updated' });
        });

        test('Case: Handles server errors gracefully', async () => {
            // Arrange
            req.body = { username: 'newuser', password: 'newpassword' };
            const error = new Error('Database error');
            (Admin.findOne as jest.Mock).mockRejectedValue(error);

            // Spy on console.error
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Act
            await adminController.updateAdminCredentials(req, res);

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith('Credential update error:', error);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });

            // Restore console.error
            consoleSpy.mockRestore();
        });
    });
});
