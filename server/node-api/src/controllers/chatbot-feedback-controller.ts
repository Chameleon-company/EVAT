import { Response } from "express";
import { AuthRequest } from "../middlewares/auth-middleware";
import ChatbotFeedbackService, { ChatbotFeedbackValidationError } from "../services/chatbot-feedback-service";

export default class ChatbotFeedbackController {
  constructor(private readonly chatbotFeedbackService: ChatbotFeedbackService) {}

  /**
   * Save, change or clear the signed-in user's thumbs up/down on a chatbot reply
   *
   * @param req Request object containing messageId, rating, tab, reply and question
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the saved rating (null when cleared)
   */
  async rateReply(req: AuthRequest, res: Response): Promise<Response> {
    const userId = String(req.user?._id ?? req.user?.id ?? "");
    if (!userId) {
      return res.status(401).json({ message: "Not signed in" });
    }

    try {
      const feedback = await this.chatbotFeedbackService.rateReply(userId, req.body ?? {});
      return res.status(200).json({
        message: feedback ? "Rating saved" : "Rating cleared",
        data: feedback
          ? { id: feedback._id, messageId: feedback.messageId, rating: feedback.rating, tab: feedback.tab }
          : null,
      });
    } catch (error: any) {
      const status = error instanceof ChatbotFeedbackValidationError ? 400 : 500;
      return res.status(status).json({ message: error.message });
    }
  }

  /**
   * Get a summary of chatbot ratings (Admin only)
   *
   * @param req Request object (not used)
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the summary if the request was successful
   */
  async getSummary(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const summary = await this.chatbotFeedbackService.getSummary();
      return res.status(200).json({
        message: "Chatbot feedback summary retrieved successfully",
        data: summary,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}
