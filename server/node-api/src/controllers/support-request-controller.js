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
exports.createSupportRequest = createSupportRequest;
exports.listMySupportRequests = listMySupportRequests;
const support_request_model_1 = __importDefault(require("../models/support-request-model"));
// POST /api/support-requests
function createSupportRequest(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.headers["x-user-id"]) === null || _a === void 0 ? void 0 : _a.toString();
            if (!userId) {
                return res.status(401).json({ message: "x-user-id header is required" });
            }
            const { name, email, issue, description } = req.body || {};
            if (!issue || !description) {
                return res.status(400).json({ message: "issue and description are required" });
            }
            // Find next per-user request number
            const last = yield support_request_model_1.default.findOne({ user: userId })
                .sort({ requestNo: -1 })
                .select("requestNo")
                .lean();
            const nextNo = ((last === null || last === void 0 ? void 0 : last.requestNo) || 0) + 1;
            const doc = yield support_request_model_1.default.create({
                user: userId,
                name,
                email: email === null || email === void 0 ? void 0 : email.toLowerCase(),
                issue,
                description,
                requestNo: nextNo,
                reference: `SR-${nextNo}`,
            });
            return res.status(201).json({
                id: doc._id,
                reference: doc.reference,
                requestNo: doc.requestNo,
                status: doc.status,
                issue: doc.issue,
                description: doc.description,
                message: "Support request submitted",
                createdAt: doc.createdAt,
            });
        }
        catch (err) {
            // handle unique (user, requestNo) collision
            if ((err === null || err === void 0 ? void 0 : err.code) === 11000) {
                return res.status(409).json({ message: "Please retry (sequence conflict)" });
            }
            return res.status(500).json({ message: "Server error" });
        }
    });
}
// GET /api/support-requests/me
function listMySupportRequests(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.headers["x-user-id"]) === null || _a === void 0 ? void 0 : _a.toString();
        if (!userId) {
            return res.status(401).json({ message: "x-user-id header is required" });
        }
        const rows = yield support_request_model_1.default.find({ user: userId })
            .sort({ createdAt: -1 })
            .lean();
        res.json(rows);
    });
}
