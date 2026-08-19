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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
class EnvImpactAnalysisController {
    constructor(envImpactAnalysisService) {
        this.envImpactAnalysisService = envImpactAnalysisService;
    }
    compare(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { evVehicleId, iceVehicleId } = req.body;
                if (!evVehicleId || typeof evVehicleId !== "string") {
                    return res.status(400).json({
                        message: "evVehicleId is required and must be a string",
                    });
                }
                if (!iceVehicleId || typeof iceVehicleId !== "string") {
                    return res.status(400).json({
                        message: "iceVehicleId is required and must be a string",
                    });
                }
                const evId = evVehicleId.trim();
                const iceId = iceVehicleId.trim();
                if (!mongoose_1.default.Types.ObjectId.isValid(evId) ||
                    !mongoose_1.default.Types.ObjectId.isValid(iceId)) {
                    return res.status(400).json({
                        message: "Invalid evVehicleId or iceVehicleId",
                    });
                }
                const result = yield this.envImpactAnalysisService.getComparison(evId, iceId);
                return res.status(200).json({
                    message: "Environmental impact comparison retrieved successfully",
                    data: result,
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "An unknown error occurred";
                if (message.includes("not found") ||
                    message.includes("is not an electric") ||
                    message.includes("Please select an ICE")) {
                    return res.status(404).json({ message });
                }
                return res.status(500).json({ message });
            }
        });
    }
}
exports.default = EnvImpactAnalysisController;
