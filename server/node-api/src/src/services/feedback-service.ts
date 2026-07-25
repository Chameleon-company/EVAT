import FeedbackRepository from "../repositories/feedback-repository";
import { IFeedback } from "../models/feedback-model";

export default class FeedbackService {

  /**
   * Create a new feedback
   * 
   * @param name User's name
   * @param email User's email
   * @param suggestion User's feedback/suggestion
   * @returns Created feedback object
   */
  async createFeedback(
    name: string,
    email: string,
    suggestion: string
  ): Promise<IFeedback> {
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
        status: "pending" as const
      };

      return await FeedbackRepository.create(feedbackData);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error("Error creating feedback: " + error.message);
      } else {
        throw new Error("An unknown error occurred while creating feedback");
      }
    }
  }

  /**
   * Get all feedbacks with optional pagination
   * 
   * @param page Page number (default: 1)
   * @param limit Number of items per page (default: 10)
   * @param status Filter by status (optional)
   * @returns Object containing feedbacks and pagination info
   */
  async getAllFeedbacks(
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<{
    feedbacks: IFeedback[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const filter: any = {};
      if (status && ["pending", "reviewed", "resolved"].includes(status)) {
        filter.status = status;
      }

      return await FeedbackRepository.findWithPagination(filter, page, limit);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error("Error retrieving feedbacks: " + error.message);
      } else {
        throw new Error("An unknown error occurred while retrieving feedbacks");
      }
    }
  }

  /**
   * Get feedback by ID
   * 
   * @param feedbackId Feedback ID
   * @returns Feedback object or null if not found
   */
  async getFeedbackById(feedbackId: string): Promise<IFeedback | null> {
    try {
      if (!feedbackId) {
        throw new Error("Feedback ID is required");
      }

      return await FeedbackRepository.findById(feedbackId);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error("Error retrieving feedback: " + error.message);
      } else {
        throw new Error("An unknown error occurred while retrieving feedback");
      }
    }
  }

  /**
   * Get feedbacks by email
   * 
   * @param email User's email
   * @returns Array of feedbacks
   */
  async getFeedbacksByEmail(email: string): Promise<IFeedback[]> {
    try {
      if (!email) {
        throw new Error("Email is required");
      }

      return await FeedbackRepository.findByEmail(email);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error("Error retrieving feedbacks by email: " + error.message);
      } else {
        throw new Error("An unknown error occurred while retrieving feedbacks by email");
      }
    }
  }

  /**
   * Update feedback status (Admin only)
   * 
   * @param feedbackId Feedback ID
   * @param status New status
   * @returns Updated feedback object
   */
  async updateFeedbackStatus(
    feedbackId: string,
    status: "pending" | "reviewed" | "resolved"
  ): Promise<IFeedback | null> {
    try {
      if (!feedbackId) {
        throw new Error("Feedback ID is required");
      }

      if (!["pending", "reviewed", "resolved"].includes(status)) {
        throw new Error("Invalid status. Must be pending, reviewed, or resolved");
      }

      return await FeedbackRepository.update(
        { _id: feedbackId },
        { status }
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error("Error updating feedback status: " + error.message);
      } else {
        throw new Error("An unknown error occurred while updating feedback status");
      }
    }
  }

  /**
   * Delete feedback (Admin only)
   * 
   * @param feedbackId Feedback ID
   * @returns Deleted feedback object
   */
  async deleteFeedback(feedbackId: string): Promise<IFeedback | null> {
    try {
      if (!feedbackId) {
        throw new Error("Feedback ID is required");
      }

      return await FeedbackRepository.delete({ _id: feedbackId });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error("Error deleting feedback: " + error.message);
      } else {
        throw new Error("An unknown error occurred while deleting feedback");
      }
    }
  }

  /**
   * Get feedback statistics (Admin only)
   * 
   * @returns Object containing feedback statistics
   */
  async getFeedbackStatistics(): Promise<{
    total: number;
    pending: number;
    reviewed: number;
    resolved: number;
  }> {
    try {
      return await FeedbackRepository.getStatistics();
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error("Error retrieving feedback statistics: " + error.message);
      } else {
        throw new Error("An unknown error occurred while retrieving feedback statistics");
      }
    }
  }
}
