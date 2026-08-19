"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = require("../controllers/booking-controller");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Booking Requests
 *   description: Create and view bookings
 */
/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a booking
 *     description: Pass the userId of the logged-in user via header "x-user-id" (preferred) or include "userId" in the request body.
 *     tags: [Booking Requests]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: false
 *         schema:
 *           type: string
 *         description: User ID to attribute the booking to (preferred)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [datetime]
 *             properties:
 *               userId:         { type: string, description: "Required if x-user-id header not used" }
 *               datetime:       { type: string, format: date-time }
 *               timezone:       { type: string }
 *               tzOffsetMinutes:{ type: integer }
 *               vehicle:        { type: string }
 *               notes:          { type: string }
 *               stationName:    { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/", booking_controller_1.createBooking);
/**
 * @swagger
 * /api/bookings/me:
 *   get:
 *     summary: List my bookings
 *     description: Provide the userId via header "x-user-id" (preferred) or query "?userId=".
 *     tags: [Booking Requests]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: false
 *         schema: { type: string }
 *         description: User ID (preferred)
 *       - in: query
 *         name: userId
 *         required: false
 *         schema: { type: string }
 *         description: User ID (if not in header)
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Missing or invalid userId
 */
router.get("/me", booking_controller_1.listMyBookings);
exports.default = router;
