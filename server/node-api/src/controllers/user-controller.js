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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_item_response_1 = require("../dtos/user-item-response");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generate_token_1 = __importDefault(require("../utils/generate-token"));
class UserController {
    constructor(userService) {
        this.userService = userService;
    }
    /**
     * Registers a new user
     *
     * @param req Request object containing a full name, email and password
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data object of the user if the request was successful
     */
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password, firstName, lastName, mobile } = req.body;
            try {
                const user = yield this.userService.register(email, password, firstName, lastName, mobile);
                return res
                    .status(201)
                    .json({ message: "User registered successfully", data: user });
            }
            catch (error) {
                return res.status(400).json({ message: error.message });
            }
        });
    }
    /**
     * Function to be called to see if the user's access/refresh tokens are still valid
     *
     * @param req Request object containing the authorization header with the JWT
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code which will be used to deny or allow the user to skip the login screen
     */
    jwtLogin(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return res.status(401).json({ message: "No token provided" });
                }
                if (!process.env.JWT_SECRET) {
                    throw new Error("JWT_SECRET is not set in environment variables");
                }
                const token = authHeader.split(" ")[1];
                try {
                    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                    const user = yield this.userService.getUserById(decoded.id);
                    if (!user) {
                        return res.status(404).json({ message: "User not found" });
                    }
                    // Update last login
                    //user.lastLogin = new Date();
                    yield user.save();
                    return res.status(200).json({
                        message: "Automatic Login Successful",
                        data: {
                            user,
                            accessToken: token, // same one, still valid
                        },
                    });
                }
                catch (err) {
                    const decoded = jsonwebtoken_1.default.decode(token);
                    if (!(decoded === null || decoded === void 0 ? void 0 : decoded.id)) {
                        return res.status(401).json({ message: "Invalid token" });
                    }
                    const user = yield this.userService.getUserById(decoded.id);
                    if (!user || !user.refreshTokenExpiresAt) {
                        return res.status(404).json({ message: "User or refresh token not found" });
                    }
                    const nowUnix = Math.floor(Date.now() / 1000);
                    const refreshTokenExpiryUnix = Math.floor(new Date(user.refreshTokenExpiresAt).getTime() / 1000);
                    if (refreshTokenExpiryUnix > nowUnix) {
                        // if still valid, make a new AccessToken
                        const newAccessToken = (0, generate_token_1.default)(user, "1h");
                        // Update last login
                        //user.lastLogin = new Date();
                        yield user.save();
                        // OK status with data and a new AccessToken
                        return res.status(200).json({
                            message: "Automatic Login Successful",
                            data: {
                                user,
                                accessToken: newAccessToken,
                            },
                        });
                    }
                    else {
                        return res.status(401).json({ message: "Refresh token expired, please log in again" });
                    }
                }
            }
            catch (error) {
                console.error("jwtLogin error:", error);
                return res.status(500).json({ message: "Internal server error", error: error.message });
            }
        });
    }
    /**
     * Handles a login request
     *
     * @param req Request object containing an email and a password
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            try {
                const data = yield this.userService.authenticate(email, password);
                // ✅ Update lastLogin timestamp
                const userToUpdate = yield this.userService.getUserById(data.data._id);
                if (userToUpdate) {
                    userToUpdate.lastLogin = new Date();
                    yield userToUpdate.save();
                }
                const token = {
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                };
                return res.status(200).json({
                    message: "Login successful",
                    data: {
                        user: new user_item_response_1.UserItemResponse(data.data),
                        accessToken: token,
                    },
                });
            }
            catch (error) {
                return res.status(401).json({ message: error.message });
            }
        });
    }
    /**
     * Handles a request for a new access token
     *
     * @param req Request object containing an AccessToken
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message and a new AcessToken
     */
    refreshToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ message: "Refresh token is required" });
            }
            try {
                const { accessToken } = yield this.userService.refreshAccessToken(refreshToken);
                return res.status(200).json({
                    message: "Token refreshed successfully",
                    data: {
                        accessToken,
                    },
                });
            }
            catch (error) {
                return res.status(401).json({ message: error.message });
            }
        });
    }
    /**
     * Handles a request to get a user by ID
     *
     * @param req Request object containing the User ID
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    getUserById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user } = req;
            console.log("user", user);
            try {
                const existingUser = yield this.userService.getUserById(user === null || user === void 0 ? void 0 : user.id);
                if (!existingUser) {
                    return res.status(404).json({ message: "User not found" });
                }
                return res.status(200).json({
                    message: "success",
                    data: new user_item_response_1.UserItemResponse(existingUser),
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    /**
     * Handles adding/updating payment information for the user
     *
     * @param req Request object containing the User ID
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    // async updatePaymentInfo(req: Request, res: Response): Promise<Response> {
    //   const { user } = req;
    //   const { cardNumber, expiryDate, cvv, billingAddress } = req.body;
    //   try {
    //     if (!cardNumber || !expiryDate || !cvv) {
    //       return res.status(400).json({ message: "Missing payment fields" });
    //     }
    //     const updatedUser = await this.userService.addOrUpdatePaymentInfo(user.id, {
    //       cardNumber,
    //       expiryDate,
    //       cvv,
    //       billingAddress,
    //     });
    //     if (!updatedUser) {
    //     return res.status(404).json({ message: "Updated user not found" }); //handles warning for if theres no updated user
    //     }
    //     return res.status(200).json({
    //       message: "Payment information updated successfully",
    //       data: updatedUser.paymentInfo, // don’t send sensitive fields back
    //     });
    //   } catch (error: any) {
    //     return res.status(500).json({ message: error.message });
    //   }
    // }
    /**
     * Handles a request to get a user by an input email
     *
     * @param req Request object containing an email address
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    getUserByEmail(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email } = req.query;
            try {
                const existingUser = yield this.userService.getUserByEmail(email);
                if (!existingUser) {
                    return res.status(404).json({ message: "User not found" });
                }
                return res.status(200).json({
                    message: "success",
                    data: new user_item_response_1.UserItemResponse(existingUser),
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    /**
     * Handles a request to get all users (Admin only)
     *
     * @param req --Not used in this segment--
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    getAllUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingUsers = yield this.userService.getAllUser();
                return res.status(200).json({
                    message: "success",
                    data: existingUsers.map((u) => new user_item_response_1.UserItemResponse(u)),
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    /**
     * PUT /api/auth/profile
     * Update the authenticated user's own profile.
     */
    updateUserProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            try {
                const userIdFromToken = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
                const userId = String(userIdFromToken || ((_c = req.body) === null || _c === void 0 ? void 0 : _c.id));
                if (!userId)
                    return res.status(401).json({ message: "Unauthorized" });
                const _j = (req.body || {}), { role, password, refreshToken, refreshTokenExpiresAt } = _j, safeBody = __rest(_j, ["role", "password", "refreshToken", "refreshTokenExpiresAt"]);
                yield this.userService.updateSelf(userId, safeBody);
                const user = yield this.userService.getUserById(userId);
                if (!user)
                    return res.status(404).json({ message: "User not found" });
                const data = {
                    id: String((_d = user._id) !== null && _d !== void 0 ? _d : user.id),
                    firstName: String((_e = user.firstName) !== null && _e !== void 0 ? _e : ""),
                    lastName: String((_f = user.lastName) !== null && _f !== void 0 ? _f : ""),
                    email: String((_g = user.email) !== null && _g !== void 0 ? _g : ""),
                    mobile: String((_h = user.mobile) !== null && _h !== void 0 ? _h : "")
                };
                return res.status(200).json({ message: "success", data });
            }
            catch (e) {
                const msg = (e === null || e === void 0 ? void 0 : e.message) || "Bad request";
                const code = /No valid fields|already in use/i.test(msg) ? 400 : 500;
                return res.status(code).json({ message: msg });
            }
        });
    }
}
exports.default = UserController;
