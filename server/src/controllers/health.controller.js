import mongoose from "mongoose";

export const healthCheck = async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStates[dbState] || "unknown",
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + " MB",
      heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
    },
  });
};
