import ChargerReview, { IChargerReview } from "../models/charger-review-model";
import { FilterQuery, UpdateQuery } from "mongoose";

class ChargerReviewRepository {

  /**
   * Find a review by ID
   * 
   * @param reviewId Review ID to find
   * @returns Returns a specific review based on the ID, or null if review was not found
   */
  async findById(reviewId: string): Promise<IChargerReview | null> {
    return await ChargerReview.findOne({ _id: reviewId }).exec();
  }

  /**
   * Find reviews by charger ID with pagination
   * 
   * @param chargerId Charger ID to find reviews for
   * @param page Page number (default: 1)
   * @param limit Number of items per page (default: 10)
   * @returns Object containing reviews and pagination info
   */
  async findByChargerId(
    chargerId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reviews: IChargerReview[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    
    const [reviews, total] = await Promise.all([
      ChargerReview.find({ chargerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ChargerReview.countDocuments({ chargerId }).exec()
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Find reviews by user ID
   * 
   * @param userId User ID to find reviews for
   * @param page Page number (default: 1)
   * @param limit Number of items per page (default: 10)
   * @returns Object containing reviews and pagination info
   */
  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reviews: IChargerReview[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    
    const [reviews, total] = await Promise.all([
      ChargerReview.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ChargerReview.countDocuments({ userId }).exec()
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Find a specific user's review for a specific charger
   * 
   * @param userId User ID
   * @param chargerId Charger ID
   * @returns Review object or null if not found
   */
  async findByUserAndCharger(userId: string, chargerId: string): Promise<IChargerReview | null> {
    return await ChargerReview.findOne({ userId, chargerId }).exec();
  }

  /**
   * Get all reviews with optional filtering
   * 
   * @param filter The filter to be used for the data
   * @param page Page number (default: 1)
   * @param limit Number of items per page (default: 10)
   * @returns Object containing reviews and pagination info
   */
  async findAll(
    filter: FilterQuery<IChargerReview> = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ reviews: IChargerReview[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    
    const [reviews, total] = await Promise.all([
      ChargerReview.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ChargerReview.countDocuments(filter).exec()
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Create a new review
   * 
   * @param data Review data
   * @returns Created review object
   */
  async create(data: Partial<IChargerReview>): Promise<IChargerReview> {
    const newReview = new ChargerReview(data);
    return await newReview.save();
  }

  /**
   * Update a review
   * 
   * @param filter A filter used to identify the review to update
   * @param update An object containing the new fields to update
   * @returns Returns the updated review object if there was a change, or null if there was not a filter match
   */
  async update(
    filter: FilterQuery<IChargerReview>,
    update: UpdateQuery<IChargerReview>
  ): Promise<IChargerReview | null> {
    console.log(`Repository update - Filter:`, filter);
    console.log(`Repository update - Update data:`, update);
    
    try {
      const result = await ChargerReview.findOneAndUpdate(
        filter, 
        { ...update, updatedAt: new Date() }, 
        { 
          new: true, 
          runValidators: true,
          context: 'query'
        }
      ).exec();
      
      console.log(`Repository update - Result:`, result ? 'Found and updated' : 'Not found');
      
      return result;
    } catch (error) {
      console.error(`Repository update - Error:`, error);
      throw error;
    }
  }

  /**
   * Delete a review
   * 
   * @param filter A filter to identify the review to delete
   * @returns Returns the deleted review data, or null if there was no match
   */
  async delete(filter: FilterQuery<IChargerReview>): Promise<IChargerReview | null> {
    return await ChargerReview.findOneAndDelete(filter).exec();
  }

  /**
   * Get charger rating statistics
   * 
   * @param chargerId Charger ID
   * @returns Object containing rating statistics
   */
  async getChargerRatingStats(chargerId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const reviews = await ChargerReview.find({ chargerId }).exec();
    
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
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    return {
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution
    };
  }

  /**
   * Get multiple chargers' rating statistics
   * 
   * @param chargerIds Array of charger IDs
   * @returns Object with charger ID as key and stats as value
   */
  async getMultipleChargerRatingStats(chargerIds: string[]): Promise<{
    [chargerId: string]: {
      averageRating: number;
      totalReviews: number;
      ratingDistribution: { [key: number]: number };
    };
  }> {
    const result: any = {};
    
    for (const chargerId of chargerIds) {
      result[chargerId] = await this.getChargerRatingStats(chargerId);
    }

    return result;
  }

  /**
   * Check if user has already reviewed a charger
   * 
   * @param userId User ID
   * @param chargerId Charger ID
   * @returns Boolean indicating if user has reviewed the charger
   */
  async hasUserReviewedCharger(userId: string, chargerId: string): Promise<boolean> {
    const review = await ChargerReview.findOne({ userId, chargerId }).exec();
    return review !== null;
  }
}

export default new ChargerReviewRepository();
