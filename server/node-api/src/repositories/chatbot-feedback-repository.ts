import ChatbotFeedback, { IChatbotFeedback } from "../models/chatbot-feedback-model";

class ChatbotFeedbackRepository {

  /**
   * Create a user's rating of one reply, or replace it if they have rated it before
   *
   * @param userId The user giving the rating
   * @param messageId The chatbot message being rated
   * @param data Rating, tab, reply and question to store
   * @returns The saved rating
   */
  async upsert(
    userId: string,
    messageId: string,
    data: Partial<IChatbotFeedback>
  ): Promise<IChatbotFeedback | null> {
    return await ChatbotFeedback.findOneAndUpdate(
      { userId, messageId },
      { $set: data },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).exec();
  }

  /**
   * Remove a user's rating of one reply
   *
   * @param userId The user who gave the rating
   * @param messageId The chatbot message that was rated
   * @returns The removed rating, or null if there was none
   */
  async remove(userId: string, messageId: string): Promise<IChatbotFeedback | null> {
    return await ChatbotFeedback.findOneAndDelete({ userId, messageId }).exec();
  }

  /**
   * Count ratings by tab and by thumbs up/down, and fetch the latest thumbs-down replies
   *
   * @param recentLimit How many recent thumbs-down replies to return
   * @returns Raw counts per tab and rating, and the recent thumbs-down replies
   */
  async getSummary(recentLimit: number = 10) {
    const [counts, recentDown] = await Promise.all([
      ChatbotFeedback.aggregate<{ _id: { tab: string; rating: string }; count: number }>([
        { $group: { _id: { tab: "$tab", rating: "$rating" }, count: { $sum: 1 } } },
      ]).exec(),
      ChatbotFeedback.find({ rating: "down" })
        .sort({ updatedAt: -1 })
        .limit(recentLimit)
        .select("tab question reply updatedAt")
        .lean()
        .exec(),
    ]);

    return { counts, recentDown };
  }
}

export default new ChatbotFeedbackRepository();
