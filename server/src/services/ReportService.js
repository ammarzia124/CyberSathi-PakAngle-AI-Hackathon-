import { v4 as uuidv4 } from "uuid";
import { Report } from "../models/Report.js";
import { ValidationError } from "../utils/errors.js";

const VALID_INPUT_TYPES = ["url", "message", "screenshot", "combined"];
const VALID_THREAT_LEVELS = ["Low", "Suspicious", "High", "Critical"];

const REPORT_FIELDS = new Set([
  "reportId",
  "inputType",
  "riskScore",
  "threatLevel",
  "threatType",
  "indicators",
  "explanation",
  "recommendedActions",
  "urls",
  "investigationTimeline",
  "urduExplanation",
  "createdAt",
]);

function validateInput(input) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Report input must be a non-null object");
  }

  if (!input.inputType || !VALID_INPUT_TYPES.includes(input.inputType)) {
    throw new ValidationError(
      `Invalid inputType: "${input.inputType}". Must be one of: ${VALID_INPUT_TYPES.join(", ")}`
    );
  }

  if (input.riskResult == null || typeof input.riskResult !== "object") {
    throw new ValidationError("riskResult is required and must be an object");
  }

  const { score } = input.riskResult;
  if (typeof score !== "number" || score < 0 || score > 100) {
    throw new ValidationError(
      `Invalid risk score: ${score}. Must be a number between 0 and 100.`
    );
  }

  if (input.threatClassification == null || typeof input.threatClassification !== "object") {
    throw new ValidationError("threatClassification is required and must be an object");
  }

  const { level } = input.threatClassification;
  if (!level || !VALID_THREAT_LEVELS.includes(level)) {
    throw new ValidationError(
      `Invalid threatLevel: "${level}". Must be one of: ${VALID_THREAT_LEVELS.join(", ")}`
    );
  }

  if (input.explanation == null || typeof input.explanation !== "string") {
    throw new ValidationError("explanation is required and must be a string");
  }
}

function sanitizeIndicators(indicators) {
  if (!Array.isArray(indicators)) return [];
  return indicators.map((ind) => ({
    type: ind.type || "unknown",
    severity: ind.severity || "info",
    description: ind.description || "",
    evidence: ind.evidence || "",
    source: ind.source || "unknown",
  }));
}

function filterInternalFields(report) {
  const filtered = {};
  for (const key of REPORT_FIELDS) {
    if (report[key] !== undefined) {
      filtered[key] = report[key];
    }
  }
  return filtered;
}

export class ReportService {
  constructor(deps = {}) {
    this.reportModel = deps.reportModel || Report;
  }

  async createReport(input) {
    validateInput(input);

    const {
      inputType,
      riskResult,
      threatClassification,
      indicators,
      explanation,
      recommendedActions,
      urls,
      timeline,
      urduExplanation,
    } = input;

    const report = {
      reportId: uuidv4(),
      inputType,
      riskScore: Math.round(riskResult.score),
      threatLevel: threatClassification.level,
      threatType: threatClassification.type || "Unknown",
      indicators: sanitizeIndicators(indicators),
      explanation,
      recommendedActions: Array.isArray(recommendedActions) ? recommendedActions : [],
      urls: Array.isArray(urls) ? urls : [],
      investigationTimeline: timeline || [],
      urduExplanation: urduExplanation || null,
      createdAt: new Date().toISOString(),
    };

    let persisted = false;
    try {
      await this.reportModel.create(report);
      persisted = true;
    } catch (error) {
      if (
        error.name === "MongoNetworkError" ||
        error.name === "MongoServerError" ||
        error.message?.includes("buffering timed out") ||
        error.message?.includes("buffering")
      ) {
        console.warn("MongoDB unavailable — report not persisted");
      } else {
        console.error("Report persistence error:", error.message);
      }
    }

    return filterInternalFields(report);
  }

  async findByReportId(reportId) {
    if (!reportId || typeof reportId !== "string") return null;
    try {
      const doc = await this.reportModel.findOne({ reportId }).lean();
      if (!doc) return null;
      const { _id, __v, ...shape } = doc;
      return shape;
    } catch {
      return null;
    }
  }

  async updateUrduExplanation(reportId, urduExplanation) {
    if (!reportId || typeof reportId !== "string") return null;
    if (typeof urduExplanation !== "string") return null;
    try {
      const doc = await this.reportModel.findOneAndUpdate(
        { reportId },
        { urduExplanation },
        { new: true }
      ).lean();
      if (!doc) return null;
      const { _id, __v, ...shape } = doc;
      return shape;
    } catch {
      return null;
    }
  }
}

export function createReport(input, deps = {}) {
  const service = new ReportService(deps);
  return service.createReport(input);
}
