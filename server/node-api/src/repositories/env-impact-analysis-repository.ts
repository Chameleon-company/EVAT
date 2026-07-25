import VehicleRepository from "./vehicle-repository";
import { IVehicle } from "../models/vehicle-model";
import IceVehicle, { IIceVehicle } from "../models/ice-vehicle-model";

class EnvImpactAnalysisRepository {
  async findEvById(vehicleId: string): Promise<IVehicle | null> {
    return await VehicleRepository.findById(vehicleId);
  }

  async findIceById(vehicleId: string): Promise<IIceVehicle | null> {
    return await IceVehicle.findById(vehicleId).exec();
  }
}

export default new EnvImpactAnalysisRepository();

