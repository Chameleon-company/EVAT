import PredictRepository from "../repositories/predict-repository";
import Congestion, { ICongestion } from "../models/congestion-model";
import mongoose from "mongoose";
// import fetch from "node-fetch";
// Replaced fetch/node-fetch with axios for timeout and error handling
import axios from 'axios';
// Format response
import { PredictionRequestPayload, PythonPredictionResponse, FormattedPredictionResponse } from '../types/predict';


export default class PredictService {
    // Separate Python API backends for cost comparison and demand forecasting
    private readonly COST_API_URL = process.env.PYTHON_COST_API_URL || "http://localhost:5000";
    private readonly DEMAND_API_URL = process.env.PYTHON_DEMAND_API_URL || "http://localhost:5000";
    private readonly TIMEOUT_MS = 2000;

    /**
     * Get a congestion levels for multiple chargers
     * 
     * @param chargerIDs Array of one or more charger ID strings
     * @returns Object containing charger ID's and their respective congestion levels
     */
    async getCongestionLevels(
        chargerIDs: string[]
    ): Promise<{
        congestionLevels: ICongestion[];
    }> {
        try {
            if (chargerIDs.length < 1) {
                throw new Error("Array must contain at least one station ID")
            }
            let result = await PredictRepository.getCongestionByIDs(chargerIDs);

            // Filter to only keep entries that match the requested chargerIDs
            result.congestionLevels = result.congestionLevels.filter(
                (level) => chargerIDs.includes(level.chargerId.toString())
            );

            // Add entries for any requested chargerIDs that weren't found
            for (let i = 0; i < chargerIDs.length; i++) {
                if (!result.congestionLevels.some(
                    (level) => level.chargerId.toString() === chargerIDs[i]
                )) {
                    const newCongestion = new Congestion({
                        chargerId: new mongoose.Types.ObjectId(chargerIDs[i]),
                        congestion_level: "unknown"
                    });
                    result.congestionLevels.push(newCongestion);
                }
            }
            return result

        }
        catch (error: any) {
            if (error instanceof Error) {
                throw new Error("Error retrieving congestion levels: " + error.message);
            } else {
                throw new Error("An unknown error occurred while retrieving congestion levels");
            }
        }
    }

    /**
     * Deletes a congestion level for a chargers
     * 
     * @param chargerID Array of one or more charger ID strings
     * @returns boolean containing true for success or false for failure
     */
    async deleteCongestionLevel(chargerID: string
    ): Promise<boolean> {
        try {
            let result = await PredictRepository.deleteCongestionLevel(chargerID);
            return result;
        } catch (error: any) {
            if (error instanceof Error) {
                throw new Error("Error retrieving congestion levels: " + error.message);
            } else {
                throw new Error("An unknown error occurred while retrieving congestion levels");
            }
        }
    }

    /**
     * Updates a congestion level for a chargers
     * 
     * @param chargerID Array of one or more charger ID strings
     * @param level String of either 'low', 'medium', 'high'
     * @returns boolean containing true for success or false for failure
     */
    async putCongestionLevel(chargerID: string, level: string
    ): Promise<boolean> {
        try {
            let result = await PredictRepository.putCongestionLevel(chargerID, level);
            return result;
        } catch (error: any) {
            if (error instanceof Error) {
                throw new Error("Error updating congestion levels: " + error.message);
            } else {
                throw new Error("An unknown error occurred while updating congestion levels");
            }
        }
    }

    /**
     * updates a congestion levels for multiple chargers
     * 
     * @param level Array of dictionaries with a charger_id and level
     * @returns boolean containing true for success or false for failure
     */
    async postCongestionLevelsBatch(levels: Array<object>
    ): Promise<boolean> {
        try {
            let result = await PredictRepository.postCongestionLevelsBatch(levels);
            return result;
        } catch (error: any) {
            if (error instanceof Error) {
                throw new Error("Error updating congestion levels: " + error.message);
            } else {
                throw new Error("An unknown error occurred while updating congestion levels");
            }
        }
    }

    /**
     * Calls the Python ML microservice to calculate EV vs ICE cost comparison
     *
     * @param distance_km Trip distance in kilometres
     * @param electricity_price_per_kwh Electricity rate in $/kWh
     * @param ice_eff_l_per_100km ICE fuel efficiency in L/100km
     * @param petrol_price_per_l Petrol price in $/L
     * @returns Predicted savings, costs, emissions from the ML model
     */
    async getCostComparison(
        distance_km: number,
        electricity_price_per_kwh: number,
        ice_eff_l_per_100km: number,
        petrol_price_per_l: number,
        ev_make?: string,
        ev_model?: string,
        ev_variant?: string,
        ice_make?: string,
        ice_model?: string,
        ice_variant?: string,
    ): Promise<any> {
        try {
            const response = await axios.post(
                `${this.COST_API_URL}/costComparison/predict`,
                {
                    distance_km,
                    electricity_price_per_kwh,
                    petrol_price_per_l,
                    ev_make,
                    ev_model,
                    ev_variant,
                    ice_make,
                    ice_model,
                    ice_variant,
                },
                { timeout: this.TIMEOUT_MS }
            );
            return response.data;
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || error.message;
            throw new Error("Error calling ML service: " + errorMsg);
        }
    }

    /**
     * Get the chart comparison from the Python ML service
     * 
     * @param distance_km - Trip distance in kilometres
     * @param electricity_price_per_kwh - Electricity rate in $/kWh
     * @param ice_eff_l_per_100km - ICE fuel efficiency in L/100km
     * @param petrol_price_per_l - Petrol price in $/L
     * @returns Chart payload dataset
     */
    async getCostCharts(
        distance_km: number,
        electricity_price_per_kwh: number,
        ice_eff_l_per_100km: number,
        petrol_price_per_l: number
    ): Promise<any> {
        try {
            const response = await axios.post(
                `${this.COST_API_URL}/costComparison/charts`,
                { distance_km, electricity_price_per_kwh, ice_eff_l_per_100km, petrol_price_per_l },
                { timeout: this.TIMEOUT_MS }
            );
            return response.data;
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || error.message;
            throw new Error("Error fetching chart data: " + errorMsg);
        }
    }

    /**
     * Get supported electric vehicles list
     * 
     * @returns List of supported Electric vehicles
     */
    async getEvVehicles(): Promise<any> {
        try {
            const response = await axios.get(`${this.COST_API_URL}/costComparison/vehicles/ev`, { timeout: this.TIMEOUT_MS });
            return response.data;
        } catch (error: any) {
            throw new Error("Error fetching EV vehicles: " + error.message);
        }
    }

    /**
     * Get supported ICE vehicles list
     * 
     * @returns List of supported ICE vehicles
     */
    async getIceVehicles(): Promise<any> {
        try {
            const response = await axios.get(`${this.COST_API_URL}/costComparison/vehicles/ice`, { timeout: this.TIMEOUT_MS });
            return response.data;
        } catch (error: any) {
            throw new Error("Error fetching ICE vehicles: " + error.message);
        }
    }

    /**
     * Get efficiency specifications for a specific EV vehicle
     * 
     * @param make - The manufacturer of the electric vehicle
     * @param model - The model of the electric vehicle
     * @param variant - Optional specific variant or trim of the vehicle
     * @returns EV efficiency data from the ML model
     */
    async getEvEfficiency(make: string, model: string, variant?: string): Promise<any> {
        try {
            const response = await axios.post(
                `${this.COST_API_URL}/costComparison/vehicles/ev/efficiency`,
                { make, model, variant },
                { timeout: this.TIMEOUT_MS }
            );
            return response.data;
        } catch (error: any) {
            throw new Error("Error fetching EV efficiency: " + error.message);
        }
    }

    /**
     * Get efficiency specifications for a specific ICE vehicle
     * Fetches efficiency specifications for a specific ICE vehicle
     * 
     * @param make - The manufacturer of the ICE vehicle
     * @param model - The model of the ICE vehicle
     * @param variant - Optional specific variant or trim of the vehicle
     * @returns ICE efficiency/fuel consumption data from the ML model
     */
    async getIceEfficiency(make: string, model: string, variant?: string): Promise<any> {
        try {
            const response = await axios.post(
                `${this.COST_API_URL}/costComparison/vehicles/ice/efficiency`,
                { make, model, variant },
                { timeout: this.TIMEOUT_MS }
            );
            return response.data;
        } catch (error: any) {
            throw new Error("Error fetching ICE efficiency: " + error.message);
        }
    }

    /**
     * Grab the demand forecast from the Python Machine Learning service
     * Implements a timeout and fallback to prevent Node.js from crashing
     * due to external weather API latency issue
     *
     * @param postcode - 4-digit Australian postcode (sanitised)
     * @param date - The validated date string in YYYY-MM-DD format
     * @returns - FormattedPredictionResponse with the exact forecast or a safe fallback
     */
    async getDemandForecast(postcode: string, date: string): Promise<FormattedPredictionResponse> {
    
        const payload: PredictionRequestPayload = { postcode, date };

        try {
            // Send request to Python backend with timeout
            const response = await axios.post<PythonPredictionResponse>(
                `${this.DEMAND_API_URL}/demandForecasting/predict`,
                payload,
                { timeout: this.TIMEOUT_MS }
            );
            return {
                postcode: response.data.postcode,
                date: response.data.date,
                predictedDemandKwh: response.data.predicted_demand_kwh,
                isFallback: false,
                message: "Prediction successfully generated by ML service."
            };
        } catch (error: any) {
            // If the Python service responded with an error (i.e. 400 Bad Request)
            if (error.response) {
                throw new Error(error.response.data.detail || "Model validation failed.");
            }

            // Fallback: return a 'safe' average baseline if Python/Open-Meteo hangs for some reason
            console.warn("[PredictService] Python API failed or timed out for postcode ${postcode}. Applying baseline fallback.", error.message);
            return {
                postcode,
                date,
                predictedDemandKwh: 50.0, // 'safe' average baseline
                isFallback: true,
                message: "Forecasting service timeout, using baseline fallback."
            };
        }
    }

    /**
     * Get a list of available postcodes for demand forecasting.
     * 
     * @returns Array of supported 4-digit postcode strings
     */
    async getDemandPostcodes(): Promise<string[]> {
        try {
            const response = await axios.get<{ postcodes: string[] }>(
                `${this.DEMAND_API_URL}/demandForecasting/postcodes`, 
                { timeout: this.TIMEOUT_MS }
            );
            return response.data.postcodes;
        } catch (error: any) {
            // Temp fallback: if API is down, return Melbourne defaults
            console.error("[PredictService] Could not fetch postcodes from Python service.");
            return ["3000", "3001", "3002"];
        }
    }

    /**
     * Get geographic coordinates (latitude and longitude) for a given postcode.
     *
     * @param postcode - The 4-digit Australian postcode
     * @returns Coordinate containing lat and lon
     */
    async getDemandCoords(postcode: string): Promise<{ lat: number; lon: number }> {
        try {
            const response = await axios.get<{ lat: number, lon: number }>(
                `${this.DEMAND_API_URL}/demandForecasting/coords/${postcode}`,
                { timeout: this.TIMEOUT_MS }
            );
            return { lat: response.data.lat, lon: response.data.lon };
        } catch (error: any) {
            // Temp fallback: return Melbourne CBD coordinates if the lookup fails
            return { lat: -37.8136, lon: 144.9631 };
        }
    }
}