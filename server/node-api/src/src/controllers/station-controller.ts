import { Request, Response } from "express";
import { ParsedQs } from 'qs'; // Needed for the query parameters
import ChargingStationService from "../services/station-service";
import { StationFilterOptions } from "../models/station-model";

import { PlacesClient } from '@googlemaps/places'; // https://www.npmjs.com/package/@googlemaps/places

const placesClient = new PlacesClient(
    {
        fallback: true,
    }
);

export default class StationController {
    constructor(private readonly stationService: ChargingStationService) { }

    /**
     * Handles a request to retrieve all charging stations with optional filtering
     * 
     * @param req request object containing optional query parameters for filtering
     * @param res Response object used to send back the HTTP response 
     * @returns Returns the status code, a relevant message, and the data if the request was successful  
     */
    async getAllStations(req: Request, res: Response): Promise<Response> {
        // Clean input data and convert to an array
        let connectorTypes = req.query.connector
            ? String(req.query.connector)
                .split(',')
                .map((connector) => connector.trim()) // Trim spaces
                .filter((connector) => connector !== '') // Remove any empty strings
            : [];
        let chargingCurrents = req.query.current
            ? String(req.query.current)
                .split(',')
                .map((current) => current.trim()) // Trim spaces
                .filter((current) => current !== '') // Remove any empty strings
            : [];
        let operators = req.query.operator
            ? String(req.query.operator)
                .split(',')
                .map((operator) => operator.trim()) // Trim spaces
                .filter((operator) => operator !== '') : []; // Remove any empty strings

        // Convert AC to AC (Single-Phase), AC3 to AC (Three-Phase), and replace special characters
        chargingCurrents = chargingCurrents.map(value => {
            if (value == "AC") { return "AC (Single-Phase)"; }
            else if (value == "AC3") { return "AC (Three-Phase)"; }
            else { return value; }
        });

        // Logic for checking all or none of the parameters are provided
        let locationFilter = undefined;
        if (req.query.lat !== undefined || req.query.lon !== undefined || req.query.radius !== undefined) {
            // If any are defined, check if all are defined
            if (req.query.lat === undefined || req.query.lon === undefined || req.query.radius === undefined) {
                return res.status(400).json(
                    { message: "One or more of lat, lon, or radius is undefined. Either all or none need to provided." });
            }
            // All parameters are provided
            locationFilter = {
                longitude: Number(req.query.lon),
                latitude: Number(req.query.lat),
                radiusKm: Number(req.query.radius)
            };
        }

        try {
            const existingStations = await this.stationService.getAllStations({
                connectorTypes: connectorTypes,
                chargingCurrents: chargingCurrents,
                operators: operators,
                location: locationFilter
            });

            return res.status(200).json({
                message: "success",
                data: existingStations,
            });
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    /**
     * Handles a request to get a station by ID
     * 
     * @param req Request object containing the Station ID
     * @param res Response object used to send back the HTTP response 
     * @returns Returns the status code, a relevant message, and the data if the request was successful   
     */
    async getStationById(req: Request, res: Response): Promise<Response> {
        const { stationId } = req.params;

        try {
            const existingStation = await this.stationService.getStationById(
                stationId
            );

            return res.status(200).json({
                message: "success",
                data: existingStation
            });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
            return res.status(500).json({ message: error.message });
        }
    }

    /**
     * Handles a request for finding the nearest station
     * 
     * @param req Request object containing the current latitude and longitude 
     * @param res Response object used to send back the HTTP response 
     * @returns Returns the status code, a relevant message, and the data of the nearest station if the request was successful   
     */
    async getNearestStation(req: Request, res: Response): Promise<Response> {
        // Clean input data and convert to an array
        let connectorTypes = req.query.connector
            ? String(req.query.connector)
                .split(',')
                .map((connector) => connector.trim()) // Trim spaces
                .filter((connector) => connector !== '') // Remove any empty strings
            : [];
        let chargingCurrents = req.query.current
            ? String(req.query.current)
                .split(',')
                .map((current) => current.trim()) // Trim spaces
                .filter((current) => current !== '') // Remove any empty strings
            : [];
        let operators = req.query.operator
            ? String(req.query.operator)
                .split(',')
                .map((operator) => operator.trim()) // Trim spaces
                .filter((operator) => operator !== '') : []; // Remove any empty strings

        // Convert AC to AC (Single-Phase), AC3 to AC (Three-Phase), and replace special characters
        chargingCurrents = chargingCurrents.map(value => {
            if (value == "AC") { return "AC (Single-Phase)"; }
            else if (value == "AC3") { return "AC (Three-Phase)"; }
            else { return value; }
        });

        // Logic for checking if location is provided
        let locationFilter = undefined;
        if (req.query.lat == undefined || req.query.lon == undefined) {
            return res.status(400).json(
                { message: "One or more of lat, or lon is undefined. Either all or none need to provided." });
        }
        else {
            locationFilter = {
                longitude: Number(req.query.lon),
                latitude: Number(req.query.lat)
            };
        }

        try {
            const nearestStation = await this.stationService.getNearestStation({
                connectorTypes: connectorTypes,
                chargingCurrents: chargingCurrents,
                operators: operators,
                location: locationFilter
            });
            return res.status(200).json({
                message: "success",
                data: nearestStation
            });
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    /**
     * Handles getting Google Maps Charging Stations
     * 
     * @param req Request object containing query parameters
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and Google Maps API data if applicable
     */
    async GetGoogleMapsStations(req: Request, res: Response) : Promise<Response> {
        try {
            let lat: any = req.query.lat;
            let lon: any = req.query.lon;
            if ((lat == undefined) || (lon == undefined) ) {
                return res.status(400).json({ message: "Latitude or Longitude not provided."});
            }
            lat = Number(lat);
            lon = Number(lon);

            let radius: any = req.query.radius;
            if (radius == undefined) {
                return res.status(400).json({ message: "Radius not provided."})
            }
            radius = Number(radius);
            radius = radius * 1000;

            let rank: any = req.query.rank
            if (rank == 'popularity') {
                rank = 2;
            } else if (rank == 'distance') {
                rank = 1;
            } else { // Defaults to RANK_PREFERENCE_UNSPECIFIED
                rank = 0;
            }

            const request = {
                locationRestriction: { // https://developers.google.com/maps/documentation/places/web-service/nearby-search#locationrestriction
                    circle: {
                        center: {
                            latitude: lat,
                            longitude: lon
                        },
                        radius: radius,
                    }
                },
                languageCode: 'en-AU', // https://developers.google.com/maps/documentation/places/web-service/nearby-search#languagecode
                includedTypes: ['electric_vehicle_charging_station'], // https://developers.google.com/maps/documentation/places/web-service/nearby-search#includedtypes
                rankPreference: rank // https://developers.google.com/maps/documentation/places/web-service/nearby-search#rankpreference
            }

            const fieldMask = [ // https://developers.google.com/maps/documentation/places/web-service/nearby-search#fieldmask
                'places.types',
                'places.addressComponents',
                'places.attributions',
                'places.currentSecondaryOpeningHours',
                'places.regularSecondaryOpeningHours',
                'places.containingPlaces',
                'places.name',
                'places.id',
                'places.nationalPhoneNumber',
                'places.formattedAddress',
                'places.location',
                'places.googleMapsUri',
                'places.websiteUri',
                'places.currentOpeningHours',
                'places.priceLevel',
                'places.displayName',
                'places.evChargeOptions',
                'places.utcOffsetMinutes'
              ].join(',');

            const [response] = await placesClient.searchNearby(request, {
                otherArgs: {
                    headers: {
                        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
                        'X-Goog-FieldMask': fieldMask
                        }
                    }
                }
            );

            const data = response.places;
            return res.status(200).json({
                message: "success",
                data: data
            })
        }
        catch (error: any) {
            return res.status(500).json({ message: error.message})
        }
    }
}