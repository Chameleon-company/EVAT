"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth-middleware");
const price_prediction_service_1 = __importDefault(require("../services/price-prediction-service"));
const price_prediction_controller_1 = __importDefault(require("../controllers/price-prediction-controller"));
const router = (0, express_1.Router)();
const pricePredictionService = new price_prediction_service_1.default();
const pricePredictionController = new price_prediction_controller_1.default(pricePredictionService);
/**
 * README-aligned Node proxy for Price Prediction FastAPI (PRICE_API_URL).
 *
 * Python (README)          Node
 * ----------------------   --------------------------------
 * GET  /health          →  GET  /api/predict/price/health
 * GET  /schema          →  GET  /api/predict/price/schema
 * GET  /model/info      →  GET  /api/predict/price/model/info
 * POST /predict         →  POST /api/predict/price
 * POST /predict/batch   →  POST /api/predict/price/batch
 */
/**
 * @swagger
 * /api/predict/price/health:
 *   get:
 *     tags: [Price Prediction]
 *     summary: Health check (proxies GET /health)
 *     responses:
 *       200:
 *         description: Service status and model load state
 */
router.get("/price/health", (req, res) => {
    pricePredictionController.getHealth(req, res);
});
/**
 * @swagger
 * /api/predict/price/schema:
 *   get:
 *     tags: [Price Prediction]
 *     summary: Feature schema (proxies GET /schema)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: feature_columns, numeric/categorical split, descriptions
 */
router.get("/price/schema", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => {
    pricePredictionController.getSchema(req, res);
});
/**
 * @swagger
 * /api/predict/price/model/info:
 *   get:
 *     tags: [Price Prediction]
 *     summary: Model info (proxies GET /model/info)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: model_type, pipeline_steps, n_features_in
 */
router.get("/price/model/info", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => {
    pricePredictionController.getModelInfo(req, res);
});
/**
 * @swagger
 * /api/predict/price:
 *   post:
 *     tags: [Price Prediction]
 *     summary: Single-row prediction (proxies POST /predict)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [features]
 *             properties:
 *               row_id:
 *                 oneOf: [{ type: string }, { type: number }]
 *               features:
 *                 type: object
 *                 example:
 *                   Brand: Tesla
 *                   Model: Model 3
 *                   Year: 2022
 *                   Mileage: 15000
 *                   Fuel Type: Electric
 *                   Transmission: Automatic
 *     responses:
 *       200:
 *         description: predicted_log_price, predicted_price, missing_features, extra_features
 *       400:
 *         description: Bad request
 *       503:
 *         description: Model or schema not loaded
 */
router.post("/price", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => {
    pricePredictionController.predict(req, res);
});
/**
 * @swagger
 * /api/predict/price/batch:
 *   post:
 *     tags: [Price Prediction]
 *     summary: Batch prediction (proxies POST /predict/batch)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [records]
 *             properties:
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [features]
 *                   properties:
 *                     row_id:
 *                       oneOf: [{ type: string }, { type: number }]
 *                     features:
 *                       type: object
 *     responses:
 *       200:
 *         description: predictions, count, timestamp
 *       400:
 *         description: Bad request
 *       503:
 *         description: Model or schema not loaded
 */
router.post("/price/batch", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => {
    pricePredictionController.predictBatch(req, res);
});
exports.default = router;
