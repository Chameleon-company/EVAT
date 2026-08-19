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
const feedback_repository_1 = __importDefault(require("../repositories/feedback-repository"));
class FeedbackService {
    /**
     * Create a new feedback
     *
     * @param name User's name
     * @param email User's email
     * @param suggestion User's feedback/suggestion
     * @returns Created feedback object
     */
    createFeedback(name, email, suggestion) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate input
                if (!name || !email || !suggestion) {
                    throw new Error("Name, email, and suggestion are required");
                }
                if (name.length > 100) {
                    throw new Error("Name cannot exceed 100 characters");
                }
                if (email.length > 255) {
                    throw new Error("Email cannot exceed 255 characters");
                }
                if (suggestion.length > 1000) {
                    throw new Error("Suggestion cannot exceed 1000 characters");
                }
                // Validate email format
                const emailRegex = /^\S+@\S+\.\S+$/;
                if (!emailRegex.test(email)) {
                    throw new Error("Please enter a valid email address");
                }
                const feedbackData = {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    suggestion: suggestion.trim(),
                    status: "pending"
                };
                return yield feedback_repository_1.default.create(feedbackData);
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error creating feedback: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while creating feedback");
                }
            }
        });
    }
    /**
     * Get all feedbacks with optional pagination
     *
     * @param page Page number (default: 1)
     * @param limit Number of items per page (default: 10)
     * @param status Filter by status (optional)
     * @returns Object containing feedbacks and pagination info
     */
    getAllFeedbacks() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10, status) {
            try {
                const filter = {};
                if (status && ["pending", "reviewed", "resolved"].includes(status)) {
                    filter.status = status;
                }
                return yield feedback_repository_1.default.findWithPagination(filter, page, limit);
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error retrieving feedbacks: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while retrieving feedbacks");
                }
            }
        });
    }
    /**
     * Get feedback by ID
     *
     * @param feedbackId Feedback ID
     * @returns Feedback object or null if not found
     */
    getFeedbackById(feedbackId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!feedbackId) {
                    throw new Error("Feedback ID is required");
                }
                return yield feedback_repository_1.default.findById(feedbackId);
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error retrieving feedback: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while retrieving feedback");
                }
            }
        });
    }
    /**
     * Get feedbacks by email
     *
     * @param email User's email
     * @returns Array of feedbacks
     */
    getFeedbacksByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!email) {
                    throw new Error("Email is required");
                }
                return yield feedback_repository_1.default.findByEmail(email);
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error retrieving feedbacks by email: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while retrieving feedbacks by email");
                }
            }
        });
    }
    /**
     * Update feedback status (Admin only)
     *
     * @param feedbackId Feedback ID
     * @param status New status
     * @returns Updated feedback object
     */
    updateFeedbackStatus(feedbackId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!feedbackId) {
                    throw new Error("Feedback ID is required");
                }
                if (!["pending", "reviewed", "resolved"].includes(status)) {
                    throw new Error("Invalid status. Must be pending, reviewed, or resolved");
                }
                return yield feedback_repository_1.default.update({ _id: feedbackId }, { status });
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error updating feedback status: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while updating feedback status");
                }
            }
        });
    }
    /**
     * Delete feedback (Admin only)
     *
     * @param feedbackId Feedback ID
     * @returns Deleted feedback object
     */
    deleteFeedback(feedbackId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!feedbackId) {
                    throw new Error("Feedback ID is required");
                }
                return yield feedback_repository_1.default.delete({ _id: feedbackId });
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error deleting feedback: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while deleting feedback");
                }
            }
        });
    }
    /**
     * Get feedback statistics (Admin only)
     *
     * @returns Object containing feedback statistics
     */
    getFeedbackStatistics() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield feedback_repository_1.default.getStatistics();
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error retrieving feedback statistics: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while retrieving feedback statistics");
                }
            }
        });
    }
}
exports.default = FeedbackService;
