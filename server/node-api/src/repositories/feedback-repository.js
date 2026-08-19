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
const feedback_model_1 = __importDefault(require("../models/feedback-model"));
class FeedbackRepository {
    /**
     * Find a feedback by an input feedback ID
     *
     * @param feedbackId Input: A feedback ID to find
     * @returns Returns a specific feedback based on the ID, or null if feedback was not found
     */
    findById(feedbackId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield feedback_model_1.default.findOne({ _id: feedbackId }).exec();
        });
    }
    /**
     * Find feedbacks by email
     *
     * @param email Input user's email
     * @returns Returns feedbacks based on the email, or empty array if no feedbacks found
     */
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield feedback_model_1.default.find({ email }).exec();
        });
    }
    /**
     * Function to find a feedback based on any input parameter
     *
     * @param filter Any parameter
     * @returns Returns a specific feedback based on any input parameter, or null if feedback was not found
     */
    findOne(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield feedback_model_1.default.findOne(filter).exec();
        });
    }
    /**
     * Find and return all feedbacks for the filter
     *
     * @param filter The filter to be used for the data
     * @returns all feedback data that fulfills the filter
     */
    findAll() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            return yield feedback_model_1.default.find(filter).sort({ createdAt: -1 }).exec();
        });
    }
    /**
     * Find feedbacks with pagination
     *
     * @param filter The filter to be used for the data
     * @param page Page number (default: 1)
     * @param limit Number of items per page (default: 10)
     * @returns Object containing feedbacks and pagination info
     */
    findWithPagination() {
        return __awaiter(this, arguments, void 0, function* (filter = {}, page = 1, limit = 10) {
            const skip = (page - 1) * limit;
            const [feedbacks, total] = yield Promise.all([
                feedback_model_1.default.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
                feedback_model_1.default.countDocuments(filter).exec()
            ]);
            return {
                feedbacks,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
        });
    }
    /**
     * Create a new feedback from the input data
     *
     * @param data Input a feedback object that only has to contain some of the data
     * @returns Creates a new feedback object
     */
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const newFeedback = new feedback_model_1.default(data);
            return yield newFeedback.save();
        });
    }
    /**
     * Updates a feedback in the database based on the filter and update data
     *
     * @param filter A filter used to identify the feedback to update
     * @param update An object containing the new fields to update
     * @returns Returns the updated feedback object if there was a change, or null if there was not a filter match
     */
    update(filter, update) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield feedback_model_1.default.findOneAndUpdate(filter, update, { new: true }).exec();
        });
    }
    /**
     * Delete a specific feedback by filter
     *
     * @param filter A filter to identify the feedback to delete
     * @returns Returns the deleted feedback data, or null if there was no match
     */
    delete(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield feedback_model_1.default.findOneAndDelete(filter).exec();
        });
    }
    /**
     * Get feedback statistics
     *
     * @returns Object containing feedback statistics
     */
    getStatistics() {
        return __awaiter(this, void 0, void 0, function* () {
            const [total, pending, reviewed, resolved] = yield Promise.all([
                feedback_model_1.default.countDocuments().exec(),
                feedback_model_1.default.countDocuments({ status: "pending" }).exec(),
                feedback_model_1.default.countDocuments({ status: "reviewed" }).exec(),
                feedback_model_1.default.countDocuments({ status: "resolved" }).exec()
            ]);
            return { total, pending, reviewed, resolved };
        });
    }
}
exports.default = new FeedbackRepository();
