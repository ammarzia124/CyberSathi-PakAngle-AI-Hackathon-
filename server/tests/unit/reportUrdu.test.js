import { jest } from "@jest/globals";
import { createReportController } from "../../src/controllers/report.controller.js";
import mongoose from "mongoose";

let originalReadyState;

beforeAll(() => {
  process.env.MONGODB_URI = "mongodb://localhost:27017/test";
  originalReadyState = mongoose.connection.readyState;
  mongoose.connection.readyState = 1;
});

afterAll(() => {
  mongoose.connection.readyState = originalReadyState;
});

function createMockReportModel(findResult) {
  return {
    findById: () => ({
      lean: async () => findResult,
    }),
  };
}

function createMockReportService(updateResult) {
  return {
    updateUrduExplanation: async () => updateResult,
  };
}

function createMockUrduService(translationResult) {
  return {
    translate: async () => translationResult,
  };
}

function createMockRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; if (res.statusCode === null) res.statusCode = 200; return res; };
  return res;
}

function createMockReq(id = "507f1f77bcf86cd799439011") {
  return { params: { id } };
}

const sampleReport = {
  _id: "507f1f77bcf86cd799439011",
  reportId: "test-report-001",
  inputType: "url",
  riskScore: 75,
  threatLevel: "High",
  threatType: "Phishing",
  indicators: [
    { type: "suspicious-tld", severity: "high", description: "Uses .xyz TLD", evidence: "evil.xyz" },
  ],
  explanation: "This URL appears to be a phishing attempt.",
  recommendedActions: ["Do not visit this URL", "Report to authorities"],
  urls: ["https://evil.xyz/verify"],
  investigationTimeline: [],
  urduExplanation: null,
  createdAt: "2025-01-01T00:00:00Z",
};

describe("Report Urdu Endpoint", () => {
  describe("getReportUrdu", () => {
    it("translates and returns full report with urduExplanation", async () => {
      const urduTranslation = {
        explanation: "یہ URL فishing کی کوشش لگتا ہے۔",
        recommendedActions: ["اس URL پر نہ جائیں۔", "حکومتی اداروں کو رپورٹ کریں۔"],
      };
      const updatedReport = { ...sampleReport, urduExplanation: "یہ URL فishing کی کوشش لگتا ہے۔\n\nتوصیات:\n1. اس URL پر نہ جائیں۔\n2. حکومتی اداروں کو رپورٹ کریں۔" };

      const controller = createReportController({
        reportModel: createMockReportModel(sampleReport),
        reportService: createMockReportService(updatedReport),
        urduService: createMockUrduService(urduTranslation),
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await controller.getReportUrdu(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(res.body.urduExplanation).toContain("فishing");
      expect(res.body.reportId).toBe("test-report-001");
      expect(res.body.explanation).toBe("This URL appears to be a phishing attempt.");
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 404 for missing report", async () => {
      const controller = createReportController({
        reportModel: createMockReportModel(null),
        reportService: createMockReportService(null),
        urduService: createMockUrduService(null),
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await controller.getReportUrdu(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
    });

    it("returns 503 when translation fails (null result)", async () => {
      const controller = createReportController({
        reportModel: createMockReportModel(sampleReport),
        reportService: createMockReportService(null),
        urduService: createMockUrduService(null),
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await controller.getReportUrdu(req, res, next);

      expect(res.statusCode).toBe(503);
      expect(res.body.error).toBe("Translation service unavailable");
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 503 on translation timeout (service throws)", async () => {
      const controller = createReportController({
        reportModel: createMockReportModel(sampleReport),
        reportService: createMockReportService(null),
        urduService: {
          translate: async () => {
            throw new Error("Translation timed out");
          },
        },
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await controller.getReportUrdu(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("does not corrupt report when translation fails", async () => {
      const reportWithUrdu = { ...sampleReport, urduExplanation: "existing translation" };
      const controller = createReportController({
        reportModel: createMockReportModel(reportWithUrdu),
        reportService: createMockReportService(null),
        urduService: createMockUrduService(null),
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await controller.getReportUrdu(req, res, next);

      expect(res.statusCode).toBe(503);
      expect(next).not.toHaveBeenCalled();
    });

    it("re-translates when urduExplanation already exists (overwrites)", async () => {
      const reportWithUrdu = { ...sampleReport, urduExplanation: "previous translation" };
      const newTranslation = {
        explanation: "نئی ترجمہ",
        recommendedActions: ["نئی توصیہ"],
      };
      const updatedReport = { ...reportWithUrdu, urduExplanation: "نئی ترجمہ\n\nتوصیات:\n1. نئی توصیہ" };

      const controller = createReportController({
        reportModel: createMockReportModel(reportWithUrdu),
        reportService: createMockReportService(updatedReport),
        urduService: createMockUrduService(newTranslation),
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await controller.getReportUrdu(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(res.body.urduExplanation).toContain("نئی ترجمہ");
    });

    it("returns 503 when database is unavailable", async () => {
      mongoose.connection.readyState = 0;

      const controller = createReportController({
        reportModel: createMockReportModel(sampleReport),
        reportService: createMockReportService(null),
        urduService: createMockUrduService(null),
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await controller.getReportUrdu(req, res, next);

      expect(res.statusCode).toBe(503);
      expect(res.body.error).toBe("Database unavailable");

      mongoose.connection.readyState = 1;
    });

    it("returns 500 when persisting translation fails", async () => {
      const controller = createReportController({
        reportModel: createMockReportModel(sampleReport),
        reportService: createMockReportService(null),
        urduService: createMockUrduService({
          explanation: "ترجمہ",
          recommendedActions: [],
        }),
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await controller.getReportUrdu(req, res, next);

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Failed to persist Urdu translation");
    });

    it("preserves URLs in Urdu text", async () => {
      const reportWithUrl = {
        ...sampleReport,
        explanation: "Visit https://example.com for more info.",
        recommendedActions: [],
      };
      const translation = {
        explanation: "مزید معلومات کے لیے https://example.com پر جائیں۔",
        recommendedActions: [],
      };
      const updatedReport = { ...reportWithUrl, urduExplanation: translation.explanation };

      const controller = createReportController({
        reportModel: createMockReportModel(reportWithUrl),
        reportService: createMockReportService(updatedReport),
        urduService: createMockUrduService(translation),
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await controller.getReportUrdu(req, res, next);

      expect(res.body.urduExplanation).toContain("https://example.com");
    });

    it("preserves numbers in Urdu text", async () => {
      const translation = {
        explanation: "اسکور 75/100 ہے۔",
        recommendedActions: [],
      };
      const updatedReport = { ...sampleReport, urduExplanation: translation.explanation };

      const controller = createReportController({
        reportModel: createMockReportModel(sampleReport),
        reportService: createMockReportService(updatedReport),
        urduService: createMockUrduService(translation),
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await controller.getReportUrdu(req, res, next);

      expect(res.body.urduExplanation).toContain("75/100");
    });

    it("formats recommendedActions with Urdu heading when present", async () => {
      const translation = {
        explanation: "خطرناک URL",
        recommendedActions: ["عمل 1", "عمل 2"],
      };
      const updatedReport = {
        ...sampleReport,
        urduExplanation: "خطرناک URL\n\nتوصیات:\n1. عمل 1\n2. عمل 2",
      };

      const controller = createReportController({
        reportModel: createMockReportModel(sampleReport),
        reportService: createMockReportService(updatedReport),
        urduService: createMockUrduService(translation),
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await controller.getReportUrdu(req, res, next);

      expect(res.body.urduExplanation).toContain("توصیات");
      expect(res.body.urduExplanation).toContain("1. عمل 1");
      expect(res.body.urduExplanation).toContain("2. عمل 2");
    });

    it("returns only explanation when recommendedActions is empty", async () => {
      const translation = {
        explanation: "صرف وضاحت",
        recommendedActions: [],
      };
      const updatedReport = { ...sampleReport, urduExplanation: "صرف وضاحت" };

      const controller = createReportController({
        reportModel: createMockReportModel(sampleReport),
        reportService: createMockReportService(updatedReport),
        urduService: createMockUrduService(translation),
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await controller.getReportUrdu(req, res, next);

      expect(res.body.urduExplanation).toBe("صرف وضاحت");
      expect(res.body.urduExplanation).not.toContain("توصیات");
    });
  });
});
