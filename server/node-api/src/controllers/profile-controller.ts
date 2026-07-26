import { Request, Response } from "express";
import ProfileService from "../services/profile-service";
import VehicleService from "../services/vehicle-service";
import UserService from "../services/user-service";
import ChargingStationService from "../services/station-service";
import { UserStatsService }  from "../services/user-stats-service";
import { UserProfileResponse } from "../dtos/user-profile-response";

export default class ProfileController {
  constructor(
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
    private readonly vehicleService: VehicleService,
    private readonly stationService: ChargingStationService,
    private readonly userStatsService: UserStatsService
  ) {}

  /**
   * Handles a request to get an authenticated user's profile 
   * 
   * @param req Request object containing the authenticated user
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful 
   */
  async getUserProfile(req: Request, res: Response): Promise<Response> {
    const { user } = req;

    try {
      const response = new UserProfileResponse(user?.id);

      const existingProfile = await this.profileService.getUserProfile(user?.id);

      if (existingProfile.user_car_model) {
        const existingVehicle = await this.vehicleService.getVehicleById(existingProfile.user_car_model);
        response.user_car_model = existingVehicle;
      }

      if (existingProfile.favourite_stations && existingProfile.favourite_stations.length > 0 ) {
        const existingStations = await this.stationService.getStationsWithIdIn(existingProfile.favourite_stations);
        response.favourite_stations = existingStations;
      }

      if (existingProfile.avatarURL) {
        response.avatarURL = existingProfile.avatarURL;
      }

      return res.status(201).json({
        message: "success",
        data: response,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  /**
   * Handles a request to update the authenticated user's vehicle model 
   * 
   * @param req Request object containing the authenticated user and the vehicleId
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful 
   */
  async updateUserVehicleModel(req: Request, res: Response): Promise<Response> {
    const { vehicleId } = req.body;
    const { user } = req;

    try {
      const existingUser = await this.userService.getUserById(user?.id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingVehicle = await this.vehicleService.getVehicleById(vehicleId);
      if (!existingVehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      // Update the profile vehicle
      const updatedProfile = await this.profileService.updateUserVehicleModel(
        user?.id || "",
        vehicleId
      );

      // Trigger stats + achievements
      const statsResult = await this.userStatsService.markProfileVehicleSet(user?.id || "");

      return res.status(201).json({
        message: "Update user vehicle model successfully",
        data: {
          profile: updatedProfile,
          newAchievements: statsResult.newAchievements,
        },
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  /**
   * Function to add a favourite charging station to a user
   * 
   * @param req Request object containing the authenticated user and the station ID
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful 
   */
  async addFavouriteStation(req: Request, res: Response): Promise<Response> {
    const { stationId } = req.body;
    const { user } = req;

    try {
      const existingUser = await this.userService.getUserById(user?.id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingStation = await this.stationService.getStationById(
        stationId
      );
      if (!existingStation) {
        return res.status(404).json({ message: "Station not found" });
      }

      const updatedProfile = await this.profileService.addFavouriteStation(
        user?.id || "",
        stationId
      );

      // Trigger stats + achievements
      const statsResult = await this.userStatsService.markFavouriteChargeSaved(user?.id || "");

      return res.status(201).json({
        message: "Add favourite station successfully",
        data: {
          profile: updatedProfile,
          newAchievements: statsResult.newAchievements,
        },
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  /**
   * Function to remove a favourite charging station to a user
   * 
   * @param req Request object containing the authenticated user and the station ID
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful 
   */
  async deleteFavouriteStation(req: Request, res: Response): Promise<Response> {
    const { stationId } = req.body;
    const { user } = req;

    try {
      const existingUser = await this.userService.getUserById(user?.id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedProfile = await this.profileService.removeFavouriteStation(
        user?.id || "",
        stationId
      );

      return res.status(201).json({
        message: "Remove favourite station successfully",
        data: updatedProfile,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  /**
   * Function to get a users first and last names by their ID
   * 
   * @param req Request object containing the user ID 
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful
   */
  async getUsernameByID(req: Request, res: Response): Promise<Response> {
    const { userID } = req.params;
    
    try {
      const foundUser = await this.userService.getUserById(userID);

      if (foundUser == null) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      var returnData = {
        firstName: foundUser?.firstName ?? foundUser?.fullName ?? "Unknown", // See IUser for details
        lastName: foundUser?.lastName ?? "" // If the user has a full name set then that will be displayed, other wise if they have neither first or last it will show as "Unknown"
      }
      console.log(typeof(returnData))
      return res.status(200).json({
        message: "success",
        data: returnData
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Function to get a users avatar
   * 
   * @param req Request object containing the user ID 
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful
   */
  async getUserAvatar(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user.id;
      const profile = await this.profileService.getUserProfile(userId);

      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }

      const avatarUrl = profile.avatarURL;
      if (!avatarUrl) {
        return res.status(404).json({ message: "User avatar not found" });
      }

      return res.status(200).json({
        message: "Avatar retrieved successfully",
        data: { avatarURL: avatarUrl }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Function to update the profiles image/avatar
   * 
   * @param req Request object containing the user ID and avatar URL
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful
   */
  async updateAvatar(req: Request, res: Response): Promise<Response> {
    try {
      const userID = req.user.id;
      const { avatarURL } = req.body;

      if (!avatarURL) {
        return res.status(400).json({ message: "avatarURL is required" });
      }

      // Update the profile picture
      const updatedProfile = await this.profileService.updateAvatar(userID, avatarURL);

      if (!updatedProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }

      // Trigger stats + achievements
      const result = await this.userStatsService.markProfilePicSet(userID);

      return res.status(200).json({
        message: "Avatar updated successfully",
        data: {
          profile: updatedProfile,
          stats: result.stats,
          newAchievements: result.newAchievements
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  }

}
