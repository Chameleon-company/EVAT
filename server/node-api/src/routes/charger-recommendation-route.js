"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth-middleware");
const charger_recommendation_service_1 = __importDefault(require("../services/charger-recommendation-service"));
const charger_recommendation_controller_1 = __importDefault(require("../controllers/charger-recommendation-controller"));
const router = (0, express_1.Router)();
const chargerRecommendationService = new charger_recommendation_service_1.default();
const chargerRecommendationController = new charger_recommendation_controller_1.default(chargerRecommendationService);
router.post("/", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => chargerRecommendationController.getRecommendations(req, res));
router.post("/:sessionId/selection", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => chargerRecommendationController.saveSelection(req, res));
exports.default = router;
