import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    reportId: { type: String, required: true, unique: true },
    inputType: {
      type: String,
      enum: ["url", "message", "screenshot", "combined"],
      required: true,
    },
    riskScore: { type: Number, required: true, min: 0, max: 100 },
    threatLevel: {
      type: String,
      enum: ["Low", "Suspicious", "High", "Critical"],
      required: true,
    },
    threatType: { type: String, required: true },
    indicators: [
      {
        type: { type: String },
        severity: { type: String, enum: ["info", "low", "medium", "high", "critical"] },
        description: { type: String },
        evidence: { type: String },
      },
    ],
    explanation: { type: String, required: true },
    recommendedActions: [{ type: String }],
    urls: [{ type: String }],
    investigationTimeline: [
      {
        id: { type: String },
        name: { type: String },
        timestamp: { type: String },
        status: { type: String },
        metadata: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    urduExplanation: { type: String, default: null },
  },
  { timestamps: true }
);

ReportSchema.index({ threatLevel: 1 });
ReportSchema.index({ createdAt: -1 });

export const Report = mongoose.model("Report", ReportSchema);
