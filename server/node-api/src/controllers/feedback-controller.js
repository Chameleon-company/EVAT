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
const feedback_response_1 = require("../dtos/feedback-response");
class FeedbackController {
    constructor(feedbackService) {
        this.feedbackService = feedbackService;
    }
    /**
     * Submit a new feedback
     *
     * @param req Request object containing name, email, and suggestion
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data object of the feedback if the request was successful
     */
    submitFeedback(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, email, suggestion } = req.body;
            try {
                const feedback = yield this.feedbackService.createFeedback(name, email, suggestion);
                return res
                    .status(201)
                    .json({
                    message: "Feedback submitted successfully",
                    data: new feedback_response_1.FeedbackResponse(feedback)
                });
            }
            catch (error) {
                return res.status(400).json({ message: error.message });
            }
        });
    }
    /**
     * Get all feedbacks with pagination (Admin only)
     *
     * @param req Request object containing query parameters for pagination and filtering
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    getAllFeedbacks(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page = 1, limit = 10, status } = req.query;
            try {
                const result = yield this.feedbackService.getAllFeedbacks(parseInt(page), parseInt(limit), status);
                return res.status(200).json({
                    message: "Feedbacks retrieved successfully",
                    data: {
                        feedbacks: result.feedbacks.map(feedback => new feedback_response_1.FeedbackResponse(feedback)),
                        pagination: {
                            total: result.total,
                            page: result.page,
                            totalPages: result.totalPages,
                            limit: parseInt(limit)
                        }
                    }
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    /**
     * Get feedback by ID (Admin only)
     *
     * @param req Request object containing the feedback ID
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    getFeedbackById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const feedback = yield this.feedbackService.getFeedbackById(id);
                if (!feedback) {
                    return res.status(404).json({ message: "Feedback not found" });
                }
                return res.status(200).json({
                    message: "Feedback retrieved successfully",
                    data: new feedback_response_1.FeedbackResponse(feedback)
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    /**
     * Get feedbacks by email (Admin only)
     *
     * @param req Request object containing the email query parameter
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    getFeedbacksByEmail(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email } = req.query;
            try {
                if (!email) {
                    return res.status(400).json({ message: "Email parameter is required" });
                }
                const feedbacks = yield this.feedbackService.getFeedbacksByEmail(email);
                return res.status(200).json({
                    message: "Feedbacks retrieved successfully",
                    data: feedbacks.map(feedback => new feedback_response_1.FeedbackResponse(feedback))
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    /**
     * Update feedback status (Admin only)
     *
     * @param req Request object containing the feedback ID and new status
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    updateFeedbackStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { status } = req.body;
            try {
                if (!status) {
                    return res.status(400).json({ message: "Status is required" });
                }
                const updatedFeedback = yield this.feedbackService.updateFeedbackStatus(id, status);
                if (!updatedFeedback) {
                    return res.status(404).json({ message: "Feedback not found" });
                }
                return res.status(200).json({
                    message: "Feedback status updated successfully",
                    data: new feedback_response_1.FeedbackResponse(updatedFeedback)
                });
            }
            catch (error) {
                return res.status(400).json({ message: error.message });
            }
        });
    }
    /**
     * Delete feedback (Admin only)
     *
     * @param req Request object containing the feedback ID
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    deleteFeedback(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const deletedFeedback = yield this.feedbackService.deleteFeedback(id);
                if (!deletedFeedback) {
                    return res.status(404).json({ message: "Feedback not found" });
                }
                return res.status(200).json({
                    message: "Feedback deleted successfully",
                    data: new feedback_response_1.FeedbackResponse(deletedFeedback)
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    /**
     * Get feedback statistics (Admin only)
     *
     * @param req Request object (not used)
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the statistics data if the request was successful
     */
    getFeedbackStatistics(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const statistics = yield this.feedbackService.getFeedbackStatistics();
                return res.status(200).json({
                    message: "Feedback statistics retrieved successfully",
                    data: statistics
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
}
exports.default = FeedbackController;
