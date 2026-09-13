import mongoose, { Schema, Document } from "mongoose";

export type ChatbotRating = "up" | "down";
export type ChatbotTab = "station" | "ai";

export interface IChatbotFeedback extends Document {
  userId: string;
  messageId: string;
  rating: ChatbotRating;
  tab: ChatbotTab;
  reply: string;
  question: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatbotFeedbackSchema: Schema = new Schema<IChatbotFeedback>(
  {
    // Kept as a string because admin tokens carry the id "admin" rather than an ObjectId.
    userId: {
      type: String,
      required: [true, "User is required"],
    },
    messageId: {
      type: String,
      required: [true, "Message ID is required"],
      maxlength: [100, "Message ID cannot exceed 100 characters"],
    },
    rating: {
      type: String,
      enum: ["up", "down"],
      required: [true, "Rating is required"],
    },
    tab: {
      type: String,
      enum: ["station", "ai"],
      required: [true, "Tab is required"],
    },
    reply: {
      type: String,
      required: [true, "Reply is required"],
      maxlength: [4000, "Reply cannot exceed 4000 characters"],
    },
    question: {
      type: String,
      default: "",
      maxlength: [1000, "Question cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// One rating per reply per user, so changing a vote updates the same record.
ChatbotFeedbackSchema.index({ userId: 1, messageId: 1 }, { unique: true });

const ChatbotFeedback = mongoose.model<IChatbotFeedback>(
  "ChatbotFeedback",
  ChatbotFeedbackSchema,
  "chatbotfeedbacks"
);

export default ChatbotFeedback;
