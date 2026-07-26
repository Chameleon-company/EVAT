import { Request, Response } from "express";
import SupportRequest from "../models/support-request-model";

// POST /api/support-requests
export async function createSupportRequest(req: Request, res: Response) {
  try {
    const userId = (req.headers["x-user-id"] as string | undefined)?.toString();
    if (!userId) {
      return res.status(401).json({ message: "x-user-id header is required" });
    }

    const { name, email, issue, description } = req.body || {};
    if (!issue || !description) {
      return res.status(400).json({ message: "issue and description are required" });
    }

    // Find next per-user request number
    const last = await SupportRequest.findOne({ user: userId })
      .sort({ requestNo: -1 })
      .select("requestNo")
      .lean();

    const nextNo = (last?.requestNo || 0) + 1;

    const doc = await SupportRequest.create({
      user: userId,
      name,
      email: email?.toLowerCase(),
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
  } catch (err: any) {
    // handle unique (user, requestNo) collision
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Please retry (sequence conflict)" });
    }
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /api/support-requests/me
export async function listMySupportRequests(req: Request, res: Response) {
  const userId = (req.headers["x-user-id"] as string | undefined)?.toString();
  if (!userId) {
    return res.status(401).json({ message: "x-user-id header is required" });
  }

  const rows = await SupportRequest.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  res.json(rows);
}