import { FilterQuery } from "mongoose";
import ChargingStationRepository from "../repositories/station-repository";
import { StationFilterOptions } from "../models/station-model";

// Helper functions
const makeFlexibleRegexList = (values: string[]) =>
  values.map(
    (val) => new RegExp(`(^|,\\s*)${escapeRegex(val)}(\\s*,|$)`, 'i')
  );

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default class ChargingStationService {
  async getAllStations(options: StationFilterOptions) {

    const query: FilterQuery<any> = {};
  
    if (options.connectorTypes?.length) {
      query.connection_type = {
        $in: makeFlexibleRegexList(options.connectorTypes),
      };
    }
  
    if (options.chargingCurrents?.length) {
      query.current_type = {
        $in: makeFlexibleRegexList(options.chargingCurrents),
      };
    }
  
    if (options.operators?.length) {
      query.operator = {
        $in: makeFlexibleRegexList(options.operators),
      };
    }
  
    if (
      options.location?.latitude !== undefined &&
      options.location?.longitude !== undefined &&
      options.location?.radiusKm !== undefined
    ) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [
              options.location.longitude,
              options.location.latitude,
            ],
          },
          $maxDistance: options.location.radiusKm * 1000,
        },
      };
    }
  
    return await ChargingStationRepository.findAll(query);
  }
  
  async getStationById(stationId: string) {
    return await ChargingStationRepository.findById(stationId);
  }

  async getStationsWithIdIn(stationIds: string[]) {
    return await ChargingStationRepository.findByIdIn(stationIds);
  }

  async getNearestStation(options: StationFilterOptions) {
    const query: FilterQuery<any> = {};
  
    if (options.connectorTypes?.length) {
      query.connection_type = {
        $in: makeFlexibleRegexList(options.connectorTypes),
      };
    }
  
    if (options.chargingCurrents?.length) {
      query.current_type = {
        $in: makeFlexibleRegexList(options.chargingCurrents),
      };
    }
  
    if (options.operators?.length) {
      query.operator = {
        $in: makeFlexibleRegexList(options.operators),
      };
    }
  
    if (
      options.location?.latitude !== undefined &&
      options.location?.longitude !== undefined
    ) {
      query.location = {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [options.location.longitude, options.location.latitude],
          },
        },
      };
    }
    return await ChargingStationRepository.findNearest(query);
  }
}
