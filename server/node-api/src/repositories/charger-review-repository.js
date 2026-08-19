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
const charger_review_model_1 = __importDefault(require("../models/charger-review-model"));
class ChargerReviewRepository {
    /**
     * Find a review by ID
     *
     * @param reviewId Review ID to find
     * @returns Returns a specific review based on the ID, or null if review was not found
     */
    findById(reviewId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield charger_review_model_1.default.findOne({ _id: reviewId }).exec();
        });
    }
    /**
     * Find reviews by charger ID with pagination
     *
     * @param chargerId Charger ID to find reviews for
     * @param page Page number (default: 1)
     * @param limit Number of items per page (default: 10)
     * @returns Object containing reviews and pagination info
     */
    findByChargerId(chargerId_1) {
        return __awaiter(this, arguments, void 0, function* (chargerId, page = 1, limit = 10) {
            const skip = (page - 1) * limit;
            const [reviews, total] = yield Promise.all([
                charger_review_model_1.default.find({ chargerId })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                charger_review_model_1.default.countDocuments({ chargerId }).exec()
            ]);
            return {
                reviews,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
        });
    }
    /**
     * Find reviews by user ID
     *
     * @param userId User ID to find reviews for
     * @param page Page number (default: 1)
     * @param limit Number of items per page (default: 10)
     * @returns Object containing reviews and pagination info
     */
    findByUserId(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 10) {
            const skip = (page - 1) * limit;
            const [reviews, total] = yield Promise.all([
                charger_review_model_1.default.find({ userId })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                charger_review_model_1.default.countDocuments({ userId }).exec()
            ]);
            return {
                reviews,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
        });
    }
    /**
     * Find a specific user's review for a specific charger
     *
     * @param userId User ID
     * @param chargerId Charger ID
     * @returns Review object or null if not found
     */
    findByUserAndCharger(userId, chargerId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield charger_review_model_1.default.findOne({ userId, chargerId }).exec();
        });
    }
    /**
     * Get all reviews with optional filtering
     *
     * @param filter The filter to be used for the data
     * @param page Page number (default: 1)
     * @param limit Number of items per page (default: 10)
     * @returns Object containing reviews and pagination info
     */
    findAll() {
        return __awaiter(this, arguments, void 0, function* (filter = {}, page = 1, limit = 10) {
            const skip = (page - 1) * limit;
            const [reviews, total] = yield Promise.all([
                charger_review_model_1.default.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                charger_review_model_1.default.countDocuments(filter).exec()
            ]);
            return {
                reviews,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
        });
    }
    /**
     * Create a new review
     *
     * @param data Review data
     * @returns Created review object
     */
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const newReview = new charger_review_model_1.default(data);
            return yield newReview.save();
        });
    }
    /**
     * Update a review
     *
     * @param filter A filter used to identify the review to update
     * @param update An object containing the new fields to update
     * @returns Returns the updated review object if there was a change, or null if there was not a filter match
     */
    update(filter, update) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Repository update - Filter:`, filter);
            console.log(`Repository update - Update data:`, update);
            try {
                const result = yield charger_review_model_1.default.findOneAndUpdate(filter, Object.assign(Object.assign({}, update), { updatedAt: new Date() }), {
                    new: true,
                    runValidators: true,
                    context: 'query'
                }).exec();
                console.log(`Repository update - Result:`, result ? 'Found and updated' : 'Not found');
                return result;
            }
            catch (error) {
                console.error(`Repository update - Error:`, error);
                throw error;
            }
        });
    }
    /**
     * Delete a review
     *
     * @param filter A filter to identify the review to delete
     * @returns Returns the deleted review data, or null if there was no match
     */
    delete(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield charger_review_model_1.default.findOneAndDelete(filter).exec();
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
            const reviews = yield charger_review_model_1.default.find({ chargerId }).exec();
            if (reviews.length === 0) {
                return {
                    averageRating: 0,
                    totalReviews: 0,
                    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                };
            }
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal place
            const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            reviews.forEach(review => {
                ratingDistribution[review.rating]++;
            });
            return {
                averageRating,
                totalReviews: reviews.length,
                ratingDistribution
            };
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
            const result = {};
            for (const chargerId of chargerIds) {
                result[chargerId] = yield this.getChargerRatingStats(chargerId);
            }
            return result;
        });
    }
    /**
     * Check if user has already reviewed a charger
     *
     * @param userId User ID
     * @param chargerId Charger ID
     * @returns Boolean indicating if user has reviewed the charger
     */
    hasUserReviewedCharger(userId, chargerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const review = yield charger_review_model_1.default.findOne({ userId, chargerId }).exec();
            return review !== null;
        });
    }
}
exports.default = new ChargerReviewRepository();
