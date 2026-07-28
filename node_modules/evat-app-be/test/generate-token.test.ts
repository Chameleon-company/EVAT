import jwt from "jsonwebtoken";
import { IUser } from "../src/models/user-model";
import generateToken from "../src/utils/generate-token";

describe('generateToken', () => {
    const createMockUser = (overrides: Partial<IUser> = {}): IUser => {
        const defaultUser: IUser = {
            id: "123",
            email: "test@example.com",
            password: "password123",
            fullName: "Test User",
            role: "user",
            refreshToken: null,
            refreshTokenExpiresAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        } as IUser;
        return defaultUser;
    };

    beforeEach(() => {
        // Reset the process.env and re-define JWT_SECRET before each test
        jest.resetModules();
        process.env.JWT_SECRET = "testsecret";
    });

    test('Case: Create JWT token with correct input', () => {
        const user = createMockUser();
        const token = generateToken(user);
        const decoded = jwt.verify(token, "testsecret") as {
            id: string;
            email: string;
            role: string;
            iat: number;
            exp: number;
        };
        expect(decoded.id).toBe(user.id);
        expect(decoded.email).toBe(user.email);
        expect(decoded.role).toBe(user.role);
    });

    test('Case: Default JWT expiry of 1 day', () => {
        const user = createMockUser();
        const token = generateToken(user);
        const decoded = jwt.verify(token, "testsecret") as { exp: number };
        const now = Math.floor(Date.now() / 1000);
        expect(decoded.exp - now).toBeCloseTo(86400, 2);
    });

    test('Case: Generate a token with the specified expiry period', () => {
        const user = createMockUser();
        const period = "2h";
        const token = generateToken(user, period);
        const decoded = jwt.verify(token, "testsecret") as { exp: number };
        const now = Math.floor(Date.now() / 1000);
        expect(decoded.exp - now).toBeCloseTo(7200, 1);
    });

    test('Caste: Throw an error if JWT_SECRET is not defined', () => {
        // Temporarily delete JWT_SECRET
        const originalSecret = process.env.JWT_SECRET; // store old secret
        delete process.env.JWT_SECRET;
        try {
            const user = createMockUser();
            expect(() => generateToken(user)).toThrow(
                "JWT_SECRET is not defined in the environment variables."
            );
        } finally {
            process.env.JWT_SECRET = originalSecret; // restore secret
        }
    });
});