import Profile from "../models/profile-model";
import ProfileRepository from "../repositories/profile-repository";

export default class ProfileService {

    /**
     * Updates or creates a user profile with a selected vehicle model
     * If the user profile doesn't exist, it creates one with the vehicle model
     * Otherwise, it updates the existing profile's car model
     * 
     * @param userId The ID of the user | user_id (String), user_car_model (String), favourite_station (Array[String]), createdAt (Date), updatedAt (Date)
     * @param vehicleId The ID of the vehicle to associate with the user
     * @returns The created or updated profile
     */
  async updateUserVehicleModel(
    userId: string,
    vehicleId: string
  ): Promise<any> {
    try {
      // Check if there is an existing tracking for this userId
      const existingTracking = await ProfileRepository.findByUserId(userId);
      if (!existingTracking) {
        const newProfile = new Profile();
        newProfile.user_id = userId;
        newProfile.user_car_model = vehicleId;
        return await ProfileRepository.create(newProfile);
      } else {
        return await ProfileRepository.updateByUserId(userId, {
          // userCarModel: vehicleId, :removed as this calls the repo with an unknown key userCarModel wehn it should be user_car_model
          user_car_model: vehicleId,
        });
      }
    } catch (e) {
      throw e;
    }
  }

    /**
     * Adds a station to the user's list of favourite stations
     * If the user profile doesn't exist, it creates one and adds the station to the users favourite
     * else, it will append the station to the users list of favourite stations
     * 
     * @param userId The ID of the user object | user_id (String), user_car_model (String), favourite_station (Array[String]), createdAt (Date), updatedAt (Date)
     * @param stationId The ID of the station to add to favourites
     * @returns The updated or created profile
     */
  async addFavouriteStation(userId: string, stationId: string): Promise<any> {
    try {
      // Check if there is an existing tracking for this userId
      const existingTracking = await ProfileRepository.findByUserId(userId);
      if (!existingTracking) {
        const newProfile = new Profile();
        newProfile.user_id = userId;
        newProfile.favourite_stations = [stationId];
        return await ProfileRepository.create(newProfile);
      } else {
        return await ProfileRepository.updateByUserId(userId, {
          $push: { favourite_stations: stationId },
        });
      }
    } catch (e) {
      throw e;
    }
  }

    /**
     * Removes a station from the user's list of favourite stations
     * Throws an error if the user profile does not exist
     * 
     * @param userId The ID of the user | user_id (String), user_car_model (String), favourite_station (Array[String]), createdAt (Date), updatedAt (Date)
     * @param stationId The ID of the station to add to favourites
     * @returns The updated profile
     */
  async removeFavouriteStation(
    userId: string,
    stationId: string
  ): Promise<any> {
    try {
      // Check if there is an existing tracking for this userId
      const existingTracking = await ProfileRepository.findByUserId(userId);
      if (!existingTracking) {
        throw new Error(
          `The station tracking with userId = [${userId}] does not exist`
        );
      } else {
        return await ProfileRepository.updateByUserId(userId, {
          $pull: { favourite_stations: stationId },
        });
      }
    } catch (e) {
      throw e;
    }
  }

    /**
     * Retrieves the user's profile
     * If it doesn't exist, return a default object with empty values
     * 
     * @param userId The ID of the user | user_id (String), user_car_model (String), favourite_station (Array[String]), createdAt (Date), updatedAt (Date)
     * @returns The user profile or a default profile object
     */
  async getUserProfile(userId: string) {
    try {
      // Check if there is an existing tracking for this userId
      const existingTracking = await ProfileRepository.findByUserId(userId);
      if (!existingTracking) {
        return {
          user_id: userId,
          user_car_model: null,
          favourite_stations: [],
        };
      } else return existingTracking;
    } catch (e) {
      throw e;
    }
  }
}
