import PredictRepository from "../repositories/predict-repository";
import Congestion, { ICongestion } from "../models/congestion-model";
import mongoose from "mongoose";
import fetch from "node-fetch";


export default class PredictService {
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
        const response = await fetch("http://localhost:5000/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                distance_km,
                electricity_price_per_kwh,
                petrol_price_per_l,
                ev_make,
                ev_model,
                ev_variant,
                ice_make,
                ice_model,
                ice_variant,
            }),
        });

        if (!response.ok) {
            const error = await response.json() as any;
            throw new Error(error.detail || `ML service error: ${response.status}`);
        }

        return await response.json();

    } catch (error: any) {
        if (error instanceof Error) {
            throw new Error("Error calling ML service: " + error.message);
        } else {
            throw new Error("Unknown error calling ML service");
        }
    }
}
async getCostCharts(
    distance_km: number,
    electricity_price_per_kwh: number,
    ice_eff_l_per_100km: number,
    petrol_price_per_l: number
): Promise<any> {
    try {
        const response = await fetch("http://localhost:5000/charts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                distance_km,
                electricity_price_per_kwh,
                ice_eff_l_per_100km,
                petrol_price_per_l,
            }),
        });

        if (!response.ok) {
            const error = await response.json() as any;
            throw new Error(error.detail || `ML service error: ${response.status}`);
        }

        return await response.json();

    } catch (error: any) {
        if (error instanceof Error) {
            throw new Error("Error fetching chart data: " + error.message);
        } else {
            throw new Error("Unknown error fetching chart data");
        }
    }
}

async getEvVehicles(): Promise<any> {
    try {
        const response = await fetch("http://localhost:5000/vehicles/ev");
        if (!response.ok) throw new Error(`ML service error: ${response.status}`);
        return await response.json();
    } catch (error: any) {
        throw new Error("Error fetching EV vehicles: " + error.message);
    }
}

async getIceVehicles(): Promise<any> {
    try {
        const response = await fetch("http://localhost:5000/vehicles/ice");
        if (!response.ok) throw new Error(`ML service error: ${response.status}`);
        return await response.json();
    } catch (error: any) {
        throw new Error("Error fetching ICE vehicles: " + error.message);
    }
}

async getEvEfficiency(make: string, model: string, variant?: string): Promise<any> {
    try {
        const response = await fetch("http://localhost:5000/vehicles/ev/efficiency", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ make, model, variant }),
        });
        if (!response.ok) throw new Error(`ML service error: ${response.status}`);
        return await response.json();
    } catch (error: any) {
        throw new Error("Error fetching EV efficiency: " + error.message);
    }
}

async getIceEfficiency(make: string, model: string, variant?: string): Promise<any> {
    try {
        const response = await fetch("http://localhost:5000/vehicles/ice/efficiency", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ make, model, variant }),
        });
        if (!response.ok) throw new Error(`ML service error: ${response.status}`);
        return await response.json();
    } catch (error: any) {
        throw new Error("Error fetching ICE efficiency: " + error.message);
    }
}

async getDemandForecast(postcode: string, date: string): Promise<any> {
    try {
        const response = await fetch("http://localhost:5001/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postcode, date }),
        });
        if (!response.ok) {
            const error = await response.json() as any;
            throw new Error(error.detail || `ML service error: ${response.status}`);
        }
        return await response.json();
    } catch (error: any) {
        throw new Error("Error calling demand forecast ML service: " + error.message);
    }
}

async getDemandPostcodes(): Promise<any> {
    try {
        const response = await fetch("http://localhost:5001/postcodes");
        if (!response.ok) throw new Error(`ML service error: ${response.status}`);
        return await response.json();
    } catch (error: any) {
        throw new Error("Error fetching demand postcodes: " + error.message);
    }
}

async getDemandCoords(postcode: string): Promise<any> {
    try {
        const response = await fetch(`http://localhost:5001/coords/${postcode}`);
        if (!response.ok) throw new Error(`ML service error: ${response.status}`);
        return await response.json();
    } catch (error: any) {
        throw new Error("Error fetching postcode coordinates: " + error.message);
    }
}

}