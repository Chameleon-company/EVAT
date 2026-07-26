import { IChargingStation } from "../models/station-model";
import { IVehicle } from "../models/vehicle-model";

export class UserProfileResponse {
  constructor(userId: string) {
    this.user_id = userId;
    this.avatarURL = "";
    this.user_car_model = null;
    this.favourite_stations = [];
  }

  user_id: string;
  avatarURL: string;
  user_car_model: IVehicle | null;
  favourite_stations: IChargingStation[];
}
