import ChargingStation, { IChargingStation } from "../models/station-model";
import { FilterQuery } from "mongoose";

class ChargingStationRepository {

  /**
   * Find all charging stations within the filter condition
   * 
   * @param filter A filter condition used to filter the data found
   * @returns Returns all Charging Stations that fulfill the filter condition
   */
  async findAll(filter: FilterQuery<IChargingStation> = {}): Promise<IChargingStation[]> {
    return await ChargingStation.find(filter).exec();
  }

  /**
   * Find a charging station by its ID
   * 
   * @param stationId A charging stations id
   * @returns Returns the charging stations data if found, or null if not
   */
  async findById(stationId: string): Promise<IChargingStation | null> {
    return await ChargingStation.findById(stationId).exec();
  }

  /**
   * Find multiple stations by their IDs
   * 
   * @param stationIds An array of charging station IDs to search for
   * @returns Returns a an array of charging station data which match the provided IDs
   */
  async findByIdIn(stationIds: string[]): Promise<IChargingStation[]> {
    return await ChargingStation.find({
      _id: { $in: stationIds },
    });
  }

  /**
   * Find the nearest charging station
   * 
   * @param filter Find a single charging station that fulfills the input condition (being the closest to a set location)
   * @returns Returns the details of the single closest charing station
   */
  async findNearest(filter: FilterQuery<IChargingStation> = {}): Promise<IChargingStation | null> {
    return await ChargingStation.findOne(filter).exec();
  }
}

export default new ChargingStationRepository();
