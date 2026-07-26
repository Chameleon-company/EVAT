import { Request, Response } from "express";
import PredictService from "../services/predict-service";

export default class PredictController {
    constructor(private readonly predictService: PredictService) { }

    async getCongestionLevels(req: Request, res: Response): Promise<Response> {
        try {
            const chargerIDs = req.body.stationIds;
            if (typeof (chargerIDs) == "object") {
                if (chargerIDs.length >= 1) {
                    const result = await this.predictService.getCongestionLevels(chargerIDs);
                    return res.status(200).json({
                        message: "Successfully received congestion levels",
                        data: result
                    });
                }
                return res.status(400).json({ message: "Insufficient number of charger IDs given. Minimum is 1" });
            }
            return res.status(400).json({ message: "Request parameter must be a string array" });
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async deleteCongestionLevel(req: Request, res: Response): Promise<Response> {
        try {
            const chargerID = req.query.id;
            if (typeof (chargerID) === "string") {
                const result = await this.predictService.deleteCongestionLevel(chargerID);
                if (result == false) {
                    return res.status(500).json({ message: "Unknown error occurred, does this ID exist?" });
                } else {
                    return res.status(201).json({ message: "Congestion level deleted successfully" });
                }
            } else {
                return res.status(400).json({ message: "ID parameter must be a string" });
            }
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async putCongestionLevel(req: Request, res: Response): Promise<Response> {
        try {
            const chargerID = req.query.id;
            const level = req.query.level;
            if (typeof (chargerID) === "string") {
                if ((level == "low") || (level == "medium") || (level == "high")) {
                    const result = await this.predictService.putCongestionLevel(chargerID, level);
                    if (result == false) {
                        return res.status(500).json({ message: "Unknown error occurred" });
                    } else {
                        return res.status(201).json({ message: "Congestion level updated successfully" });
                    }
                } else {
                    return res.status(400).json({ message: "Level must be 'low', 'medium', or 'high'" });
                }
            } else {
                return res.status(400).json({ message: "ID parameter must be a string" });
            }
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async postCongestionLevelsBatch(req: Request, res: Response): Promise<Response> {
        try {
            const levels = req.body.predictions;
            for (let i = 0; i < levels.length; i++) {
                if (typeof (levels[i].station_id) != "string") {
                    return res.status(400).json({ message: "ID must be a string for " + i });
                }
                if ((levels[i].congestion_level == "low") || (levels[i].congestion_level == "medium") || (levels[i].congestion_level == "high")) {
                    break;
                } else {
                    return res.status(400).json({ message: "Level must be 'low', 'medium', or 'high' for " + i });
                }
            }
            const result = await this.predictService.postCongestionLevelsBatch(levels);
            if (result == false) {
                return res.status(500).json({ message: "Unknown error occurred" });
            } else {
                return res.status(201).json({ message: "Congestion level updated successfully" });
            }
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getCostComparison(req: Request, res: Response): Promise<Response> {
        try {
            const {
                distance_km,
                electricity_price_per_kwh,
                petrol_price_per_l,
                ev_make,
                ev_model,
                ev_variant,
                ice_make,
                ice_model,
                ice_variant,
            } = req.body;

            if (
                distance_km === undefined ||
                electricity_price_per_kwh === undefined ||
                petrol_price_per_l === undefined
            ) {
                return res.status(400).json({
                    message: "Missing required fields: distance_km, electricity_price_per_kwh, petrol_price_per_l"
                });
            }

            const result = await this.predictService.getCostComparison(
                distance_km,
                electricity_price_per_kwh,
                0,
                petrol_price_per_l,
                ev_make,
                ev_model,
                ev_variant,
                ice_make,
                ice_model,
                ice_variant,
            );

            return res.status(200).json(result);

        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getCostCharts(req: Request, res: Response): Promise<Response> {
        try {
            const {
                distance_km,
                electricity_price_per_kwh,
                petrol_price_per_l,
                ev_make,
                ev_model,
                ev_variant,
                ice_make,
                ice_model,
                ice_variant,
            } = req.body;

            if (
                distance_km === undefined ||
                electricity_price_per_kwh === undefined ||
                petrol_price_per_l === undefined
            ) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            const result = await this.predictService.getCostCharts(
                distance_km,
                electricity_price_per_kwh,
                0,
                petrol_price_per_l,
            );

            return res.status(200).json(result);

        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getEvVehicles(req: Request, res: Response): Promise<Response> {
        try {
            const result = await this.predictService.getEvVehicles();
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getIceVehicles(req: Request, res: Response): Promise<Response> {
        try {
            const result = await this.predictService.getIceVehicles();
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getEvEfficiency(req: Request, res: Response): Promise<Response> {
        try {
            const { make, model, variant } = req.body;
            if (!make || !model) {
                return res.status(400).json({ message: "make and model are required" });
            }
            const result = await this.predictService.getEvEfficiency(make, model, variant);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getIceEfficiency(req: Request, res: Response): Promise<Response> {
        try {
            const { make, model, variant } = req.body;
            if (!make || !model) {
                return res.status(400).json({ message: "make and model are required" });
            }
            const result = await this.predictService.getIceEfficiency(make, model, variant);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getDemandForecast(req: Request, res: Response): Promise<Response> {
    try {
        const { postcode, date } = req.body;
        if (!postcode || !date) {
            return res.status(400).json({ message: "Missing required fields: postcode, date" });
        }
        const result = await this.predictService.getDemandForecast(postcode, date);
        return res.status(200).json(result);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
}

async getDemandPostcodes(req: Request, res: Response): Promise<Response> {
    try {
        const result = await this.predictService.getDemandPostcodes();
        return res.status(200).json(result);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
}

async getDemandCoords(req: Request, res: Response): Promise<Response> {
    try {
        const { postcode } = req.params;
        if (!postcode) {
            return res.status(400).json({ message: "Postcode is required" });
        }
        const result = await this.predictService.getDemandCoords(postcode);
        return res.status(200).json(result);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
}
}