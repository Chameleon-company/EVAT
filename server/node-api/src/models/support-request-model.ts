import { Schema, model, Document, Types } from "mongoose";

export type SupportIssue = "station" | "payment" | "info" | "other";
export type SupportStatus = "open" | "in_progress" | "resolved" | "closed";

export interface SupportRequestDoc extends Document {
  user: Types.ObjectId;
  name?: string;
  email?: string;
  issue: SupportIssue;
  description: string;
  status: SupportStatus;
  requestNo: number;   // per-user sequence (1,2,3...)
  reference: string;   // human-readable ref (e.g., SR-5)
  createdAt: Date;
  updatedAt: Date;
}

const SupportRequestSchema = new Schema<SupportRequestDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    issue: { type: String, enum: ["station", "payment", "info", "other"], required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
    requestNo: { type: Number, required: true },
    reference: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

// Uniqueness per-user for the sequence
SupportRequestSchema.index({ user: 1, requestNo: 1 }, { unique: true });

export default model<SupportRequestDoc>("SupportRequest", SupportRequestSchema);