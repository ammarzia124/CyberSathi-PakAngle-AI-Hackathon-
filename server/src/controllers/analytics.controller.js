import { Report } from "../models/Report.js";
import mongoose from "mongoose";

const cache = { data: null, timestamp: 0 };
const CACHE_TTL = 60 * 1000;

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export const getAnalytics = async (req, res, next) => {
  if (!isDbConnected()) {
    return res.json({
      totalScans: 0,
      threatDistribution: {},
      avgRiskScore: null,
      recentScans: [],
    });
  }

  try {
    const now = Date.now();
    if (cache.data && now - cache.timestamp < CACHE_TTL) {
      return res.json(cache.data);
    }

    const [totalScans, threatDistribution, avgResult, recentScans] =
      await Promise.all([
        Report.countDocuments(),
        Report.aggregate([
          { $group: { _id: "$threatLevel", count: { $sum: 1 } } },
        ]),
        Report.aggregate([
          { $group: { _id: null, avg: { $avg: "$riskScore" } } },
        ]),
        Report.find()
          .sort({ createdAt: -1 })
          .limit(7)
          .select("createdAt riskScore threatLevel")
          .lean(),
      ]);

    const avgRiskScore = avgResult.length > 0 ? Math.round(avgResult[0].avg * 10) / 10 : null;

    const result = {
      totalScans,
      threatDistribution: threatDistribution.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      avgRiskScore,
      recentScans,
    };

    cache.data = result;
    cache.timestamp = now;

    res.json(result);
  } catch (error) {
    next(error);
  }
};
