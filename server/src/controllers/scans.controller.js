import { Report } from "../models/Report.js";
import mongoose from "mongoose";

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export const getScans = async (req, res, next) => {
  if (!isDbConnected()) {
    return res.json({ scans: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
  }

  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [scans, total] = await Promise.all([
      Report.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("reportId inputType riskScore threatLevel threatType createdAt")
        .lean(),
      Report.countDocuments(),
    ]);

    res.json({
      scans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getScanById = async (req, res, next) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: "Database unavailable", statusCode: 503 });
  }

  try {
    const report = await Report.findById(req.params.id)
      .select("reportId inputType riskScore threatLevel threatType createdAt")
      .lean();

    if (!report) {
      return res.status(404).json({ error: "Scan not found" });
    }

    res.json(report);
  } catch (error) {
    next(error);
  }
};
