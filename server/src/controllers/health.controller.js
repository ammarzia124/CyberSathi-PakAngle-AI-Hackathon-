import { isSupabaseConnected } from "../config/database.js";

export const healthCheck = async (req, res) => {
  const connected = await isSupabaseConnected();

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: connected ? "connected" : "disconnected",
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + " MB",
      heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
    },
  });
};
