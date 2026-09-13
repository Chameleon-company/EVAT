import mongoose from 'mongoose';

import connectDB from '../src/config/database-config';
import { env } from '../src/config/env';

jest.setTimeout(10000);

describe("connectDB", () => {
    let connectSpy: jest.SpyInstance;

    afterEach(async () => {
        connectSpy?.mockRestore();
        jest.restoreAllMocks();
    });

    test('Case: Connect with URI from .env', async () => {
        process.env.MONGODB_URI = 'mongodb://test-host:27017/evat-test';
        connectSpy = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);

        await expect(connectDB()).resolves.not.toThrow();
        expect(connectSpy).toHaveBeenCalledWith(
            process.env.MONGODB_URI,
            expect.objectContaining({ useNewUrlParser: true, useUnifiedTopology: true })
        );
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
        connectSpy = jest.spyOn(mongoose, 'connect').mockRejectedValue(new Error('Invalid connection string'));

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
            "MongoDB connection error:",
            "Invalid connection string"
        );
        expect(processExitSpy).toHaveBeenCalledWith(1);

        process.env.MONGODB_URI = originalMongoUri; // Restore URI
        consoleSpy.mockRestore();
        processExitSpy.mockRestore();
    });
});