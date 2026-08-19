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
class ProfileRepository {
    /**
     * Find a user by input ID
     *
     * @param userId String: a specific users ID
     * @returns Profile: Returns the specified users profile
     */
    findByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield profile_model_1.default.findOne({ user_id: userId }).exec();
        });
    }
    /**
      * Create a new profile from the input data
      *
      * @param data Input a profile object that only has to contain some of the data
      * @returns Creates a new profile object
      */
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const newProfile = new profile_model_1.default(data);
            return yield newProfile.save();
        });
    }
    /**
     * Finds a user and updates their profile
     *
     * @param userId Input userID to change profile of
     * @param update Updated user profile
     * @returns Returns null if the command failed due to an invalid ID,
     */
    updateByUserId(userId, update) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield profile_model_1.default.findOneAndUpdate({ user_id: userId }, update, {
                new: true,
            }).exec();
        });
    }
}
exports.default = new ProfileRepository();
