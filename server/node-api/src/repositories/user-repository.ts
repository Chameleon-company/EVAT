import User, { IUser } from "../models/user-model";
import { FilterQuery, UpdateQuery } from "mongoose";

class UserRepository {

  /**
   * Find a user by an input user ID
   * 
   * @param userId Input: A users ID to find
   * @returns Returns a specific user based on the ID, or null if user was not found
   */
  async findById(userId: string): Promise<IUser | null> {
    return await User.findOne({ _id: userId }).exec();
    }

  /**
   * Find a user by an input email
   * 
   * @param email Input user's email
   * @returns Returns a specific user based on the email, or null if user was not found
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email }).exec();
    }

  /**
   * Function to find a user based on any input parameter
   * 
   * @param filter Any parameter 
   * @returns Returns a specific user based on any input parameter, or null if user was not found
   */
  async findOne(filter: FilterQuery<IUser>): Promise<IUser | null> {
    return await User.findOne(filter).exec();
  }

  /**
   * Find and return all users for the filter without the password data
   * 
   * @param filter The filter to be used for the data
   * @returns all user data that fulfills the filter, without the password data
   */
  async findAll(filter: FilterQuery<IUser> = {}): Promise<IUser[]> {
    return await User.find(filter).select("-password").exec();
  }

  /**
  * Create a new user from the input data
  * 
  * @param data Input a user object that only has to contain some of the data
  * @returns Creates a new user object
  */
  async create(data: Partial<IUser>): Promise<IUser> {
    const newUser = new User(data);
    return await newUser.save();
  }

  /**
   * Updates a user in the database based on the filter and update data
   * 
   * @param filter A filter used to identify the user to update
   * @param update An object containing the new fields to update
   * @returns Returns the updated user object if there was a change, or null if there was not a filter match
   */
  async update(
    filter: FilterQuery<IUser>,
    update: UpdateQuery<IUser>
  ): Promise<IUser | null> {
    return await User.findOneAndUpdate(filter, update, { new: true }).exec();
  }

  /**
   * Delete a specific user by filter
   * 
   * @param filter A filter to identify the user to delete
   * @returns Returns the deleted user data, or null if there was no match
   */
  async delete(filter: FilterQuery<IUser>): Promise<IUser | null> {
    return await User.findOneAndDelete(filter).exec();
  }

  /**
   * Update a users refresh token
   * 
   * @param userId The user ID
   * @param refreshToken The new refresh token to store, or null to remove it
   * @param expiresAt The expiration date of the refresh token, or null to remove it
   * @returns Returns the updated user data
   */
  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
    expiresAt: Date | null
  ) {
    return await User.findByIdAndUpdate(
      userId,
      {
        refreshToken,
        refreshTokenExpiresAt: expiresAt,
      },
      { new: true }
    );
  }
}

export default new UserRepository();
