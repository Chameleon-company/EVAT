import { IFeedback } from "../models/feedback-model";

export class FeedbackResponse {
  public id: string;
  public name: string;
  public email: string;
  public suggestion: string;
  public status: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(feedback: IFeedback) {
    this.id = feedback._id.toString();
    this.name = feedback.name;
    this.email = feedback.email;
    this.suggestion = feedback.suggestion;
    this.status = feedback.status;
    this.createdAt = feedback.createdAt;
    this.updatedAt = feedback.updatedAt;
  }
}
