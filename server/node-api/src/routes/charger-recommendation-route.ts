import { Router } from "express";
import { authGuard } from "../middlewares/auth-middleware";
import ChargerRecommendationService from "../services/charger-recommendation-service";
import ChargerRecommendationController from "../controllers/charger-recommendation-controller";

const router = Router();
const chargerRecommendationService = new ChargerRecommendationService();
const chargerRecommendationController = new ChargerRecommendationController(
  chargerRecommendationService
);

router.post("/", authGuard(["user", "admin"]), (req, res) =>
  chargerRecommendationController.getRecommendations(req, res)
);

router.post("/:sessionId/selection", authGuard(["user", "admin"]), (req, res) =>
  chargerRecommendationController.saveSelection(req, res)
);

export default router;