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
const axios_1 = __importDefault(require("axios"));
//const RECOMMENDATION_API_URL = process.env.RECOMMENDATION_API_URL || "http://127.0.0.1:8002";
const PYTHON_API = process.env.PYTHON_API_URL;
class RecommendationRankingService {
    static rankStations(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const response = yield axios_1.default.post(`${PYTHON_API}/charging-station-recommendations/rank`, payload);
                return response.data;
            }
            catch (error) {
                const detail = (_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.detail;
                throw new Error(typeof detail === "string"
                    ? detail
                    : detail
                        ? JSON.stringify(detail)
                        : "Failed to fetch charging station recommendations");
            }
        });
    }
}
exports.default = RecommendationRankingService;
