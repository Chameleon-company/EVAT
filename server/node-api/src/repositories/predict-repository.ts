import { stat } from "fs";
import Congestion, { ICongestion } from "../models/congestion-model";
import { FilterQuery, UpdateQuery, Types } from "mongoose";
import mongoose from "mongoose";
import { ObjectId, ObjectIdLike } from "bson";
//mongoose.set('debug', true); // Add this at the top of your file

class PredictRepository {
  /**
 * Get congestion levels for each station ID provided
 * 
 * @param stationIDs array of station IDs
 * @returns Object containing station IDs and their congestion levels
 */
  async getCongestionByIDs(
    stationIDs: string[]
  ): Promise<{ congestionLevels: ICongestion[]; }> {

    const congestionLevels = await
      Congestion.find({ $in: stationIDs })
        .exec();

    return {
      congestionLevels
    };
  }

  /**
  * Delete congestion level for a station ID provided
  * 
  * @param stationID string of station ID
  * @returns boolean success value
  */
  async deleteCongestionLevel(chargerID: string): Promise<boolean> {
    const status = await Congestion.deleteMany({
      chargerId: new mongoose.Types.ObjectId(chargerID)
    });

    return status.deletedCount > 0;
  }

  /**
  * Updates congestion level for a station ID provided
  * 
  * @param stationID string of station ID
  * @param level congestion level as a string, 'low', 'medium', 'high'
  * @returns boolean success value
  */
  async putCongestionLevel(chargerID: string, level: string): Promise<boolean> {
    const status = await Congestion.updateOne({
      chargerId: new mongoose.Types.ObjectId(chargerID)
    }, {
      congestion_level: level
    }, {
      upsert: true // Insert if entry doesn't exist
    });

    // If a congestion level is set to what it was already, the modifiedCount will be 0,
    // causing an error for non-issues. The best way to resolve this is to just check that
    // the matched count is greater than 0, meaning it found the value to update in the DB
    return status.matchedCount > 0;
  }

  /**
  * updates a congestion levels for multiple chargers
  * 
  * @param levels Array of dictionaries with a charger_id and level
  * @returns boolean success value
  */
  async postCongestionLevelsBatch(levels: any): Promise<boolean> {
    const updates = levels.map((item: { station_id: string; congestion_level: any; }) => ({
      updateOne: {
        filter: { chargerId: new mongoose.Types.ObjectId(item.station_id) },
        update: { congestion_level: item.congestion_level },
        upsert: true
      }
    }));
    const result = await Congestion.bulkWrite(updates);

    // If a congestion level is set to what it was already, the modifiedCount will be 0,
    // causing an error for non-issues. The best way to resolve this is to just check that
    // the matched count is greater than 0, meaning it found the value to update in the DB
    return result.matchedCount > 0;
  }
}

export default new PredictRepository();