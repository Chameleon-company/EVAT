import Profile, { IProfile } from "../models/profile-model";
import { FilterQuery, UpdateQuery } from "mongoose";

class ProfileRepository {

    /**
     * Find a user by input ID
     * 
     * @param userId String: a specific users ID
     * @returns Profile: Returns the specified users profile
     */
  async findByUserId(userId: string): Promise<IProfile | null> {
    return await Profile.findOne({ user_id: userId }).exec();
  }

    /**
      * Create a new profile from the input data
      * 
      * @param data Input a profile object that only has to contain some of the data
      * @returns Creates a new profile object
      */
  async create(data: Partial<IProfile>): Promise<IProfile> {
    const newProfile = new Profile(data);
    return await newProfile.save();
  }

    /**
     * Finds a user and updates their profile
     * 
     * @param userId Input userID to change profile of
     * @param update Updated user profile
     * @returns Returns null if the command failed due to an invalid ID, 
     */
  async updateByUserId(
    userId: string,
    update: UpdateQuery<IProfile>
  ): Promise<IProfile | null> {
    return await Profile.findOneAndUpdate({ user_id: userId }, update, {
      new: true,
    }).exec();
  }
}

export default new ProfileRepository();
