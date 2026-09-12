import { AnalysisOrchestrator } from "../../src/services/AnalysisOrchestrator.js";

function createMockUrlAnalyzer(result = {}) {
  return {
    analyze: async (url) => ({
      type: "url",
      indicators: result.indicators || [],
      suspiciousPatterns: result.suspiciousPatterns || [],
      urlRiskScore: result.riskScore || 0,
      extractedDomains: result.domains || [url],
      analyzedAt: new Date().toISOString(),
    }),
  };
}

function createMockMessageAnalyzer(result = {}) {
  return {
    analyze: async (text) => ({
      type: "message",
      indicators: result.indicators || [],
      socialEngineeringSignals: result.signals || [],
      messageRiskScore: result.riskScore || 0,
      extractedUrls: result.urls || [],
      analyzedAt: new Date().toISOString(),
    }),
  };
}

function createMockRiskEngine(result = {}) {
  return {
    computeScore: () => ({
      riskScore: result.riskScore ?? 0,
      threatLevel: result.threatLevel ?? "Low",
      threatType: result.threatType ?? "Unknown",
      scoringBreakdown: [],
    }),
    applyAiAdjustment: (base, adj) => ({
      finalScore: Math.max(0, Math.min(100, base + (adj || 0))),
      adjustment: adj || 0,
      baseScore: base,
      clamped: false,
    }),
  };
}

function createMockAiAgent(result = {}) {
  return {
    interpret: async () => ({
      adjustment: 0,
      adjustedScore: result.adjustedScore ?? 0,
      explanation: result.explanation ?? "Test explanation",
      urduExplanation: null,
      recommendedActions: result.actions ?? ["Do nothing"],
    }),
  };
}

function createMockOcrService(result = {}) {
  return {
    extractText: async () => ({
      text: result.text || "",
      urls: result.urls || [],
      confidence: result.confidence || 0.9,
    }),
  };
}

describe("AnalysisOrchestrator", () => {
  describe("analyzeUrl", () => {
    it("returns correct report shape", async () => {
      const orch = new AnalysisOrchestrator({
        urlAnalyzer: createMockUrlAnalyzer({ riskScore: 42 }),
        riskEngine: createMockRiskEngine({ riskScore: 42, threatLevel: "Suspicious" }),
        aiAgent: createMockAiAgent({ adjustedScore: 50 }),
      });

      const result = await orch.analyzeUrl("https://example.com");

      expect(result.reportId).toBeUndefined();
      expect(result.evidence).toBeDefined();
      expect(result.evidence.indicators).toBeDefined();
      expect(result.evidence.urls.some((u) => u.includes("example.com"))).toBe(true);
      expect(result.deterministic.riskScore).toBe(42);
      expect(result.deterministic.threatLevel).toBe("Suspicious");
      expect(result.aiResult.adjustedScore).toBe(42);
      expect(result.timeline).toBeDefined();
      expect(result.timeline.events.length).toBeGreaterThanOrEqual(5);
      expect(result.urls.some((u) => u.includes("example.com"))).toBe(true);
    });

    it("includes 8-step timeline", async () => {
      const orch = new AnalysisOrchestrator({
        urlAnalyzer: createMockUrlAnalyzer(),
        riskEngine: createMockRiskEngine(),
        aiAgent: createMockAiAgent(),
      });

      const result = await orch.analyzeUrl("https://example.com");
      const events = result.timeline.events.map((t) => t.name);

      expect(events.some((e) => e.includes("Input received"))).toBe(true);
      expect(events.some((e) => e.includes("URLs/domains"))).toBe(true);
      expect(events.some((e) => e.includes("Domain analysis"))).toBe(true);
      expect(events.some((e) => e.includes("Security indicators"))).toBe(true);
      expect(events.some((e) => e.includes("Risk calculated"))).toBe(true);
      expect(events.some((e) => e.includes("Threat classification"))).toBe(true);
      expect(events.some((e) => e.includes("Final report"))).toBe(true);
    });
  });

  describe("analyzeMessage", () => {
    it("merges message + URL evidence", async () => {
      const orch = new AnalysisOrchestrator({
        messageAnalyzer: createMockMessageAnalyzer({ signals: ["urgency"] }),
        urlAnalyzer: createMockUrlAnalyzer({ indicators: [{ type: "shortener" }] }),
        riskEngine: createMockRiskEngine({ riskScore: 60, threatLevel: "High" }),
        aiAgent: createMockAiAgent({ adjustedScore: 65 }),
      });

      const result = await orch.analyzeMessage("Visit https://bit.ly/x now!");

      expect(result.evidence.urls).toContain("https://bit.ly/x");
      expect(result.evidence.messageSignals).toContain("urgency");
      expect(result.deterministic.threatLevel).toBe("High");
    });
  });

  describe("analyzeCombined", () => {
    it("deduplicates URLs", async () => {
      const orch = new AnalysisOrchestrator({
        messageAnalyzer: createMockMessageAnalyzer(),
        urlAnalyzer: createMockUrlAnalyzer(),
        riskEngine: createMockRiskEngine(),
        aiAgent: createMockAiAgent(),
      });

      const result = await orch.analyzeCombined("Visit https://example.com", ["https://example.com"]);

      const uniqueUrls = [...new Set(result.urls)];
      expect(result.urls.length).toBe(uniqueUrls.length);
    });
  });

  describe("partial failure handling", () => {
    it("handles one URL analyzer failing", async () => {
      const failAnalyzer = {
        analyze: async (url) => {
          if (url.includes("bad")) throw new Error("Analysis failed");
          return { type: "url", indicators: [], urlRiskScore: 0, extractedDomains: [url], analyzedAt: new Date().toISOString() };
        },
      };

      const orch = new AnalysisOrchestrator({
        messageAnalyzer: createMockMessageAnalyzer(),
        urlAnalyzer: failAnalyzer,
        riskEngine: createMockRiskEngine(),
        aiAgent: createMockAiAgent(),
      });

      const result = await orch.analyzeCombined("text", ["https://good.com", "https://bad.com"]);

      expect(result.evidence.sourceResults.some((r) => r.status === "failed")).toBe(true);
      expect(result.evidence.sourceResults.some((r) => r.status === "success")).toBe(true);
      expect(result.evidence.metadata.failedAnalyses).toBe(1);
      expect(result.evidence.metadata.successfulAnalyses).toBeGreaterThanOrEqual(1);
    });

    it("handles message analyzer failure", async () => {
      const orch = new AnalysisOrchestrator({
        messageAnalyzer: { analyze: async () => { throw new Error("fail"); } },
        urlAnalyzer: createMockUrlAnalyzer(),
        riskEngine: createMockRiskEngine(),
        aiAgent: createMockAiAgent(),
      });

      const result = await orch.analyzeCombined("text", ["https://x.com"]);
      expect(result.evidence.metadata.failedAnalyses).toBeGreaterThanOrEqual(1);
      expect(result.deterministic).toBeDefined();
    });

    it("handles all modules failing gracefully", async () => {
      const orch = new AnalysisOrchestrator({
        messageAnalyzer: { analyze: async () => { throw new Error("fail"); } },
        urlAnalyzer: { analyze: async () => { throw new Error("fail"); } },
        riskEngine: createMockRiskEngine(),
        aiAgent: createMockAiAgent(),
      });

      const result = await orch.analyzeCombined("text", ["https://x.com"]);
      expect(result.evidence.metadata.failedAnalyses).toBeGreaterThanOrEqual(1);
      expect(result.deterministic.threatLevel).toBe("Low");
    });
  });
});
