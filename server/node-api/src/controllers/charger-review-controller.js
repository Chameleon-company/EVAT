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
const charger_review_response_1 = require("../dtos/charger-review-response");
class ChargerReviewController {
    constructor(chargerReviewService) {
        this.chargerReviewService = chargerReviewService;
    }
    /**
     * Submit a new review for a charger
     *
     * @param req Request object containing chargerId, rating, and comment
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data object of the review if the request was successful
     */
    submitReview(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { chargerId, rating, comment } = req.body;
            const { user } = req;
            try {
                if (!user) {
                    return res.status(401).json({ message: "Authentication required" });
                }
                const review = yield this.chargerReviewService.submitReview(chargerId, user.id, user.fullName || user.email, user.avatar, rating, comment);
                return res
                    .status(201)
                    .json({
                    message: "Review submitted successfully",
                    data: new charger_review_response_1.ChargerReviewResponse(review)
                });
            }
            catch (error) {
                return res.status(400).json({ message: error.message });
            }
        });
    }
    /**
     * Update an existing review
     *
     * @param req Request object containing reviewId, rating, and comment
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data object of the updated review if the request was successful
     */
    updateReview(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { rating, comment } = req.body;
            const { user } = req;
            console.log(`Controller updateReview - Request data:`, {
                reviewId: id,
                userId: user === null || user === void 0 ? void 0 : user.id,
                rating,
                comment,
                userEmail: user === null || user === void 0 ? void 0 : user.email
            });
            try {
                if (!user) {
                    return res.status(401).json({ message: "Authentication required" });
                }
                const updatedReview = yield this.chargerReviewService.updateReview(id, user.id, rating, comment);
                if (!updatedReview) {
                    return res.status(404).json({ message: "Review not found" });
                }
                return res.status(200).json({
                    message: "Review updated successfully",
                    data: new charger_review_response_1.ChargerReviewResponse(updatedReview)
                });
            }
            catch (error) {
                return res.status(400).json({ message: error.message });
            }
        });
    }
    /**
     * Delete a review
     *
     * @param req Request object containing reviewId
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data object of the deleted review if the request was successful
     */
    deleteReview(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { user } = req;
            try {
                if (!user) {
                    return res.status(401).json({ message: "Authentication required" });
                }
                const deletedReview = yield this.chargerReviewService.deleteReview(id, user.id);
                if (!deletedReview) {
                    return res.status(404).json({ message: "Review not found" });
                }
                return res.status(200).json({
                    message: "Review deleted successfully",
                    data: new charger_review_response_1.ChargerReviewResponse(deletedReview)
                });
            }
            catch (error) {
                return res.status(400).json({ message: error.message });
            }
        });
    }
    /**
     * Get reviews for a specific charger with pagination
     *
     * @param req Request object containing chargerId and pagination parameters
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    getChargerReviews(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { chargerId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            try {
                const result = yield this.chargerReviewService.getChargerReviews(chargerId, parseInt(page), parseInt(limit));
                return res.status(200).json({
                    message: "Charger reviews retrieved successfully",
                    data: {
                        reviews: result.reviews.map(review => new charger_review_response_1.ChargerReviewResponse(review)),
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
     * Get reviews by a specific user with pagination
     *
     * @param req Request object containing userId and pagination parameters
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    getUserReviews(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            try {
                const result = yield this.chargerReviewService.getUserReviews(userId, parseInt(page), parseInt(limit));
                return res.status(200).json({
                    message: "User reviews retrieved successfully",
                    data: {
                        reviews: result.reviews.map(review => new charger_review_response_1.ChargerReviewResponse(review)),
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
     * Get charger rating statistics
     *
     * @param req Request object containing chargerId
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the statistics data if the request was successful
     */
    getChargerRatingStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { chargerId } = req.params;
            try {
                const stats = yield this.chargerReviewService.getChargerRatingStats(chargerId);
                return res.status(200).json({
                    message: "Charger rating statistics retrieved successfully",
                    data: new charger_review_response_1.ChargerRatingStatsResponse(stats)
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    /**
     * Get multiple chargers' rating statistics
     *
     * @param req Request object containing chargerIds in body
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the statistics data if the request was successful
     */
    getMultipleChargerRatingStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { chargerIds } = req.body;
            try {
                if (!chargerIds || !Array.isArray(chargerIds)) {
                    return res.status(400).json({ message: "chargerIds array is required" });
                }
                const stats = yield this.chargerReviewService.getMultipleChargerRatingStats(chargerIds);
                // Convert to response format
                const responseData = {};
                Object.keys(stats).forEach(chargerId => {
                    responseData[chargerId] = new charger_review_response_1.ChargerRatingStatsResponse(stats[chargerId]);
                });
                return res.status(200).json({
                    message: "Multiple charger rating statistics retrieved successfully",
                    data: responseData
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    /**
     * Check if user has reviewed a specific charger
     *
     * @param req Request object containing chargerId
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the review status if the request was successful
     */
    checkUserReviewStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { chargerId } = req.params;
            const { user } = req;
            try {
                if (!user) {
                    return res.status(401).json({ message: "Authentication required" });
                }
                const hasReviewed = yield this.chargerReviewService.hasUserReviewedCharger(user.id, chargerId);
                const userReview = hasReviewed
                    ? yield this.chargerReviewService.getUserReviewForCharger(user.id, chargerId)
                    : null;
                return res.status(200).json({
                    message: "User review status retrieved successfully",
                    data: {
                        hasReviewed,
                        userReview: userReview ? new charger_review_response_1.ChargerReviewResponse(userReview) : null
                    }
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    /**
     * Get all reviews with optional filtering (Admin only)
     *
     * @param req Request object containing query parameters for filtering and pagination
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    getAllReviews(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page = 1, limit = 10, chargerId, userId, minRating } = req.query;
            try {
                const result = yield this.chargerReviewService.getAllReviews(parseInt(page), parseInt(limit), chargerId, userId, minRating ? parseInt(minRating) : undefined);
                return res.status(200).json({
                    message: "All reviews retrieved successfully",
                    data: {
                        reviews: result.reviews.map(review => new charger_review_response_1.ChargerReviewResponse(review)),
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
}
exports.default = ChargerReviewController;
