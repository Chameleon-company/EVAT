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
/**
 * Node proxy for the Reliability Scoring FastAPI service.
 * Mirrors the contract at RELIABILITY_API_URL (default http://localhost:8003):
 *   GET  /health
 *   GET  /suburbs
 *   GET  /summary
 *   GET  /stations
 *   GET  /stations/:id
 *   GET  /top
 *   POST /score
 *   POST /score/batch
 *   POST /sentiment
 */
class ReliabilityScoringService {
    getBaseUrl() {
        return (process.env.RELIABILITY_API_URL || "http://localhost:8003").replace(/\/$/, "");
    }
    unreachableMessage() {
        const baseUrl = this.getBaseUrl();
        return (`Reliability scoring ML service is not reachable at ${baseUrl}. ` +
            `Start it with: npm run dev:reliability`);
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
        return Object.assign(new Error((error === null || error === void 0 ? void 0 : error.message) || "Unexpected reliability scoring proxy error"), { status: 500 });
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
                return (body === null || body === void 0 ? void 0 : body.message) || `Reliability ML service error: ${response.status}`;
            }
            catch (_a) {
                return `Reliability ML service error: ${response.status}`;
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
    buildQuery(params) {
        const search = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null || value === "")
                return;
            search.set(key, String(value));
        });
        const qs = search.toString();
        return qs ? `?${qs}` : "";
    }
    getHealth() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.proxyGet("/health");
        });
    }
    getSuburbs() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.proxyGet("/suburbs");
        });
    }
    getSummary() {
        return __awaiter(this, arguments, void 0, function* (params = {}) {
            return this.proxyGet(`/summary${this.buildQuery(params)}`);
        });
    }
    getStations() {
        return __awaiter(this, arguments, void 0, function* (params = {}) {
            return this.proxyGet(`/stations${this.buildQuery(params)}`);
        });
    }
    getStation(chargerId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.proxyGet(`/stations/${encodeURIComponent(chargerId)}`);
        });
    }
    getTop() {
        return __awaiter(this, arguments, void 0, function* (params = {}) {
            return this.proxyGet(`/top${this.buildQuery(params)}`);
        });
    }
    score(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.proxyPost("/score", payload);
        });
    }
    scoreBatch(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.proxyPost("/score/batch", payload);
        });
    }
    analyzeSentiment(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.proxyPost("/sentiment", payload);
        });
    }
}
exports.default = ReliabilityScoringService;
