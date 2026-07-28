import Feedback, { IFeedback } from "../models/feedback-model";
import { FilterQuery, UpdateQuery } from "mongoose";

class FeedbackRepository {

  /**
   * Find a feedback by an input feedback ID
   * 
   * @param feedbackId Input: A feedback ID to find
   * @returns Returns a specific feedback based on the ID, or null if feedback was not found
   */
  async findById(feedbackId: string): Promise<IFeedback | null> {
    return await Feedback.findOne({ _id: feedbackId }).exec();
  }

  /**
   * Find feedbacks by email
   * 
   * @param email Input user's email
   * @returns Returns feedbacks based on the email, or empty array if no feedbacks found
   */
  async findByEmail(email: string): Promise<IFeedback[]> {
    return await Feedback.find({ email }).exec();
  }

  /**
   * Function to find a feedback based on any input parameter
   * 
   * @param filter Any parameter 
   * @returns Returns a specific feedback based on any input parameter, or null if feedback was not found
   */
  async findOne(filter: FilterQuery<IFeedback>): Promise<IFeedback | null> {
    return await Feedback.findOne(filter).exec();
  }

  /**
   * Find and return all feedbacks for the filter
   * 
   * @param filter The filter to be used for the data
   * @returns all feedback data that fulfills the filter
   */
  async findAll(filter: FilterQuery<IFeedback> = {}): Promise<IFeedback[]> {
    return await Feedback.find(filter).sort({ createdAt: -1 }).exec();
  }

  /**
   * Find feedbacks with pagination
   * 
   * @param filter The filter to be used for the data
   * @param page Page number (default: 1)
   * @param limit Number of items per page (default: 10)
   * @returns Object containing feedbacks and pagination info
   */
  async findWithPagination(
    filter: FilterQuery<IFeedback> = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ feedbacks: IFeedback[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    
    const [feedbacks, total] = await Promise.all([
      Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Feedback.countDocuments(filter).exec()
    ]);

    return {
      feedbacks,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Create a new feedback from the input data
   * 
   * @param data Input a feedback object that only has to contain some of the data
   * @returns Creates a new feedback object
   */
  async create(data: Partial<IFeedback>): Promise<IFeedback> {
    const newFeedback = new Feedback(data);
    return await newFeedback.save();
  }

  /**
   * Updates a feedback in the database based on the filter and update data
   * 
   * @param filter A filter used to identify the feedback to update
   * @param update An object containing the new fields to update
   * @returns Returns the updated feedback object if there was a change, or null if there was not a filter match
   */
  async update(
    filter: FilterQuery<IFeedback>,
    update: UpdateQuery<IFeedback>
  ): Promise<IFeedback | null> {
    return await Feedback.findOneAndUpdate(filter, update, { new: true }).exec();
  }

  /**
   * Delete a specific feedback by filter
   * 
   * @param filter A filter to identify the feedback to delete
   * @returns Returns the deleted feedback data, or null if there was no match
   */
  async delete(filter: FilterQuery<IFeedback>): Promise<IFeedback | null> {
    return await Feedback.findOneAndDelete(filter).exec();
  }

  /**
   * Get feedback statistics
   * 
   * @returns Object containing feedback statistics
   */
  async getStatistics(): Promise<{
    total: number;
    pending: number;
    reviewed: number;
    resolved: number;
  }> {
    const [total, pending, reviewed, resolved] = await Promise.all([
      Feedback.countDocuments().exec(),
      Feedback.countDocuments({ status: "pending" }).exec(),
      Feedback.countDocuments({ status: "reviewed" }).exec(),
      Feedback.countDocuments({ status: "resolved" }).exec()
    ]);

    return { total, pending, reviewed, resolved };
  }
}

export default new FeedbackRepository();
