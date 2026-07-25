import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { authGuard } from '../middlewares/auth-middleware';

const router = express.Router();

interface Charger {
  _id: string;
  latitude: number | string;
  longitude: number | string;
  connection_type?: string; // <-- Add this line
  [key: string]: any;
}


interface ChargerWithDistance extends Charger {
  distance: number;
}

// 🌐 Haversine distance calculation
function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
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
router.post(
  '/nearby',
  authGuard(['user', 'admin']),
  async (req: Request, res: Response) => {
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
      const db = mongoose.connection.useDb('EVAT');
      const allChargers = (await db
        .collection('charging_stations')
        .find({})
        .toArray()) as unknown as Charger[];

      const nearbyChargers: ChargerWithDistance[] = allChargers
        .map((charger) => {
          const lat = typeof charger.latitude === 'string' ? parseFloat(charger.latitude) : charger.latitude;
          const lon = typeof charger.longitude === 'string' ? parseFloat(charger.longitude) : charger.longitude;

          if (!isNaN(lat) && !isNaN(lon)) {
            const distance = getDistanceFromLatLonInKm(latNum, lonNum, lat, lon);
            return { ...charger, distance };
          }
          return null;
        })
        .filter((c): c is ChargerWithDistance => {
          if (!c || c.distance > radiusNum) return false;
          if (connection_type === 'none') return true;
          return (
            typeof c.connection_type === 'string' &&
            c.connection_type.toLowerCase().includes(connection_type.toLowerCase())
          );
          
        })
        .sort((a, b) => a.distance - b.distance);

      return res.status(200).json({
        count: nearbyChargers.length,
        chargers: nearbyChargers
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  }
);


export default router;
export {deg2rad, getDistanceFromLatLonInKm}; // Needed for jest
