import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import analyzeRoutes from "./routes/analyze.routes.js";
import reportRoutes from "./routes/report.routes.js";
import scansRoutes from "./routes/scans.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import healthRoutes from "./routes/health.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["http://localhost:5173"];
app.use(cors({ origin: corsOrigins, credentials: true }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

app.use("/api/analyze", analyzeRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/scans", scansRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/health", healthRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found", statusCode: 404 });
});

app.use(errorHandler);

export default app;
