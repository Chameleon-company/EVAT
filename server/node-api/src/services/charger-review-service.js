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
const charger_review_repository_1 = __importDefault(require("../repositories/charger-review-repository"));
class ChargerReviewService {
    /**
     * Submit a new review for a charger
     *
     * @param chargerId Charger ID
     * @param userId User ID
     * @param userName User's display name
     * @param userAvatar User's avatar URL (optional)
     * @param rating Rating (1-5)
     * @param comment Review comment
     * @returns Created review object
     */
    submitReview(chargerId, userId, userName, userAvatar, rating, comment) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate input
                if (!chargerId || !userId || !userName || !rating || !comment) {
                    throw new Error("All fields are required: chargerId, userId, userName, rating, comment");
                }
                if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
                    throw new Error("Rating must be an integer between 1 and 5");
                }
                if (userName.length > 100) {
                    throw new Error("User name cannot exceed 100 characters");
                }
                if (comment.length > 500) {
                    throw new Error("Comment cannot exceed 500 characters");
                }
                // Check if user has already reviewed this charger
                const existingReview = yield charger_review_repository_1.default.findByUserAndCharger(userId, chargerId);
                if (existingReview) {
                    throw new Error("You have already reviewed this charger. You can update your existing review instead.");
                }
                const reviewData = {
                    chargerId: chargerId.trim(),
                    userId: userId.trim(),
                    userName: userName.trim(),
                    userAvatar: (userAvatar === null || userAvatar === void 0 ? void 0 : userAvatar.trim()) || undefined,
                    rating,
                    comment: comment.trim()
                };
                return yield charger_review_repository_1.default.create(reviewData);
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error submitting review: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while submitting review");
                }
            }
        });
    }
    /**
     * Update an existing review
     *
     * @param reviewId Review ID
     * @param userId User ID (for authorization)
     * @param rating New rating (1-5)
     * @param comment New comment
     * @returns Updated review object
     */
    updateReview(reviewId, userId, rating, comment) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!reviewId || !userId || !rating || !comment) {
                    throw new Error("All fields are required: reviewId, userId, rating, comment");
                }
                if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
                    throw new Error("Rating must be an integer between 1 and 5");
                }
                if (comment.length > 500) {
                    throw new Error("Comment cannot exceed 500 characters");
                }
                // Find the review and check ownership
                const existingReview = yield charger_review_repository_1.default.findById(reviewId);
                if (!existingReview) {
                    throw new Error("Review not found");
                }
                if (existingReview.userId !== userId) {
                    throw new Error("You can only update your own reviews");
                }
                console.log(`Updating review ${reviewId} for user ${userId} with rating ${rating} and comment: ${comment.trim()}`);
                console.log(`Existing review data:`, {
                    id: existingReview._id,
                    userId: existingReview.userId,
                    chargerId: existingReview.chargerId,
                    currentRating: existingReview.rating,
                    currentComment: existingReview.comment
                });
                const updatedReview = yield charger_review_repository_1.default.update({ _id: reviewId }, { rating, comment: comment.trim() });
                console.log(`Update result:`, updatedReview ? 'Success' : 'Failed');
                if (updatedReview) {
                    console.log(`Updated review data:`, {
                        id: updatedReview._id,
                        rating: updatedReview.rating,
                        comment: updatedReview.comment,
                        updatedAt: updatedReview.updatedAt
                    });
                }
                return updatedReview;
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error updating review: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while updating review");
                }
            }
        });
    }
    /**
     * Delete a review
     *
     * @param reviewId Review ID
     * @param userId User ID (for authorization)
     * @returns Deleted review object
     */
    deleteReview(reviewId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!reviewId || !userId) {
                    throw new Error("Review ID and User ID are required");
                }
                // Find the review and check ownership
                const existingReview = yield charger_review_repository_1.default.findById(reviewId);
                if (!existingReview) {
                    throw new Error("Review not found");
                }
                if (existingReview.userId !== userId) {
                    throw new Error("You can only delete your own reviews");
                }
                return yield charger_review_repository_1.default.delete({ _id: reviewId });
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error deleting review: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while deleting review");
                }
            }
        });
    }
    /**
     * Get reviews for a specific charger with pagination
     *
     * @param chargerId Charger ID
     * @param page Page number (default: 1)
     * @param limit Number of items per page (default: 10)
     * @returns Object containing reviews and pagination info
     */
    getChargerReviews(chargerId_1) {
        return __awaiter(this, arguments, void 0, function* (chargerId, page = 1, limit = 10) {
            try {
                if (!chargerId) {
                    throw new Error("Charger ID is required");
                }
                return yield charger_review_repository_1.default.findByChargerId(chargerId, page, limit);
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error retrieving charger reviews: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while retrieving charger reviews");
                }
            }
        });
    }
    /**
     * Get reviews by a specific user with pagination
     *
     * @param userId User ID
     * @param page Page number (default: 1)
     * @param limit Number of items per page (default: 10)
     * @returns Object containing reviews and pagination info
     */
    getUserReviews(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 10) {
            try {
                if (!userId) {
                    throw new Error("User ID is required");
                }
                return yield charger_review_repository_1.default.findByUserId(userId, page, limit);
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error retrieving user reviews: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while retrieving user reviews");
                }
            }
        });
    }
    /**
     * Get charger rating statistics
     *
     * @param chargerId Charger ID
     * @returns Object containing rating statistics
     */
    getChargerRatingStats(chargerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!chargerId) {
                    throw new Error("Charger ID is required");
                }
                return yield charger_review_repository_1.default.getChargerRatingStats(chargerId);
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error retrieving charger rating stats: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while retrieving charger rating stats");
                }
            }
        });
    }
    /**
     * Get multiple chargers' rating statistics
     *
     * @param chargerIds Array of charger IDs
     * @returns Object with charger ID as key and stats as value
     */
    getMultipleChargerRatingStats(chargerIds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!chargerIds || chargerIds.length === 0) {
                    throw new Error("Charger IDs array is required");
                }
                return yield charger_review_repository_1.default.getMultipleChargerRatingStats(chargerIds);
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error retrieving multiple charger rating stats: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while retrieving multiple charger rating stats");
                }
            }
        });
    }
    /**
     * Check if user has reviewed a specific charger
     *
     * @param userId User ID
     * @param chargerId Charger ID
     * @returns Boolean indicating if user has reviewed the charger
     */
    hasUserReviewedCharger(userId, chargerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!userId || !chargerId) {
                    throw new Error("User ID and Charger ID are required");
                }
                return yield charger_review_repository_1.default.hasUserReviewedCharger(userId, chargerId);
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error checking user review status: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while checking user review status");
                }
            }
        });
    }
    /**
     * Get user's review for a specific charger
     *
     * @param userId User ID
     * @param chargerId Charger ID
     * @returns User's review for the charger or null if not found
     */
    getUserReviewForCharger(userId, chargerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!userId || !chargerId) {
                    throw new Error("User ID and Charger ID are required");
                }
                return yield charger_review_repository_1.default.findByUserAndCharger(userId, chargerId);
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error retrieving user review for charger: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while retrieving user review for charger");
                }
            }
        });
    }
    /**
     * Get all reviews with optional filtering (Admin only)
     *
     * @param page Page number (default: 1)
     * @param limit Number of items per page (default: 10)
     * @param chargerId Filter by charger ID (optional)
     * @param userId Filter by user ID (optional)
     * @param minRating Filter by minimum rating (optional)
     * @returns Object containing reviews and pagination info
     */
    getAllReviews() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10, chargerId, userId, minRating) {
            try {
                const filter = {};
                if (chargerId)
                    filter.chargerId = chargerId;
                if (userId)
                    filter.userId = userId;
                if (minRating)
                    filter.rating = { $gte: minRating };
                return yield charger_review_repository_1.default.findAll(filter, page, limit);
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error retrieving all reviews: " + error.message);
                }
                else {
                    throw new Error("An unknown error occurred while retrieving all reviews");
                }
            }
        });
    }
}
exports.default = ChargerReviewService;
