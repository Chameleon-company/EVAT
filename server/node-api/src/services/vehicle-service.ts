import VehicleRepository from "../repositories/vehicle-repository";

export default class VehicleService {
  async getAllVehicles() {
    return await VehicleRepository.findAll();
  }

  async getVehicleById(vehicleId: string) {
    return await VehicleRepository.findById(vehicleId);
  }
}
