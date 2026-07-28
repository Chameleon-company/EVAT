import IceVehicle, { IIceVehicle } from "../models/ice-vehicle-model";
import { FilterQuery } from "mongoose";

class IceVehicleRepository {

  /**
   * Finds a vehicle by a given ID
   * 
   * @param vehicleId String: A vehicle's ID
   * @returns Vehicle: the specified vehicle's details, or null if none exists
   */
  async findById(vehicleId: string): Promise<IIceVehicle | null> {
    return await IceVehicle.findById(vehicleId).exec();
  }

  /**
   * Finds all vehicles with a specific input filter
   * 
   * @param filter Input a specific filter 
   * @returns Returns all vehicles under a specific filter
   */
  async findAll(filter: FilterQuery<IIceVehicle> = {}): Promise<IIceVehicle[]> {
    return await IceVehicle.find(filter).exec();
  }

  /**
   * Creates a new vehicle document
   *
   * @param data Minimal vehicle payload
   * @returns The created vehicle record
   */
  async create(data: {
    make: string;
    model: string;
    year: number;
    ownerId?: string;
  }): Promise<IIceVehicle> {
    const doc = new IceVehicle({
      make: data.make,
      model: data.model,
      year: data.year,
      ownerId: data.ownerId ?? undefined,
    });
    return await doc.save();
  }

  /**
   * Updates an existing vehicle
   *
   * @param vehicleId Vehicle ID
   * @param data Partial fields to update
   * @returns The updated vehicle document, or null if not found
   */
  async update(
    vehicleId: string,
    data: Partial<{ make: string; model: string; year: number }>
  ): Promise<IIceVehicle | null> {
    return await IceVehicle.findByIdAndUpdate(
      vehicleId,
      {
        ...(data.make !== undefined ? { make: data.make } : {}),
        ...(data.model !== undefined ? { model: data.model } : {}),
        ...(data.year !== undefined ? { year: data.year } : {}),
      },
      { new: true, runValidators: true }
    ).exec();
  }
}

export default new IceVehicleRepository();
