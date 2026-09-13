import ChatbotFeedbackRepository from "../repositories/chatbot-feedback-repository";
import { IChatbotFeedback, ChatbotRating, ChatbotTab } from "../models/chatbot-feedback-model";

const RATINGS: ChatbotRating[] = ["up", "down"];
const TABS: ChatbotTab[] = ["station", "ai"];
const MAX_MESSAGE_ID = 100;
const MAX_REPLY = 4000;
const MAX_QUESTION = 1000;

/** Raised for a request the client has to fix, as opposed to a database failure. */
export class ChatbotFeedbackValidationError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ChatbotFeedbackValidationError.prototype);
  }
}

export interface ChatbotFeedbackInput {
  messageId?: unknown;
  rating?: unknown;
  tab?: unknown;
  reply?: unknown;
  question?: unknown;
}

export interface ChatbotFeedbackSummary {
  total: number;
  up: number;
  down: number;
  byTab: Record<ChatbotTab, Record<ChatbotRating, number>>;
  recentDown: { tab: ChatbotTab; question: string; reply: string; updatedAt: Date }[];
}

export default class ChatbotFeedbackService {

  /**
   * Save, change or clear a user's rating of one chatbot reply. A null rating clears it,
   * so clicking the same thumb twice leaves no record behind.
   *
   * @param userId The signed-in user giving the rating
   * @param input messageId, rating ("up", "down" or null), tab, reply and question
   * @returns The saved rating, or null when the rating was cleared
   */
  async rateReply(userId: string, input: ChatbotFeedbackInput): Promise<IChatbotFeedback | null> {
    const { messageId, rating, tab, reply, question } = input;

    if (typeof messageId !== "string" || !messageId.trim() || messageId.length > MAX_MESSAGE_ID) {
      throw new ChatbotFeedbackValidationError("A valid messageId is required");
    }

    if (rating === null) {
      await ChatbotFeedbackRepository.remove(userId, messageId);
      return null;
    }

    if (typeof rating !== "string" || !RATINGS.includes(rating as ChatbotRating)) {
      throw new ChatbotFeedbackValidationError("Rating must be up, down or null");
    }

    if (typeof tab !== "string" || !TABS.includes(tab as ChatbotTab)) {
      throw new ChatbotFeedbackValidationError("Tab must be station or ai");
    }

    if (typeof reply !== "string" || !reply.trim()) {
      throw new ChatbotFeedbackValidationError("The rated reply is required");
    }

    // Long answers are cut rather than refused, so a rating is never lost to length.
    return await ChatbotFeedbackRepository.upsert(userId, messageId, {
      rating: rating as ChatbotRating,
      tab: tab as ChatbotTab,
      reply: reply.trim().slice(0, MAX_REPLY),
      question: typeof question === "string" ? question.trim().slice(0, MAX_QUESTION) : "",
    });
  }

  /**
   * Summarise chatbot ratings for the team (Admin only)
   *
   * @returns Totals, a split by tab, and the most recent thumbs-down replies
   */
  async getSummary(): Promise<ChatbotFeedbackSummary> {
    const { counts, recentDown } = await ChatbotFeedbackRepository.getSummary();

    const byTab: Record<ChatbotTab, Record<ChatbotRating, number>> = {
      station: { up: 0, down: 0 },
      ai: { up: 0, down: 0 },
    };
    for (const { _id, count } of counts) {
      const tab = _id.tab as ChatbotTab;
      const rating = _id.rating as ChatbotRating;
      if (TABS.includes(tab) && RATINGS.includes(rating)) byTab[tab][rating] = count;
    }

    const up = byTab.station.up + byTab.ai.up;
    const down = byTab.station.down + byTab.ai.down;

    return {
      total: up + down,
      up,
      down,
      byTab,
      recentDown: recentDown.map(({ tab, question, reply, updatedAt }) => ({ tab, question, reply, updatedAt })),
    };
  }
}
