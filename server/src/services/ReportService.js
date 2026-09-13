import { v4 as uuidv4 } from "uuid";
import { supabase } from "../config/database.js";
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

function reportToRow(report) {
  return {
    report_id: report.reportId,
    input_type: report.inputType,
    risk_score: report.riskScore,
    threat_level: report.threatLevel,
    threat_type: report.threatType,
    indicators: report.indicators,
    explanation: report.explanation,
    recommended_actions: report.recommendedActions,
    urls: report.urls,
    investigation_timeline: report.investigationTimeline,
    urdu_explanation: report.urduExplanation,
    created_at: report.createdAt,
    updated_at: new Date().toISOString(),
  };
}

function rowToReport(row) {
  return {
    reportId: row.report_id,
    inputType: row.input_type,
    riskScore: row.risk_score,
    threatLevel: row.threat_level,
    threatType: row.threat_type,
    indicators: row.indicators,
    explanation: row.explanation,
    recommendedActions: row.recommended_actions,
    urls: row.urls,
    investigationTimeline: row.investigation_timeline,
    urduExplanation: row.urdu_explanation,
    createdAt: row.created_at,
  };
}

export class ReportService {
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
      const row = reportToRow(report);
      const { error } = await supabase.from("reports").insert(row);
      if (error) {
        console.warn("Supabase insert failed — report not persisted:", error.message);
      } else {
        persisted = true;
      }
    } catch (error) {
      console.error("Report persistence error:", error.message);
    }

    return filterInternalFields(report);
  }

  async findByReportId(reportId) {
    if (!reportId || typeof reportId !== "string") return null;
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("report_id", reportId)
        .single();
      if (error || !data) return null;
      return rowToReport(data);
    } catch {
      return null;
    }
  }

  async updateUrduExplanation(reportId, urduExplanation) {
    if (!reportId || typeof reportId !== "string") return null;
    if (typeof urduExplanation !== "string") return null;
    try {
      const { data, error } = await supabase
        .from("reports")
        .update({ urdu_explanation: urduExplanation, updated_at: new Date().toISOString() })
        .eq("report_id", reportId)
        .select()
        .single();
      if (error || !data) return null;
      return rowToReport(data);
    } catch {
      return null;
    }
  }
}

export function createReport(input, deps = {}) {
  const service = new ReportService(deps);
  return service.createReport(input);
}
