import { Request, Response } from "express";
import ChargerReviewService from "../services/charger-review-service";
import { ChargerReviewResponse, ChargerRatingStatsResponse } from "../dtos/charger-review-response";

export default class ChargerReviewController {
  constructor(private readonly chargerReviewService: ChargerReviewService) {}

  /**
   * Submit a new review for a charger
   * 
   * @param req Request object containing chargerId, rating, and comment
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data object of the review if the request was successful
   */
  async submitReview(req: Request, res: Response): Promise<Response> {
    const { chargerId, rating, comment } = req.body;
    const { user } = req;

    try {
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const review = await this.chargerReviewService.submitReview(
        chargerId,
        user.id,
        user.fullName || user.email,
        user.avatar,
        rating,
        comment
      );

      return res
        .status(201)
        .json({ 
          message: "Review submitted successfully", 
          data: new ChargerReviewResponse(review) 
        });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  /**
   * Update an existing review
   * 
   * @param req Request object containing reviewId, rating, and comment
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data object of the updated review if the request was successful
   */
  async updateReview(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const { user } = req;

    console.log(`Controller updateReview - Request data:`, {
      reviewId: id,
      userId: user?.id,
      rating,
      comment,
      userEmail: user?.email
    });

    try {
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const updatedReview = await this.chargerReviewService.updateReview(
        id,
        user.id,
        rating,
        comment
      );

      if (!updatedReview) {
        return res.status(404).json({ message: "Review not found" });
      }

      return res.status(200).json({
        message: "Review updated successfully",
        data: new ChargerReviewResponse(updatedReview)
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  /**
   * Delete a review
   * 
   * @param req Request object containing reviewId
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data object of the deleted review if the request was successful
   */
  async deleteReview(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { user } = req;

    try {
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const deletedReview = await this.chargerReviewService.deleteReview(id, user.id);

      if (!deletedReview) {
        return res.status(404).json({ message: "Review not found" });
      }

      return res.status(200).json({
        message: "Review deleted successfully",
        data: new ChargerReviewResponse(deletedReview)
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  /**
   * Get reviews for a specific charger with pagination
   * 
   * @param req Request object containing chargerId and pagination parameters
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful
   */
  async getChargerReviews(req: Request, res: Response): Promise<Response> {
    const { chargerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
      const result = await this.chargerReviewService.getChargerReviews(
        chargerId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.status(200).json({
        message: "Charger reviews retrieved successfully",
        data: {
          reviews: result.reviews.map(review => new ChargerReviewResponse(review)),
          pagination: {
            total: result.total,
            page: result.page,
            totalPages: result.totalPages,
            limit: parseInt(limit as string)
          }
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get reviews by a specific user with pagination
   * 
   * @param req Request object containing userId and pagination parameters
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful
   */
  async getUserReviews(req: Request, res: Response): Promise<Response> {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
      const result = await this.chargerReviewService.getUserReviews(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.status(200).json({
        message: "User reviews retrieved successfully",
        data: {
          reviews: result.reviews.map(review => new ChargerReviewResponse(review)),
          pagination: {
            total: result.total,
            page: result.page,
            totalPages: result.totalPages,
            limit: parseInt(limit as string)
          }
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get charger rating statistics
   * 
   * @param req Request object containing chargerId
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the statistics data if the request was successful
   */
  async getChargerRatingStats(req: Request, res: Response): Promise<Response> {
    const { chargerId } = req.params;

    try {
      const stats = await this.chargerReviewService.getChargerRatingStats(chargerId);

      return res.status(200).json({
        message: "Charger rating statistics retrieved successfully",
        data: new ChargerRatingStatsResponse(stats)
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get multiple chargers' rating statistics
   * 
   * @param req Request object containing chargerIds in body
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the statistics data if the request was successful
   */
  async getMultipleChargerRatingStats(req: Request, res: Response): Promise<Response> {
    const { chargerIds } = req.body;

    try {
      if (!chargerIds || !Array.isArray(chargerIds)) {
        return res.status(400).json({ message: "chargerIds array is required" });
      }

      const stats = await this.chargerReviewService.getMultipleChargerRatingStats(chargerIds);

      // Convert to response format
      const responseData: { [key: string]: ChargerRatingStatsResponse } = {};
      Object.keys(stats).forEach(chargerId => {
        responseData[chargerId] = new ChargerRatingStatsResponse(stats[chargerId]);
      });

      return res.status(200).json({
        message: "Multiple charger rating statistics retrieved successfully",
        data: responseData
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Check if user has reviewed a specific charger
   * 
   * @param req Request object containing chargerId
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the review status if the request was successful
   */
  async checkUserReviewStatus(req: Request, res: Response): Promise<Response> {
    const { chargerId } = req.params;
    const { user } = req;

    try {
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const hasReviewed = await this.chargerReviewService.hasUserReviewedCharger(user.id, chargerId);
      const userReview = hasReviewed 
        ? await this.chargerReviewService.getUserReviewForCharger(user.id, chargerId)
        : null;

      return res.status(200).json({
        message: "User review status retrieved successfully",
        data: {
          hasReviewed,
          userReview: userReview ? new ChargerReviewResponse(userReview) : null
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get all reviews with optional filtering (Admin only)
   * 
   * @param req Request object containing query parameters for filtering and pagination
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful
   */
  async getAllReviews(req: Request, res: Response): Promise<Response> {
    const { page = 1, limit = 10, chargerId, userId, minRating } = req.query;

    try {
      const result = await this.chargerReviewService.getAllReviews(
        parseInt(page as string),
        parseInt(limit as string),
        chargerId as string,
        userId as string,
        minRating ? parseInt(minRating as string) : undefined
      );

      return res.status(200).json({
        message: "All reviews retrieved successfully",
        data: {
          reviews: result.reviews.map(review => new ChargerReviewResponse(review)),
          pagination: {
            total: result.total,
            page: result.page,
            totalPages: result.totalPages,
            limit: parseInt(limit as string)
          }
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}
