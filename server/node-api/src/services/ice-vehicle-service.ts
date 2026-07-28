import IceVehicleRepository from "../repositories/ice-vehicle-repository";

export default class IceVehicleService {
  async getAllVehicles() {
    return await IceVehicleRepository.findAll();
  }

  async getVehicleById(vehicleId: string) {
    return await IceVehicleRepository.findById(vehicleId);
  }
}
