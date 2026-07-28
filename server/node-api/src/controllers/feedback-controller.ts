import { Request, Response } from "express";
import FeedbackService from "../services/feedback-service";
import { FeedbackResponse } from "../dtos/feedback-response";

export default class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  /**
   * Submit a new feedback
   * 
   * @param req Request object containing name, email, and suggestion
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data object of the feedback if the request was successful
   */
  async submitFeedback(req: Request, res: Response): Promise<Response> {
    const { name, email, suggestion } = req.body;

    try {
      const feedback = await this.feedbackService.createFeedback(name, email, suggestion);
      return res
        .status(201)
        .json({ 
          message: "Feedback submitted successfully", 
          data: new FeedbackResponse(feedback) 
        });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  /**
   * Get all feedbacks with pagination (Admin only)
   * 
   * @param req Request object containing query parameters for pagination and filtering
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful
   */
  async getAllFeedbacks(req: Request, res: Response): Promise<Response> {
    const { page = 1, limit = 10, status } = req.query;

    try {
      const result = await this.feedbackService.getAllFeedbacks(
        parseInt(page as string),
        parseInt(limit as string),
        status as string
      );

      return res.status(200).json({
        message: "Feedbacks retrieved successfully",
        data: {
          feedbacks: result.feedbacks.map(feedback => new FeedbackResponse(feedback)),
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
   * Get feedback by ID (Admin only)
   * 
   * @param req Request object containing the feedback ID
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful
   */
  async getFeedbackById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    try {
      const feedback = await this.feedbackService.getFeedbackById(id);
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      return res.status(200).json({
        message: "Feedback retrieved successfully",
        data: new FeedbackResponse(feedback)
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get feedbacks by email (Admin only)
   * 
   * @param req Request object containing the email query parameter
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful
   */
  async getFeedbacksByEmail(req: Request, res: Response): Promise<Response> {
    const { email } = req.query;

    try {
      if (!email) {
        return res.status(400).json({ message: "Email parameter is required" });
      }

      const feedbacks = await this.feedbackService.getFeedbacksByEmail(email as string);
      return res.status(200).json({
        message: "Feedbacks retrieved successfully",
        data: feedbacks.map(feedback => new FeedbackResponse(feedback))
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Update feedback status (Admin only)
   * 
   * @param req Request object containing the feedback ID and new status
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful
   */
  async updateFeedbackStatus(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { status } = req.body;

    try {
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const updatedFeedback = await this.feedbackService.updateFeedbackStatus(id, status);
      if (!updatedFeedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      return res.status(200).json({
        message: "Feedback status updated successfully",
        data: new FeedbackResponse(updatedFeedback)
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  /**
   * Delete feedback (Admin only)
   * 
   * @param req Request object containing the feedback ID
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful
   */
  async deleteFeedback(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    try {
      const deletedFeedback = await this.feedbackService.deleteFeedback(id);
      if (!deletedFeedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      return res.status(200).json({
        message: "Feedback deleted successfully",
        data: new FeedbackResponse(deletedFeedback)
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get feedback statistics (Admin only)
   * 
   * @param req Request object (not used)
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the statistics data if the request was successful
   */
  async getFeedbackStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const statistics = await this.feedbackService.getFeedbackStatistics();
      return res.status(200).json({
        message: "Feedback statistics retrieved successfully",
        data: statistics
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}
