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
class ReliabilityScoringController {
    constructor(reliabilityScoringService) {
        this.reliabilityScoringService = reliabilityScoringService;
    }
    errorStatus(error) {
        const status = Number(error === null || error === void 0 ? void 0 : error.status);
        if (status >= 400 && status < 600)
            return status;
        return 500;
    }
    /** GET /api/reliability/health → GET /health */
    getHealth(_req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.reliabilityScoringService.getHealth();
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(this.errorStatus(error)).json({ message: error.message });
            }
        });
    }
    /** GET /api/reliability/suburbs → GET /suburbs */
    getSuburbs(_req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.reliabilityScoringService.getSuburbs();
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(this.errorStatus(error)).json({ message: error.message });
            }
        });
    }
    /** GET /api/reliability/summary → GET /summary */
    getSummary(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const suburb = typeof req.query.suburb === "string" ? req.query.suburb : undefined;
                const result = yield this.reliabilityScoringService.getSummary({ suburb });
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(this.errorStatus(error)).json({ message: error.message });
            }
        });
    }
    /** GET /api/reliability/stations → GET /stations */
    getStations(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const suburb = typeof req.query.suburb === "string" ? req.query.suburb : undefined;
                const sentiment = typeof req.query.sentiment === "string" ? req.query.sentiment : undefined;
                const minScoreRaw = (_a = req.query.min_score) !== null && _a !== void 0 ? _a : req.query.minScore;
                const limitRaw = req.query.limit;
                const offsetRaw = req.query.offset;
                const min_score = minScoreRaw !== undefined ? Number(minScoreRaw) : undefined;
                const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
                const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
                if (min_score !== undefined && Number.isNaN(min_score)) {
                    return res.status(400).json({ message: "min_score must be a number" });
                }
                if (limit !== undefined && Number.isNaN(limit)) {
                    return res.status(400).json({ message: "limit must be a number" });
                }
                if (offset !== undefined && Number.isNaN(offset)) {
                    return res.status(400).json({ message: "offset must be a number" });
                }
                const result = yield this.reliabilityScoringService.getStations({
                    suburb,
                    sentiment,
                    min_score,
                    limit,
                    offset,
                });
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(this.errorStatus(error)).json({ message: error.message });
            }
        });
    }
    /** GET /api/reliability/stations/:id → GET /stations/:id */
    getStation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const chargerId = req.params.id;
                if (!chargerId) {
                    return res.status(400).json({ message: "Missing station id" });
                }
                const result = yield this.reliabilityScoringService.getStation(chargerId);
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(this.errorStatus(error)).json({ message: error.message });
            }
        });
    }
    /** GET /api/reliability/top → GET /top */
    getTop(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const kind = typeof req.query.kind === "string" ? req.query.kind : undefined;
                const suburb = typeof req.query.suburb === "string" ? req.query.suburb : undefined;
                const limitRaw = req.query.limit;
                const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
                if (limit !== undefined && Number.isNaN(limit)) {
                    return res.status(400).json({ message: "limit must be a number" });
                }
                const result = yield this.reliabilityScoringService.getTop({
                    kind,
                    suburb,
                    limit,
                });
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(this.errorStatus(error)).json({ message: error.message });
            }
        });
    }
    /**
     * POST /api/reliability/score → POST /score
     * Body: { status, power_kw, station_id?, name?, max_power_kw? }
     */
    score(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { status, power_kw, station_id, name, max_power_kw } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
                if (typeof status !== "string" || !status.trim()) {
                    return res.status(400).json({
                        message: "Missing required field: status (string)",
                    });
                }
                if (power_kw === undefined || power_kw === null || Number.isNaN(Number(power_kw))) {
                    return res.status(400).json({
                        message: "Missing required field: power_kw (number)",
                    });
                }
                const result = yield this.reliabilityScoringService.score({
                    status,
                    power_kw: Number(power_kw),
                    station_id,
                    name,
                    max_power_kw: max_power_kw === undefined || max_power_kw === null
                        ? undefined
                        : Number(max_power_kw),
                });
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(this.errorStatus(error)).json({ message: error.message });
            }
        });
    }
    /**
     * POST /api/reliability/score/batch → POST /score/batch
     * Body: { records: [{ status, power_kw, ... }], max_power_kw? }
     */
    scoreBatch(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { records, max_power_kw } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
                if (!Array.isArray(records) || records.length === 0) {
                    return res.status(400).json({
                        message: "Missing required field: records (non-empty array)",
                    });
                }
                for (let i = 0; i < records.length; i++) {
                    const record = records[i];
                    if (typeof (record === null || record === void 0 ? void 0 : record.status) !== "string" || !record.status.trim()) {
                        return res.status(400).json({
                            message: `records[${i}].status must be a non-empty string`,
                        });
                    }
                    if ((record === null || record === void 0 ? void 0 : record.power_kw) === undefined ||
                        (record === null || record === void 0 ? void 0 : record.power_kw) === null ||
                        Number.isNaN(Number(record.power_kw))) {
                        return res.status(400).json({
                            message: `records[${i}].power_kw must be a number`,
                        });
                    }
                }
                const result = yield this.reliabilityScoringService.scoreBatch({
                    records: records.map((r) => ({
                        station_id: r.station_id,
                        name: r.name,
                        status: r.status,
                        power_kw: Number(r.power_kw),
                    })),
                    max_power_kw: max_power_kw === undefined || max_power_kw === null
                        ? undefined
                        : Number(max_power_kw),
                });
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(this.errorStatus(error)).json({ message: error.message });
            }
        });
    }
    /**
     * POST /api/reliability/sentiment → POST /sentiment
     * Body: { text }
     */
    analyzeSentiment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { text } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
                if (typeof text !== "string") {
                    return res.status(400).json({
                        message: "Missing required field: text (string)",
                    });
                }
                const result = yield this.reliabilityScoringService.analyzeSentiment({
                    text,
                });
                return res.status(200).json(result);
            }
            catch (error) {
                return res.status(this.errorStatus(error)).json({ message: error.message });
            }
        });
    }
}
exports.default = ReliabilityScoringController;
