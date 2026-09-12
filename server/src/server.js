import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

let server;

const start = async () => {
  try {
    await connectDatabase();
  } catch (error) {
    if (env.NODE_ENV === "production") {
      console.error("Failed to connect to database (production):", error);
      process.exit(1);
    }
    console.warn("MongoDB not available — running without database. Reports will not persist.");
  }

  server = app.listen(env.PORT, () => {
    console.log(`CyberSathi server running on port ${env.PORT}`);
  });
};

const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      console.log("HTTP server closed");
    });
  }
  const mongoose = await import("mongoose");
  if (mongoose.default.connection.readyState === 1) {
    await mongoose.default.connection.close();
    console.log("MongoDB connection closed");
  }
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start();
