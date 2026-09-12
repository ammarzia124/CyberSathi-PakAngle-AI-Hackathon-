import { Report } from "../models/Report.js";
import { ReportService } from "../services/ReportService.js";
import { UrduTranslationService } from "../services/UrduTranslationService.js";
import { NotFoundError } from "../utils/errors.js";
import mongoose from "mongoose";

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export function createReportController(deps = {}) {
  const reportModel = deps.reportModel || Report;
  const reportService = deps.reportService || new ReportService({ reportModel });
  const urduService = deps.urduService || new UrduTranslationService();

  const getReport = async (req, res, next) => {
    if (!isDbConnected()) {
      return res.status(503).json({ error: "Database unavailable", statusCode: 503 });
    }

    try {
      const report = await reportModel.findById(req.params.id).lean();
      if (!report) {
        throw new NotFoundError("Report");
      }

      const { _id, __v, ...shape } = report;
      res.json(shape);
    } catch (error) {
      next(error);
    }
  };

  const getReportUrdu = async (req, res, next) => {
    if (!isDbConnected()) {
      return res.status(503).json({ error: "Database unavailable", statusCode: 503 });
    }

    try {
      const report = await reportModel.findById(req.params.id).lean();
      if (!report) {
        throw new NotFoundError("Report");
      }

      const translation = await urduService.translate(
        report.explanation,
        report.recommendedActions
      );

      if (!translation) {
        return res.status(503).json({
          error: "Translation service unavailable",
          statusCode: 503,
        });
      }

      const urduText = Array.isArray(translation.recommendedActions) &&
        translation.recommendedActions.length > 0
        ? `${translation.explanation}\n\nتوصیات:\n${translation.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join("\n")}`
        : translation.explanation;

      const updated = await reportService.updateUrduExplanation(
        report.reportId,
        urduText
      );

      if (!updated) {
        return res.status(500).json({
          error: "Failed to persist Urdu translation",
          statusCode: 500,
        });
      }

      res.json(updated);
    } catch (error) {
      next(error);
    }
  };

  return { getReport, getReportUrdu };
}

const defaultController = createReportController();
export const getReport = defaultController.getReport;
export const getReportUrdu = defaultController.getReportUrdu;
