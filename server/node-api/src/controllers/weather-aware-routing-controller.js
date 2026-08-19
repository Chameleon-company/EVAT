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
const weather_aware_routing_service_1 = __importDefault(require("../services/weather-aware-routing-service"));
class WeatherAwareRoutingController {
    static predict(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { origin, destination, ac_on } = req.body;
                // validation
                if (!origin || !destination) {
                    return res.status(400).json({
                        message: "origin and destination are required",
                    });
                }
                if (typeof origin !== "string" || origin.trim() === "") {
                    return res.status(400).json({
                        message: "origin must be a non-empty string",
                    });
                }
                if (typeof destination !== "string" || destination.trim() === "") {
                    return res.status(400).json({
                        message: "destination must be a non-empty string",
                    });
                }
                if (ac_on !== undefined && typeof ac_on !== "boolean") {
                    return res.status(400).json({
                        message: "ac_on must be a boolean value",
                    });
                }
                const result = yield weather_aware_routing_service_1.default.getPrediction({
                    origin: origin.trim(),
                    destination: destination.trim(),
                    ac_on: ac_on !== null && ac_on !== void 0 ? ac_on : true,
                });
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(500).json({
                    message: error.message || "Internal server error",
                });
            }
        });
    }
}
exports.default = WeatherAwareRoutingController;
