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
exports.createBooking = createBooking;
exports.listMyBookings = listMyBookings;
const mongoose_1 = require("mongoose");
const booking_model_1 = __importDefault(require("../models/booking-model"));
const user_repository_1 = __importDefault(require("../repositories/user-repository"));
function makeRef(dt) {
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dt.getUTCDate()).padStart(2, "0");
    const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `BK-${y}${m}${d}-${rnd}`;
}
function resolveUserId(req) {
    var _a, _b, _c, _d, _e;
    // Prefer explicit header
    const headerId = (_a = req.headers["x-user-id"]) === null || _a === void 0 ? void 0 : _a.trim();
    if (headerId)
        return headerId;
    // Fallback to body
    const bodyId = (_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.userId) === null || _c === void 0 ? void 0 : _c.trim();
    if (bodyId)
        return bodyId;
    // Fallback to query
    const queryId = (_e = (_d = req.query) === null || _d === void 0 ? void 0 : _d.userId) === null || _e === void 0 ? void 0 : _e.trim();
    if (queryId)
        return queryId;
    return null;
}
// POST /api/bookings
function createBooking(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = resolveUserId(req);
            if (!userId)
                return res.status(400).json({ error: "userId is required (x-user-id header, body.userId, or ?userId=)" });
            if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: "invalid userId" });
            }
            const { datetime, timezone, tzOffsetMinutes, vehicle, notes, stationName } = req.body || {};
            if (!datetime)
                return res.status(400).json({ error: "datetime is required" });
            const when = new Date(datetime);
            if (isNaN(when.getTime()))
                return res.status(400).json({ error: "invalid datetime" });
            // Verify user exists
            const user = yield user_repository_1.default.findById(userId);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const doc = yield booking_model_1.default.create({
                user: userId,
                userEmail: (user.email || "").toLowerCase() || undefined,
                datetime: when,
                timezone,
                tzOffsetMinutes,
                vehicle,
                notes,
                stationName,
                reference: makeRef(when),
            });
            return res.status(201).json({
                id: doc._id,
                reference: doc.reference,
                status: doc.status,
                datetime: doc.datetime,
                createdAt: doc.createdAt,
            });
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err.code) === 11000)
                return res.status(409).json({ error: "Duplicate reference, please retry" });
            return res.status(500).json({ error: "Failed to create booking" });
        }
    });
}
// GET /api/bookings/me
function listMyBookings(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = resolveUserId(req);
            if (!userId)
                return res.status(400).json({ error: "userId is required (x-user-id header or ?userId=)" });
            if (!mongoose_1.Types.ObjectId.isValid(userId))
                return res.status(400).json({ error: "invalid userId" });
            const rows = yield booking_model_1.default.find({ user: userId }).sort({ datetime: -1 }).lean();
            return res.json(rows);
        }
        catch (_a) {
            return res.status(500).json({ error: "Failed to fetch bookings" });
        }
    });
}
