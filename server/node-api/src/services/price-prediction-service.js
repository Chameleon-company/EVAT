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
const PYTHON_API = process.env.PYTHON_API_URL;
/**
 * Node proxy for the Price Prediction FastAPI service.
 * Mirrors the README contract at PRICE_API_URL (default http://localhost:8001):
 *   GET  /health
 *   GET  /schema
 *   GET  /model/info
 *   POST /predict
 *   POST /predict/batch
 */
class PricePredictionService {
    getBaseUrl() {
        return (`${PYTHON_API}/pricePrediction`).replace(/\/$/, "");
    }
    unreachableMessage() {
        const baseUrl = this.getBaseUrl();
        return (`Price prediction ML service is not reachable at ${baseUrl}. ` +
            `Start it with: npm run dev:price`);
    }
    isUnreachableError(error) {
        var _a;
        const code = (error === null || error === void 0 ? void 0 : error.code) || ((_a = error === null || error === void 0 ? void 0 : error.cause) === null || _a === void 0 ? void 0 : _a.code);
        const message = String((error === null || error === void 0 ? void 0 : error.message) || "");
        return (code === "ECONNREFUSED" ||
            code === "ENOTFOUND" ||
            code === "ECONNRESET" ||
            code === "ETIMEDOUT" ||
            message.includes("ECONNREFUSED") ||
            message.includes("fetch failed") ||
            /request to .+ failed, reason:\s*$/i.test(message) ||
            /request to .+ failed/i.test(message));
    }
    wrapProxyError(error) {
        if (error === null || error === void 0 ? void 0 : error.status)
            return error;
        if (this.isUnreachableError(error)) {
            return Object.assign(new Error(this.unreachableMessage()), { status: 503 });
        }
        return Object.assign(new Error((error === null || error === void 0 ? void 0 : error.message) || "Unexpected price prediction proxy error"), { status: 500 });
    }
    parseError(response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const body = yield response.json();
                if (typeof (body === null || body === void 0 ? void 0 : body.detail) === "string")
                    return body.detail;
                if (Array.isArray(body === null || body === void 0 ? void 0 : body.detail)) {
                    return body.detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
                }
                return (body === null || body === void 0 ? void 0 : body.message) || `Price ML service error: ${response.status}`;
            }
            catch (_a) {
                return `Price ML service error: ${response.status}`;
            }
        });
    }
    proxyGet(path) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.getBaseUrl()}${path}`);
                if (!response.ok) {
                    throw Object.assign(new Error(yield this.parseError(response)), {
                        status: response.status,
                    });
                }
                return response.json();
            }
            catch (error) {
                throw this.wrapProxyError(error);
            }
        });
    }
    proxyPost(path, body) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.getBaseUrl()}${path}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                if (!response.ok) {
                    throw Object.assign(new Error(yield this.parseError(response)), {
                        status: response.status,
                    });
                }
                return response.json();
            }
            catch (error) {
                throw this.wrapProxyError(error);
            }
        });
    }
    /** GET {PRICE_API_URL}/health */
    getHealth() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.proxyGet("/health");
        });
    }
    /** GET {PRICE_API_URL}/schema */
    getSchema() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.proxyGet("/schema");
        });
    }
    /** GET {PRICE_API_URL}/model/info */
    getModelInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.proxyGet("/model/info");
        });
    }
    /**
     * POST {PRICE_API_URL}/predict
     * Body matches README: { row_id?, features }
     */
    predict(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.proxyPost("/predict", payload);
        });
    }
    /**
     * POST {PRICE_API_URL}/predict/batch
     * Body matches README: { records: [{ row_id?, features }] }
     */
    predictBatch(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.proxyPost("/predict/batch", payload);
        });
    }
}
exports.default = PricePredictionService;
