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
class PricePredictionController {
    constructor(pricePredictionService) {
        this.pricePredictionService = pricePredictionService;
    }
    errorStatus(error) {
        const status = Number(error === null || error === void 0 ? void 0 : error.status);
        if (status >= 400 && status < 600)
            return status;
        return 500;
    }
    /** GET /api/predict/price/health → GET /health */
    getHealth(_req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.pricePredictionService.getHealth();
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(this.errorStatus(error)).json({ message: error.message });
            }
        });
    }
    /** GET /api/predict/price/schema → GET /schema */
    getSchema(_req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.pricePredictionService.getSchema();
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(this.errorStatus(error)).json({ message: error.message });
            }
        });
    }
    /** GET /api/predict/price/model/info → GET /model/info */
    getModelInfo(_req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.pricePredictionService.getModelInfo();
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(this.errorStatus(error)).json({ message: error.message });
            }
        });
    }
    /**
     * POST /api/predict/price → POST /predict
     * Body: { row_id?, features }
     */
    predict(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { features, row_id } = req.body;
                if (!features || typeof features !== "object" || Array.isArray(features)) {
                    return res.status(400).json({
                        message: "Missing required field: features (object)",
                    });
                }
                const result = yield this.pricePredictionService.predict({ features, row_id });
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(this.errorStatus(error)).json({ message: error.message });
            }
        });
    }
    /**
     * POST /api/predict/price/batch → POST /predict/batch
     * Body: { records: [{ row_id?, features }] }
     */
    predictBatch(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { records } = req.body;
                if (!Array.isArray(records) || records.length === 0) {
                    return res.status(400).json({
                        message: "Missing required field: records (non-empty array)",
                    });
                }
                for (let i = 0; i < records.length; i++) {
                    const record = records[i];
                    if (!(record === null || record === void 0 ? void 0 : record.features) || typeof record.features !== "object" || Array.isArray(record.features)) {
                        return res.status(400).json({
                            message: `records[${i}].features must be an object`,
                        });
                    }
                }
                const result = yield this.pricePredictionService.predictBatch({ records });
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(this.errorStatus(error)).json({ message: error.message });
            }
        });
    }
}
exports.default = PricePredictionController;
