import { ReportService, createReport } from "../../src/services/ReportService.js";

function createMockReportModel() {
  return {
    create: async (data) => ({ ...data, _id: "mock-id" }),
  };
}

function createFailingReportModel(errorName = "MongoNetworkError") {
  return {
    create: async () => {
      const err = new Error("Connection failed");
      err.name = errorName;
      throw err;
    },
  };
}

function validInput(overrides = {}) {
  return {
    inputType: "url",
    riskResult: { score: 75, level: "High" },
    threatClassification: { level: "High", type: "Phishing" },
    indicators: [
      {
        type: "suspicious-tld",
        severity: "high",
        description: "Uses suspicious .xyz TLD",
        evidence: "paypa1-secure.xyz",
        source: "url-analyzer",
      },
    ],
    explanation: "This URL appears to be a phishing attempt.",
    recommendedActions: ["Do not visit this URL", "Report to authorities"],
    urls: ["https://paypa1-secure.xyz/verify"],
    timeline: {
      events: [{ step: 1, name: "Input received", status: "completed", timestamp: "2025-01-01T00:00:00Z", metadata: {} }],
      startedAt: "2025-01-01T00:00:00Z",
      completedAt: "2025-01-01T00:00:01Z",
    },
    urduExplanation: null,
    ...overrides,
  };
}

describe("ReportService", () => {
  describe("createReport", () => {
    it("creates complete report with all required fields", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      const report = await service.createReport(validInput());

      expect(report.reportId).toBeDefined();
      expect(typeof report.reportId).toBe("string");
      expect(report.inputType).toBe("url");
      expect(report.riskScore).toBe(75);
      expect(report.threatLevel).toBe("High");
      expect(report.threatType).toBe("Phishing");
      expect(report.indicators).toHaveLength(1);
      expect(report.explanation).toBe("This URL appears to be a phishing attempt.");
      expect(report.recommendedActions).toEqual(["Do not visit this URL", "Report to authorities"]);
      expect(report.urls).toEqual(["https://paypa1-secure.xyz/verify"]);
      expect(report.investigationTimeline).toBeDefined();
      expect(report.urduExplanation).toBeNull();
      expect(report.createdAt).toBeDefined();
    });

    it("generates ISO-8601 createdAt timestamp", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      const report = await service.createReport(validInput());

      expect(report.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      const parsed = new Date(report.createdAt);
      expect(parsed.toString()).not.toBe("Invalid Date");
    });

    it("generates unique reportId as UUID", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      const r1 = await service.createReport(validInput());
      const r2 = await service.createReport(validInput());

      expect(r1.reportId).not.toBe(r2.reportId);
      expect(r1.reportId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("handles missing urduExplanation", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      const input = validInput();
      delete input.urduExplanation;
      const report = await service.createReport(input);

      expect(report.urduExplanation).toBeNull();
    });

    it("handles empty indicators array", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      const report = await service.createReport(validInput({ indicators: [] }));

      expect(report.indicators).toEqual([]);
    });

    it("sanitizes indicator fields to safe set only", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      const report = await service.createReport(
        validInput({
          indicators: [
            {
              type: "phishing",
              severity: "critical",
              description: "test",
              evidence: "evil.com",
              source: "url-analyzer",
              weight: 5,
              internal: "should be stripped",
              raw: "secret",
            },
          ],
        })
      );

      const ind = report.indicators[0];
      expect(ind.type).toBe("phishing");
      expect(ind.severity).toBe("critical");
      expect(ind.description).toBe("test");
      expect(ind.evidence).toBe("evil.com");
      expect(ind.source).toBe("url-analyzer");
      expect(ind.weight).toBeUndefined();
      expect(ind.internal).toBeUndefined();
      expect(ind.raw).toBeUndefined();
    });

    it("defaults recommendedActions to empty array if not array", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      const report = await service.createReport(validInput({ recommendedActions: "not-an-array" }));

      expect(report.recommendedActions).toEqual([]);
    });

    it("defaults urls to empty array if not array", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      const report = await service.createReport(validInput({ urls: "not-an-array" }));

      expect(report.urls).toEqual([]);
    });

    it("rounds riskScore to integer", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      const report = await service.createReport(
        validInput({ riskResult: { score: 73.7, level: "High" } })
      );

      expect(report.riskScore).toBe(74);
    });

    it("does not leak internal fields like persisted", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      const report = await service.createReport(validInput());

      expect(report.persisted).toBeUndefined();
      expect(report._id).toBeUndefined();
      expect(report.__v).toBeUndefined();
    });
  });

  describe("validation", () => {
    it("throws on missing inputType", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      const input = validInput();
      delete input.inputType;

      await expect(service.createReport(input)).rejects.toThrow("Invalid inputType");
    });

    it("throws on invalid inputType", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      await expect(
        service.createReport(validInput({ inputType: "invalid" }))
      ).rejects.toThrow("Invalid inputType");
    });

    it("throws on invalid riskScore below 0", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      await expect(
        service.createReport(validInput({ riskResult: { score: -1, level: "Low" } }))
      ).rejects.toThrow("Invalid risk score");
    });

    it("throws on invalid riskScore above 100", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      await expect(
        service.createReport(validInput({ riskResult: { score: 101, level: "Critical" } }))
      ).rejects.toThrow("Invalid risk score");
    });

    it("throws on non-numeric riskScore", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      await expect(
        service.createReport(validInput({ riskResult: { score: "high", level: "High" } }))
      ).rejects.toThrow("Invalid risk score");
    });

    it("throws on invalid threatLevel", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      await expect(
        service.createReport(
          validInput({ threatClassification: { level: "Extreme", type: "Malware" } })
        )
      ).rejects.toThrow("Invalid threatLevel");
    });

    it("throws on missing explanation", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      const input = validInput();
      delete input.explanation;

      await expect(service.createReport(input)).rejects.toThrow("explanation is required");
    });

    it("throws on null input", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      await expect(service.createReport(null)).rejects.toThrow("non-null object");
    });

    it("throws on missing riskResult", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      const input = validInput();
      delete input.riskResult;

      await expect(service.createReport(input)).rejects.toThrow("riskResult is required");
    });

    it("throws on missing threatClassification", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      const input = validInput();
      delete input.threatClassification;

      await expect(service.createReport(input)).rejects.toThrow("threatClassification is required");
    });
  });

  describe("MongoDB graceful fallback", () => {
    it("returns report even when MongoDB is unavailable", async () => {
      const service = new ReportService({
        reportModel: createFailingReportModel("MongoNetworkError"),
      });
      const report = await service.createReport(validInput());

      expect(report.reportId).toBeDefined();
      expect(report.riskScore).toBe(75);
    });

    it("returns report on MongoServerError", async () => {
      const service = new ReportService({
        reportModel: createFailingReportModel("MongoServerError"),
      });
      const report = await service.createReport(validInput());

      expect(report.reportId).toBeDefined();
    });

    it("returns report on buffering timeout", async () => {
      const model = {
        create: async () => {
          throw new Error("buffering timed out for 10000ms");
        },
      };
      const service = new ReportService({ reportModel: model });
      const report = await service.createReport(validInput());

      expect(report.reportId).toBeDefined();
    });
  });

  describe("createReport factory function", () => {
    it("creates report using default ReportService", async () => {
      const report = await createReport(validInput(), { reportModel: createMockReportModel() });
      expect(report.reportId).toBeDefined();
      expect(report.inputType).toBe("url");
    });
  });

  describe("contract enforcement", () => {
    it("output contains exactly the required fields", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      const report = await service.createReport(validInput());

      const expectedFields = [
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
      ];

      expect(Object.keys(report).sort()).toEqual(expectedFields.sort());
    });

    it("does not include internal fields in output", async () => {
      const service = new ReportService({ reportModel: createMockReportModel() });
      const report = await service.createReport(validInput());

      const forbiddenKeys = [
        "persisted",
        "_id",
        "__v",
        "rawLlmResponse",
        "providerMetadata",
        "apiLatency",
        "stackTrace",
        "internalPrompts",
      ];

      for (const key of forbiddenKeys) {
        expect(report).not.toHaveProperty(key);
      }
    });
  });
});
