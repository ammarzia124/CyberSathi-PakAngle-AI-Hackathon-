import {
  createEmptyEvidence,
  addIndicator,
  addSourceResult,
  mergeEvidence,
  buildEvidenceFromModuleResult,
  assembleUnifiedEvidence,
} from "../../src/utils/orchestratorEvidence.js";

describe("orchestratorEvidence", () => {
  describe("createEmptyEvidence", () => {
    it("returns correct empty shape", () => {
      const e = createEmptyEvidence("url");
      expect(e.indicators).toEqual([]);
      expect(e.urls).toEqual([]);
      expect(e.messageSignals).toEqual([]);
      expect(e.domainSignals).toEqual([]);
      expect(e.sourceResults).toEqual([]);
      expect(e.metadata.inputType).toBe("url");
      expect(e.metadata.totalUrls).toBe(0);
      expect(e.metadata.successfulAnalyses).toBe(0);
      expect(e.metadata.failedAnalyses).toBe(0);
    });
  });

  describe("addIndicator", () => {
    it("adds indicator with source attribution", () => {
      const e = createEmptyEvidence("url");
      addIndicator(e, { type: "phishing", severity: "high", description: "test" }, "url-analyzer", "https://evil.com");
      expect(e.indicators).toHaveLength(1);
      expect(e.indicators[0].source).toBe("url-analyzer");
      expect(e.indicators[0].sourceInput).toBe("https://evil.com");
      expect(e.indicators[0].id).toBeDefined();
      expect(e.indicators[0].analyzedAt).toBeDefined();
    });
  });

  describe("addSourceResult", () => {
    it("tracks success", () => {
      const e = createEmptyEvidence("url");
      addSourceResult(e, "url-analyzer", "https://x.com", "success", { riskScore: 42, indicatorCount: 2 });
      expect(e.sourceResults).toHaveLength(1);
      expect(e.sourceResults[0].status).toBe("success");
      expect(e.sourceResults[0].riskScore).toBe(42);
      expect(e.metadata.successfulAnalyses).toBe(1);
    });

    it("tracks failure with error", () => {
      const e = createEmptyEvidence("url");
      addSourceResult(e, "url-analyzer", "https://x.com", "failed", { error: "timeout" });
      expect(e.sourceResults[0].status).toBe("failed");
      expect(e.sourceResults[0].error).toBe("timeout");
      expect(e.metadata.failedAnalyses).toBe(1);
    });
  });

  describe("mergeEvidence", () => {
    it("combines two evidence objects", () => {
      const a = createEmptyEvidence("combined");
      const b = createEmptyEvidence("url");
      b.urls.push("https://x.com");
      b.indicators.push({ type: "test", severity: "low" });
      mergeEvidence(a, b);
      expect(a.urls).toContain("https://x.com");
      expect(a.indicators).toHaveLength(1);
    });
  });

  describe("assembleUnifiedEvidence", () => {
    it("handles fulfilled results", () => {
      const results = [
        { status: "fulfilled", value: { source: "url-analyzer", moduleOutput: { type: "url", indicators: [{ type: "phishing", severity: "high" }], extractedDomains: ["evil.com"] } } },
      ];
      const e = assembleUnifiedEvidence("url", results);
      expect(e.indicators).toHaveLength(1);
      expect(e.urls).toContain("evil.com");
      expect(e.metadata.successfulAnalyses).toBe(1);
    });

    it("handles rejected results", () => {
      const results = [
        { status: "rejected", reason: { source: "url-analyzer", input: "https://x.com", error: new Error("timeout") } },
      ];
      const e = assembleUnifiedEvidence("url", results);
      expect(e.indicators).toHaveLength(0);
      expect(e.metadata.failedAnalyses).toBe(1);
      expect(e.sourceResults[0].error).toBe("timeout");
    });

    it("handles mixed results", () => {
      const results = [
        { status: "fulfilled", value: { source: "message-analyzer", moduleOutput: { type: "message", indicators: [], socialEngineeringSignals: ["urgency"] } } },
        { status: "rejected", reason: { source: "url-analyzer", input: "https://bad.com", error: new Error("fail") } },
        { status: "fulfilled", value: { source: "url-analyzer", moduleOutput: { type: "url", indicators: [{ type: "tld" }], extractedDomains: ["good.com"] } } },
      ];
      const e = assembleUnifiedEvidence("combined", results);
      expect(e.indicators).toHaveLength(1);
      expect(e.urls).toContain("good.com");
      expect(e.messageSignals).toContain("urgency");
      expect(e.metadata.successfulAnalyses).toBe(2);
      expect(e.metadata.failedAnalyses).toBe(1);
    });
  });
});
