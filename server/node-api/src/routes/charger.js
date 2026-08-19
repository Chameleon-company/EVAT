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
exports.deg2rad = deg2rad;
exports.getDistanceFromLatLonInKm = getDistanceFromLatLonInKm;
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_middleware_1 = require("../middlewares/auth-middleware");
const router = express_1.default.Router();
// 🌐 Haversine distance calculation
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
/**
 * @swagger
 * /api/altChargers/nearby:
 *   post:
 *     summary: Get EV charging stations near a given location
 *     description: Returns all EV chargers within a specified radius (in kilometers) based on provided latitude and longitude.
 *     tags:
 *       - Chargers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *               - radius
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: -31.95
 *               longitude:
 *                 type: number
 *                 example: 115.86
 *               radius:
 *                 type: number
 *                 example: 25
 *     responses:
 *       200:
 *         description: Successfully retrieved nearby chargers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *                 chargers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                       distance:
 *                         type: number
 *                         description: Distance in kilometers from the origin point
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (not allowed based on role)
 *       500:
 *         description: Server error
 */
router.post('/nearby', (0, auth_middleware_1.authGuard)(['user', 'admin']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { latitude, longitude, radius, connection_type = 'none' } = req.body;
    const latNum = Number(latitude);
    const lonNum = Number(longitude);
    const radiusNum = Number(radius);
    if (isNaN(latNum) || isNaN(lonNum) || isNaN(radiusNum)) {
        return res.status(400).json({
            success: false,
            message: 'latitude, longitude, and radius (in km) must be valid numbers.'
        });
    }
    try {
        const db = mongoose_1.default.connection.useDb('EVAT');
        const allChargers = (yield db
            .collection('charging_stations')
            .find({})
            .toArray());
        const nearbyChargers = allChargers
            .map((charger) => {
            const lat = typeof charger.latitude === 'string' ? parseFloat(charger.latitude) : charger.latitude;
            const lon = typeof charger.longitude === 'string' ? parseFloat(charger.longitude) : charger.longitude;
            if (!isNaN(lat) && !isNaN(lon)) {
                const distance = getDistanceFromLatLonInKm(latNum, lonNum, lat, lon);
                return Object.assign(Object.assign({}, charger), { distance });
            }
            return null;
        })
            .filter((c) => {
            if (!c || c.distance > radiusNum)
                return false;
            if (connection_type === 'none')
                return true;
            return (typeof c.connection_type === 'string' &&
                c.connection_type.toLowerCase().includes(connection_type.toLowerCase()));
        })
            .sort((a, b) => a.distance - b.distance);
        return res.status(200).json({
            count: nearbyChargers.length,
            chargers: nearbyChargers
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
}));
exports.default = router;
