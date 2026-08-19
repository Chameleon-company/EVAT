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
class ChargerRecommendationController {
    constructor(chargerRecommendationService) {
        this.chargerRecommendationService = chargerRecommendationService;
    }
    getRecommendations(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { latitude, longitude, radiusKm } = req.body;
            const userId = req.user.id;
            if (latitude === undefined || longitude === undefined) {
                return res.status(400).json({
                    message: "latitude and longitude are required.",
                });
            }
            try {
                const recommendations = yield this.chargerRecommendationService.getRecommendations({
                    userId,
                    latitude: Number(latitude),
                    longitude: Number(longitude),
                    radiusKm: radiusKm !== undefined ? Number(radiusKm) : undefined,
                });
                return res.status(200).json({
                    message: "success",
                    data: recommendations,
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
    saveSelection(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sessionId } = req.params;
            const { stationId } = req.body;
            const userId = req.user.id;
            if (!stationId) {
                return res.status(400).json({ message: "stationId is required." });
            }
            try {
                yield this.chargerRecommendationService.saveSelection(sessionId, stationId, userId);
                return res.status(200).json({
                    message: "Station selection saved successfully",
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    }
}
exports.default = ChargerRecommendationController;
