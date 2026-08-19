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
class UserRepository {
    /**
     * Find a user by an input user ID
     *
     * @param userId Input: A users ID to find
     * @returns Returns a specific user based on the ID, or null if user was not found
     */
    findById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield user_model_1.default.findOne({ _id: userId }).exec();
        });
    }
    /**
     * Find a user by an input email
     *
     * @param email Input user's email
     * @returns Returns a specific user based on the email, or null if user was not found
     */
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield user_model_1.default.findOne({ email }).exec();
        });
    }
    /**
     * Function to find a user based on any input parameter
     *
     * @param filter Any parameter
     * @returns Returns a specific user based on any input parameter, or null if user was not found
     */
    findOne(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield user_model_1.default.findOne(filter).exec();
        });
    }
    /**
     * Find and return all users for the filter without the password data
     *
     * @param filter The filter to be used for the data
     * @returns all user data that fulfills the filter, without the password data
     */
    findAll() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            return yield user_model_1.default.find(filter).select("-password").exec();
        });
    }
    /**
    * Create a new user from the input data
    *
    * @param data Input a user object that only has to contain some of the data
    * @returns Creates a new user object
    */
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const newUser = new user_model_1.default(data);
            return yield newUser.save();
        });
    }
    /**
     * Updates a user in the database based on the filter and update data
     *
     * @param filter A filter used to identify the user to update
     * @param update An object containing the new fields to update
     * @returns Returns the updated user object if there was a change, or null if there was not a filter match
     */
    update(filter, update) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield user_model_1.default.findOneAndUpdate(filter, update, { new: true }).exec();
        });
    }
    /**
     * Delete a specific user by filter
     *
     * @param filter A filter to identify the user to delete
     * @returns Returns the deleted user data, or null if there was no match
     */
    delete(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield user_model_1.default.findOneAndDelete(filter).exec();
        });
    }
    /**
     * Update a users refresh token
     *
     * @param userId The user ID
     * @param refreshToken The new refresh token to store, or null to remove it
     * @param expiresAt The expiration date of the refresh token, or null to remove it
     * @returns Returns the updated user data
     */
    updateRefreshToken(userId, refreshToken, expiresAt) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield user_model_1.default.findByIdAndUpdate(userId, {
                refreshToken,
                refreshTokenExpiresAt: expiresAt,
            }, { new: true });
        });
    }
}
exports.default = new UserRepository();
