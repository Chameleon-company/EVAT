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
Object.defineProperty(exports, "__esModule", { value: true });
const user_profile_response_1 = require("../dtos/user-profile-response");
class ProfileController {
    constructor(userService, profileService, vehicleService, stationService, userStatsService) {
        this.userService = userService;
        this.profileService = profileService;
        this.vehicleService = vehicleService;
        this.stationService = stationService;
        this.userStatsService = userStatsService;
    }
    /**
     * Handles a request to get an authenticated user's profile
     *
     * @param req Request object containing the authenticated user
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    getUserProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user } = req;
            try {
                const response = new user_profile_response_1.UserProfileResponse(user === null || user === void 0 ? void 0 : user.id);
                const existingProfile = yield this.profileService.getUserProfile(user === null || user === void 0 ? void 0 : user.id);
                if (existingProfile.user_car_model) {
                    const existingVehicle = yield this.vehicleService.getVehicleById(existingProfile.user_car_model);
                    response.user_car_model = existingVehicle;
                }
                if (existingProfile.favourite_stations && existingProfile.favourite_stations.length > 0) {
                    const existingStations = yield this.stationService.getStationsWithIdIn(existingProfile.favourite_stations);
                    response.favourite_stations = existingStations;
                }
                if (existingProfile.avatarURL) {
                    response.avatarURL = existingProfile.avatarURL;
                }
                return res.status(201).json({
                    message: "success",
                    data: response,
                });
            }
            catch (error) {
                return res.status(400).json({ message: error.message });
            }
        });
    }
    /**
     * Handles a request to update the authenticated user's vehicle model
     *
     * @param req Request object containing the authenticated user and the vehicleId
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    updateUserVehicleModel(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { vehicleId } = req.body;
            const { user } = req;
            try {
                const existingUser = yield this.userService.getUserById(user === null || user === void 0 ? void 0 : user.id);
                if (!existingUser) {
                    return res.status(404).json({ message: "User not found" });
                }
                const existingVehicle = yield this.vehicleService.getVehicleById(vehicleId);
                if (!existingVehicle) {
                    return res.status(404).json({ message: "Vehicle not found" });
                }
                // Update the profile vehicle
                const updatedProfile = yield this.profileService.updateUserVehicleModel((user === null || user === void 0 ? void 0 : user.id) || "", vehicleId);
                // Trigger stats + achievements
                const statsResult = yield this.userStatsService.markProfileVehicleSet((user === null || user === void 0 ? void 0 : user.id) || "");
                return res.status(201).json({
                    message: "Update user vehicle model successfully",
                    data: {
                        profile: updatedProfile,
                        newAchievements: statsResult.newAchievements,
                    },
                });
            }
            catch (error) {
                return res.status(400).json({ message: error.message });
            }
        });
    }
    /**
     * Function to add a favourite charging station to a user
     *
     * @param req Request object containing the authenticated user and the station ID
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    addFavouriteStation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { stationId } = req.body;
            const { user } = req;
            try {
                const existingUser = yield this.userService.getUserById(user === null || user === void 0 ? void 0 : user.id);
                if (!existingUser) {
                    return res.status(404).json({ message: "User not found" });
                }
                const existingStation = yield this.stationService.getStationById(stationId);
                if (!existingStation) {
                    return res.status(404).json({ message: "Station not found" });
                }
                const updatedProfile = yield this.profileService.addFavouriteStation((user === null || user === void 0 ? void 0 : user.id) || "", stationId);
                // Trigger stats + achievements
                const statsResult = yield this.userStatsService.markFavouriteChargeSaved((user === null || user === void 0 ? void 0 : user.id) || "");
                return res.status(201).json({
                    message: "Add favourite station successfully",
                    data: {
                        profile: updatedProfile,
                        newAchievements: statsResult.newAchievements,
                    },
                });
            }
            catch (error) {
                return res.status(400).json({ message: error.message });
            }
        });
    }
    /**
     * Function to remove a favourite charging station to a user
     *
     * @param req Request object containing the authenticated user and the station ID
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    deleteFavouriteStation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { stationId } = req.body;
            const { user } = req;
            try {
                const existingUser = yield this.userService.getUserById(user === null || user === void 0 ? void 0 : user.id);
                if (!existingUser) {
                    return res.status(404).json({ message: "User not found" });
                }
                const updatedProfile = yield this.profileService.removeFavouriteStation((user === null || user === void 0 ? void 0 : user.id) || "", stationId);
                return res.status(201).json({
                    message: "Remove favourite station successfully",
                    data: updatedProfile,
                });
            }
            catch (error) {
                return res.status(400).json({ message: error.message });
            }
        });
    }
    /**
     * Function to get a users first and last names by their ID
     *
     * @param req Request object containing the user ID
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    getUsernameByID(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const { userID } = req.params;
            try {
                const foundUser = yield this.userService.getUserById(userID);
                if (foundUser == null) {
                    return res.status(404).json({
                        message: "User not found"
                    });
                }
                var returnData = {
                    firstName: (_b = (_a = foundUser === null || foundUser === void 0 ? void 0 : foundUser.firstName) !== null && _a !== void 0 ? _a : foundUser === null || foundUser === void 0 ? void 0 : foundUser.fullName) !== null && _b !== void 0 ? _b : "Unknown", // See IUser for details
                    lastName: (_c = foundUser === null || foundUser === void 0 ? void 0 : foundUser.lastName) !== null && _c !== void 0 ? _c : "" // If the user has a full name set then that will be displayed, other wise if they have neither first or last it will show as "Unknown"
                };
                console.log(typeof (returnData));
                return res.status(200).json({
                    message: "success",
                    data: returnData
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    /**
     * Function to get a users avatar
     *
     * @param req Request object containing the user ID
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    getUserAvatar(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const profile = yield this.profileService.getUserProfile(userId);
                if (!profile) {
                    return res.status(404).json({ message: "User profile not found" });
                }
                const avatarUrl = profile.avatarURL;
                if (!avatarUrl) {
                    return res.status(404).json({ message: "User avatar not found" });
                }
                return res.status(200).json({
                    message: "Avatar retrieved successfully",
                    data: { avatarURL: avatarUrl }
                });
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Server error" });
            }
        });
    }
    /**
     * Function to update the profiles image/avatar
     *
     * @param req Request object containing the user ID and avatar URL
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    updateAvatar(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userID = req.user.id;
                const { avatarURL } = req.body;
                if (!avatarURL) {
                    return res.status(400).json({ message: "avatarURL is required" });
                }
                // Update the profile picture
                const updatedProfile = yield this.profileService.updateAvatar(userID, avatarURL);
                if (!updatedProfile) {
                    return res.status(404).json({ message: "User profile not found" });
                }
                // Trigger stats + achievements
                const result = yield this.userStatsService.markProfilePicSet(userID);
                return res.status(200).json({
                    message: "Avatar updated successfully",
                    data: {
                        profile: updatedProfile,
                        stats: result.stats,
                        newAchievements: result.newAchievements
                    }
                });
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Server error" });
            }
        });
    }
}
exports.default = ProfileController;
