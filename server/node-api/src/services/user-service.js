"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = __importDefault(require("../models/user-model"));
const user_repository_1 = __importDefault(require("../repositories/user-repository"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const generate_token_1 = __importDefault(require("../utils/generate-token"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class UserService {
    // Register a new user
    register(email, password, firstName, lastName, mobile) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate mobile if provided
                if (mobile && !/^04\d{8}$/.test(mobile)) {
                    throw new Error("Mobile number must be in Australian format (04XXXXXXXX)");
                }
                // Check if there is an existing user with the given email
                const existingUser = yield user_repository_1.default.findByEmail(email);
                if (existingUser) {
                    throw new Error(`The auth account with email = [${email}] has already existed`);
                }
                // Hash password
                const hashPass = yield this.hashPassword(password);
                const newUser = new user_model_1.default();
                newUser.email = email;
                newUser.password = hashPass;
                newUser.firstName = firstName;
                newUser.lastName = lastName;
                if (mobile)
                    newUser.mobile = mobile;
                return yield user_repository_1.default.create(newUser);
            }
            catch (e) {
                // Safely handle error if it's an instance of Error
                if (e instanceof Error) {
                    throw new Error("Error during user registration: " + e.message);
                }
                else {
                    throw new Error("An unknown error occurred during registration.");
                }
            }
        });
    }
    authenticate(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingUser = yield user_repository_1.default.findByEmail(email);
                if (existingUser) {
                    if (bcryptjs_1.default.compareSync(password, existingUser.password)) {
                        // Generate tokens
                        const accessToken = (0, generate_token_1.default)(existingUser, "1d");
                        const refreshToken = (0, generate_token_1.default)(existingUser, "1d");
                        // Save refresh token to database
                        const refreshTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
                        yield user_repository_1.default.updateRefreshToken(existingUser.id, refreshToken, refreshTokenExpiresAt);
                        return {
                            data: existingUser,
                            accessToken,
                            refreshToken
                        };
                    }
                    else {
                        throw new Error(`Invalid password for email = [${email}]`);
                    }
                }
                else {
                    throw new Error(`The account with email = [${email}] does not exist`);
                }
            }
            catch (e) {
                if (e instanceof Error) {
                    throw new Error("Authentication failed: " + e.message);
                }
                else {
                    throw new Error("An unknown error occurred during authentication.");
                }
            }
        });
    }
    refreshAccessToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Verify the refresh token
                const secret = process.env.JWT_SECRET;
                if (!secret) {
                    throw new Error("JWT_SECRET is not defined");
                }
                const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_SECRET);
                // Find user and check if refresh token is valid
                const user = yield user_repository_1.default.findById(decoded.id);
                if (!user || user.refreshToken !== refreshToken) {
                    throw new Error("Invalid refresh token");
                }
                // Check if refresh token is expired
                if (user.refreshTokenExpiresAt &&
                    user.refreshTokenExpiresAt < new Date()) {
                    throw new Error("Refresh token has expired");
                }
                // Generate new tokens
                const newAccessToken = (0, generate_token_1.default)(user, "1d");
                const newRefreshToken = (0, generate_token_1.default)(user, "1d");
                // Update refresh token in database
                const refreshTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                yield user_repository_1.default.updateRefreshToken(user.id, newRefreshToken, refreshTokenExpiresAt);
                return {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                };
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Failed to refresh token: " + error.message);
                }
                throw new Error("An unknown error occurred while refreshing token");
            }
        });
    }
    getAllUser() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield user_repository_1.default.findAll();
        });
    }
    getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield user_repository_1.default.findOne({ _id: userId });
        });
    }
    getUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield user_repository_1.default.findOne({ email });
        });
    }
    // Hash password
    hashPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            const salt = yield bcryptjs_1.default.genSalt();
            const hashPassword = yield bcryptjs_1.default.hash(password, salt);
            return hashPassword;
        });
    }
    /**
     * Partially update the authenticated user's own profile.
     */
    updateSelf(userId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const allowed = {};
            if (typeof updates.firstName === "string")
                allowed.firstName = updates.firstName.trim();
            if (typeof updates.lastName === "string")
                allowed.lastName = updates.lastName.trim();
            if (typeof updates.mobile === "string")
                allowed.mobile = updates.mobile.trim();
            if (typeof updates.email === "string") {
                const email = updates.email.trim().toLowerCase();
                const existing = yield user_repository_1.default.findOne({ email });
                if (existing && String(existing._id) !== String(userId)) {
                    throw new Error("Email is already in use");
                }
                allowed.email = email;
            }
            if (Object.keys(allowed).length === 0) {
                throw new Error("No valid fields to update");
            }
            const updated = yield user_repository_1.default.update({ _id: userId }, { $set: allowed });
            return updated;
        });
    }
}
exports.default = UserService;
