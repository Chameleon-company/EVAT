"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class PredictController {
    constructor(predictService) {
        this.predictService = predictService;
    }
    getCongestionLevels(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const chargerIDs = req.body.stationIds;
                if (typeof (chargerIDs) == "object") {
                    if (chargerIDs.length >= 1) {
                        const result = yield this.predictService.getCongestionLevels(chargerIDs);
                        return res.status(200).json({
                            message: "Successfully received congestion levels",
                            data: result
                        });
                    }
                    return res.status(400).json({ message: "Insufficient number of charger IDs given. Minimum is 1" });
                }
                return res.status(400).json({ message: "Request parameter must be a string array" });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    deleteCongestionLevel(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const chargerID = req.query.id;
                if (typeof (chargerID) === "string") {
                    const result = yield this.predictService.deleteCongestionLevel(chargerID);
                    if (result == false) {
                        return res.status(500).json({ message: "Unknown error occurred, does this ID exist?" });
                    }
                    else {
                        return res.status(201).json({ message: "Congestion level deleted successfully" });
                    }
                }
                else {
                    return res.status(400).json({ message: "ID parameter must be a string" });
                }
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    putCongestionLevel(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const chargerID = req.query.id;
                const level = req.query.level;
                if (typeof (chargerID) === "string") {
                    if ((level == "low") || (level == "medium") || (level == "high")) {
                        const result = yield this.predictService.putCongestionLevel(chargerID, level);
                        if (result == false) {
                            return res.status(500).json({ message: "Unknown error occurred" });
                        }
                        else {
                            return res.status(201).json({ message: "Congestion level updated successfully" });
                        }
                    }
                    else {
                        return res.status(400).json({ message: "Level must be 'low', 'medium', or 'high'" });
                    }
                }
                else {
                    return res.status(400).json({ message: "ID parameter must be a string" });
                }
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    postCongestionLevelsBatch(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const levels = req.body.predictions;
                for (let i = 0; i < levels.length; i++) {
                    if (typeof (levels[i].station_id) != "string") {
                        return res.status(400).json({ message: "ID must be a string for " + i });
                    }
                    if ((levels[i].congestion_level == "low") || (levels[i].congestion_level == "medium") || (levels[i].congestion_level == "high")) {
                        break;
                    }
                    else {
                        return res.status(400).json({ message: "Level must be 'low', 'medium', or 'high' for " + i });
                    }
                }
                const result = yield this.predictService.postCongestionLevelsBatch(levels);
                if (result == false) {
                    return res.status(500).json({ message: "Unknown error occurred" });
                }
                else {
                    return res.status(201).json({ message: "Congestion level updated successfully" });
                }
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    getCostComparison(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { distance_km, electricity_price_per_kwh, petrol_price_per_l, ev_make, ev_model, ev_variant, ice_make, ice_model, ice_variant, } = req.body;
                if (distance_km === undefined ||
                    electricity_price_per_kwh === undefined ||
                    petrol_price_per_l === undefined) {
                    return res.status(400).json({
                        message: "Missing required fields: distance_km, electricity_price_per_kwh, petrol_price_per_l"
                    });
                }
                const result = yield this.predictService.getCostComparison(distance_km, electricity_price_per_kwh, 0, petrol_price_per_l, ev_make, ev_model, ev_variant, ice_make, ice_model, ice_variant);
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    getCostCharts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { distance_km, electricity_price_per_kwh, petrol_price_per_l, ev_make, ev_model, ev_variant, ice_make, ice_model, ice_variant, } = req.body;
                if (distance_km === undefined ||
                    electricity_price_per_kwh === undefined ||
                    petrol_price_per_l === undefined) {
                    return res.status(400).json({ message: "Missing required fields" });
                }
                const result = yield this.predictService.getCostCharts(distance_km, electricity_price_per_kwh, 0, petrol_price_per_l);
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    getEvVehicles(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.predictService.getEvVehicles();
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    getIceVehicles(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.predictService.getIceVehicles();
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    getEvEfficiency(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { make, model, variant } = req.body;
                if (!make || !model) {
                    return res.status(400).json({ message: "make and model are required" });
                }
                const result = yield this.predictService.getEvEfficiency(make, model, variant);
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    getIceEfficiency(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { make, model, variant } = req.body;
                if (!make || !model) {
                    return res.status(400).json({ message: "make and model are required" });
                }
                const result = yield this.predictService.getIceEfficiency(make, model, variant);
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    getDemandForecast(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { postcode, date } = req.body;
                if (!postcode || !date) {
                    return res.status(400).json({ message: "Missing required fields: postcode, date" });
                }
                const result = yield this.predictService.getDemandForecast(postcode, date);
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    getDemandPostcodes(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.predictService.getDemandPostcodes();
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    getDemandCoords(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { postcode } = req.params;
                if (!postcode) {
                    return res.status(400).json({ message: "Postcode is required" });
                }
                const result = yield this.predictService.getDemandCoords(postcode);
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
}
exports.default = PredictController;
