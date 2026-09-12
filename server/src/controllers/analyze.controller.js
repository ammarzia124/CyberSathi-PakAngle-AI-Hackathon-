import fs from "fs";
import { AnalysisOrchestrator } from "../services/AnalysisOrchestrator.js";
import { ReportService } from "../services/ReportService.js";
import { ValidationError } from "../utils/errors.js";

const orchestrator = new AnalysisOrchestrator();
const reportService = new ReportService();

function orchestratorToReportInput(result, inputType) {
  return {
    inputType,
    riskResult: {
      score: result.aiResult.adjustedScore,
      level: result.deterministic.threatLevel,
    },
    threatClassification: {
      level: result.deterministic.threatLevel,
      type: result.deterministic.threatType,
    },
    indicators: result.indicators,
    explanation: result.aiResult.explanation,
    recommendedActions: result.aiResult.recommendedActions,
    urls: result.urls,
    timeline: result.timeline,
    urduExplanation: null,
  };
}

export const analyzeUrl = async (req, res, next) => {
  try {
    const { url } = req.body;
    const trimmed = url.trim();

    const result = await orchestrator.analyzeUrl(trimmed);
    const report = await reportService.createReport(orchestratorToReportInput(result, "url"));
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

export const analyzeMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    const trimmed = text.trim();

    if (trimmed.length === 0) {
      return next(new ValidationError("Message text cannot be empty"));
    }

    const result = await orchestrator.analyzeMessage(trimmed);
    const report = await reportService.createReport(orchestratorToReportInput(result, "message"));
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

export const analyzeScreenshot = async (req, res, next) => {
  if (!req.file) {
    return next(new ValidationError("No screenshot uploaded. Send an image file as 'screenshot'."));
  }

  const tempPath = req.file.path;
  try {
    const result = await orchestrator.analyzeScreenshot(tempPath);
    const report = await reportService.createReport(orchestratorToReportInput(result, "screenshot"));
    res.status(201).json(report);
  } catch (error) {
    next(error);
  } finally {
    try {
      if (tempPath && fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch {
      console.warn("Failed to delete temp file:", tempPath);
    }
  }
};

export const analyzeCombined = async (req, res, next) => {
  try {
    const { text, urls } = req.body;
    const trimmed = text?.trim();

    if (!trimmed) {
      return next(new ValidationError("Message text is required for combined analysis"));
    }

    if (urls !== undefined && !Array.isArray(urls)) {
      return next(new ValidationError("'urls' must be an array"));
    }

    const result = await orchestrator.analyzeCombined(trimmed, urls || []);
    const report = await reportService.createReport(orchestratorToReportInput(result, "combined"));
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};
