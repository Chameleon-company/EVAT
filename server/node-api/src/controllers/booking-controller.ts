import { Request, Response } from "express";
import { Types } from "mongoose";
import Booking from "../models/booking-model";
import UserRepository from "../repositories/user-repository";

function makeRef(dt: Date) {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BK-${y}${m}${d}-${rnd}`;
}

function resolveUserId(req: Request): string | null {
  // Prefer explicit header
  const headerId = (req.headers["x-user-id"] as string | undefined)?.trim();
  if (headerId) return headerId;

  // Fallback to body
  const bodyId = (req.body?.userId as string | undefined)?.trim();
  if (bodyId) return bodyId;

  // Fallback to query
  const queryId = (req.query?.userId as string | undefined)?.trim();
  if (queryId) return queryId;

  return null;
}

// POST /api/bookings
export async function createBooking(req: Request, res: Response) {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(400).json({ error: "userId is required (x-user-id header, body.userId, or ?userId=)" });

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "invalid userId" });
    }

    const { datetime, timezone, tzOffsetMinutes, vehicle, notes, stationName } = req.body || {};
    if (!datetime) return res.status(400).json({ error: "datetime is required" });

    const when = new Date(datetime);
    if (isNaN(when.getTime())) return res.status(400).json({ error: "invalid datetime" });

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const doc = await Booking.create({
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
  } catch (err: any) {
    if (err?.code === 11000) return res.status(409).json({ error: "Duplicate reference, please retry" });
    return res.status(500).json({ error: "Failed to create booking" });
  }
}

// GET /api/bookings/me
export async function listMyBookings(req: Request, res: Response) {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(400).json({ error: "userId is required (x-user-id header or ?userId=)" });
    if (!Types.ObjectId.isValid(userId)) return res.status(400).json({ error: "invalid userId" });

    const rows = await Booking.find({ user: userId }).sort({ datetime: -1 }).lean();
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "Failed to fetch bookings" });
  }
}