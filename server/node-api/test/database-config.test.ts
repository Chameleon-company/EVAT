import mongoose from 'mongoose';
import connectDB from '../src/config/database-config';
import dotenv from 'dotenv';

dotenv.config();
jest.setTimeout(10000);

describe("connectDB", () => {

    afterEach(async () => {
        try {
            await mongoose.disconnect();
        } catch (error) {
            // Handle errors during disconnection, if necessary
            console.error('Error disconnecting from MongoDB:', error);
        }
    });

    test('Case: Connect with URI from .env', async () => {
        // Check if MONGODB_URI is defined
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI must be defined in .env for this test');
        }
        // Call connectDB, should have no errors
        await expect(connectDB()).resolves.not.toThrow();

        // Check the connection
        expect(mongoose.connection.readyState).toBe(1); // 1 means connected;
    });

    test('Case: Throw an error if MONGODB_URI is undefined', async () => {
        // Store the original URI
        const originalMongoUri = process.env.MONGODB_URI;
        delete process.env.MONGODB_URI; // Unset the URI, forcing the error

        // Catch to handle the process.exit(1)
        let errorThrown = false;
        const consoleSpy = jest.spyOn(console, 'log');
        const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
            errorThrown = true; // set a flag.
            throw new Error("process.exit() was called"); // Throw an error to prevent test from continuing.
        }) as any);


        try {
            await connectDB();
        } catch (e) {
            // Expected error.  Do nothing.
        }

        expect(errorThrown).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith(
            "MongoDB connection error:",
            "MongoDB URI is not defined"
        );
        expect(processExitSpy).toHaveBeenCalledWith(1);

        // Restore the original value
        process.env.MONGODB_URI = originalMongoUri;
        consoleSpy.mockRestore();
        processExitSpy.mockRestore();
    });

    test('Case: Should handle a malformed URI and exit', async () => {
        const originalMongoUri = process.env.MONGODB_URI;
        process.env.MONGODB_URI = 'mongodb+srv://invalid-url.example.com'; // Set to an invalid URI

        let errorThrown = false;
        const consoleSpy = jest.spyOn(console, 'log');
        const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
            errorThrown = true;
            throw new Error("process.exit() was called");
        }) as any);

        try {
            await connectDB();
        } catch (e) {
            // Expected error. Do Nothing.
        }
        expect(errorThrown).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith(
            "An unknown error occurred"
        );
        expect(processExitSpy).toHaveBeenCalledWith(1);

        process.env.MONGODB_URI = originalMongoUri; // Restore URI
        consoleSpy.mockRestore();
        processExitSpy.mockRestore();
    });
});