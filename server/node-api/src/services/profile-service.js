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
const profile_model_1 = __importDefault(require("../models/profile-model"));
const profile_repository_1 = __importDefault(require("../repositories/profile-repository"));
class ProfileService {
    /**
     * Updates or creates a user profile with a selected vehicle model
     * If the user profile doesn't exist, it creates one with the vehicle model
     * Otherwise, it updates the existing profile's car model
     *
     * @param userId The ID of the user | user_id (String), user_car_model (String), favourite_station (Array[String]), createdAt (Date), updatedAt (Date)
     * @param vehicleId The ID of the vehicle to associate with the user
     * @returns The created or updated profile
     */
    updateUserVehicleModel(userId, vehicleId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if there is an existing tracking for this userId
                const existingTracking = yield profile_repository_1.default.findByUserId(userId);
                if (!existingTracking) {
                    const newProfile = new profile_model_1.default();
                    newProfile.user_id = userId;
                    newProfile.user_car_model = vehicleId;
                    return yield profile_repository_1.default.create(newProfile);
                }
                else {
                    return yield profile_repository_1.default.updateByUserId(userId, {
                        // userCarModel: vehicleId, :removed as this calls the repo with an unknown key userCarModel wehn it should be user_car_model
                        user_car_model: vehicleId,
                    });
                }
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     * Adds a station to the user's list of favourite stations
     * If the user profile doesn't exist, it creates one and adds the station to the users favourite
     * else, it will append the station to the users list of favourite stations
     *
     * @param userId The ID of the user object | user_id (String), user_car_model (String), favourite_station (Array[String]), createdAt (Date), updatedAt (Date)
     * @param stationId The ID of the station to add to favourites
     * @returns The updated or created profile
     */
    addFavouriteStation(userId, stationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if there is an existing tracking for this userId
                const existingTracking = yield profile_repository_1.default.findByUserId(userId);
                if (!existingTracking) {
                    const newProfile = new profile_model_1.default();
                    newProfile.user_id = userId;
                    newProfile.favourite_stations = [stationId];
                    return yield profile_repository_1.default.create(newProfile);
                }
                else {
                    return yield profile_repository_1.default.updateByUserId(userId, {
                        $push: { favourite_stations: stationId },
                    });
                }
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     * Removes a station from the user's list of favourite stations
     * Throws an error if the user profile does not exist
     *
     * @param userId The ID of the user | user_id (String), user_car_model (String), favourite_station (Array[String]), createdAt (Date), updatedAt (Date)
     * @param stationId The ID of the station to add to favourites
     * @returns The updated profile
     */
    removeFavouriteStation(userId, stationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if there is an existing tracking for this userId
                const existingTracking = yield profile_repository_1.default.findByUserId(userId);
                if (!existingTracking) {
                    throw new Error(`The station tracking with userId = [${userId}] does not exist`);
                }
                else {
                    return yield profile_repository_1.default.updateByUserId(userId, {
                        $pull: { favourite_stations: stationId },
                    });
                }
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     * Retrieves the user's profile
     * If it doesn't exist, return a default object with empty values
     *
     * @param userId The ID of the user | user_id (String), user_car_model (String), favourite_station (Array[String]), createdAt (Date), updatedAt (Date)
     * @returns The user profile or a default profile object
     */
    getUserProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if there is an existing tracking for this userId
                const existingTracking = yield profile_repository_1.default.findByUserId(userId);
                if (!existingTracking) {
                    return {
                        user_id: userId,
                        user_car_model: null,
                        favourite_stations: [],
                        avatarURL: null,
                    };
                }
                else
                    return existingTracking;
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     * Retrieves the user's avatar
     * If it doesn't exist, return a default object with empty values
     *
     * @param userId The ID of the user | user_id (String)
     * @returns The user's avatar url
     */
    getAvatar(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const profile = yield profile_repository_1.default.findByUserId(userId);
                if (!profile)
                    return null;
                else
                    return profile.avatarURL;
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     * Changes the user's avatar
     * If it doesn't exist, return a default object with empty values
     *
     * @param userId The ID of the user
     * @param avatarURL The new avatar URL
     * @returns The user profile with the change
     */
    updateAvatar(userId, avatarURL) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const profile = yield profile_repository_1.default.findByUserId(userId);
                if (!profile)
                    return null;
                else {
                    profile.avatarURL = avatarURL;
                    yield profile.save();
                    return profile;
                }
            }
            catch (e) {
                throw e;
            }
        });
    }
}
exports.default = ProfileService;
