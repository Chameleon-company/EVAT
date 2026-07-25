import mongoose, { Schema, Document } from "mongoose";

export interface IFeedback extends Document {
  name: string;
  email: string;
  suggestion: string;
  status: "pending" | "reviewed" | "resolved";
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema: Schema = new Schema<IFeedback>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      maxlength: [255, "Email cannot exceed 255 characters"],
    },
    suggestion: {
      type: String,
      required: [true, "Suggestion is required"],
      trim: true,
      maxlength: [1000, "Suggestion cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Feedback = mongoose.model<IFeedback>("Feedback", FeedbackSchema, "feedbacks");

export default Feedback;
