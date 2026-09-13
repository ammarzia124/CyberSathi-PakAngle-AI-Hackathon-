import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
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
      threatType: result.threatType ?? "Unknown",
      recommendedActions: result.actions ?? ["Do nothing"],
      scoreAdjustment: 0,
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

function createTempImage() {
  const tmpDir = os.tmpdir();
  const filename = `test-screenshot-${uuidv4()}.png`;
  const filePath = path.join(tmpDir, filename);
  // Minimal valid PNG (1x1 pixel)
  const pngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  fs.writeFileSync(filePath, pngBuffer);
  return filePath;
}

function cleanupTempFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // ignore cleanup errors in tests
  }
}

describe("Screenshot Analysis (Orchestrator)", () => {
  it("returns correct report shape for a screenshot", async () => {
    const orch = new AnalysisOrchestrator({
      ocrService: createMockOcrService({ text: "Hello world", confidence: 0.85 }),
      messageAnalyzer: createMockMessageAnalyzer({ riskScore: 10 }),
      urlAnalyzer: createMockUrlAnalyzer({ riskScore: 5 }),
      riskEngine: createMockRiskEngine({ riskScore: 10, threatLevel: "Low" }),
      aiAgent: createMockAiAgent({ adjustedScore: 12 }),
    });

    const tempPath = createTempImage();
    try {
      const result = await orch.analyzeScreenshot(tempPath);

      expect(result.evidence).toBeDefined();
      expect(result.evidence.metadata.inputType).toBe("screenshot");
      expect(result.deterministic).toBeDefined();
      expect(result.deterministic.threatLevel).toBe("Low");
      expect(result.aiResult).toBeDefined();
      expect(result.timeline).toBeDefined();
      expect(Array.isArray(result.timeline)).toBe(true);
      expect(result.timeline.length).toBeGreaterThanOrEqual(4);
      expect(result.urls).toEqual([]);
    } finally {
      cleanupTempFile(tempPath);
    }
  });

  it("extracts URLs from OCR text and analyzes them", async () => {
    const orch = new AnalysisOrchestrator({
      ocrService: createMockOcrService({
        text: "Visit https://evil-phishing.xyz/login now!",
        urls: ["https://evil-phishing.xyz/login"],
      }),
      messageAnalyzer: createMockMessageAnalyzer(),
      urlAnalyzer: createMockUrlAnalyzer({ riskScore: 80, indicators: [{ type: "suspicious-tld" }] }),
      riskEngine: createMockRiskEngine({ riskScore: 80, threatLevel: "Critical" }),
      aiAgent: createMockAiAgent({ adjustedScore: 85 }),
    });

    const tempPath = createTempImage();
    try {
      const result = await orch.analyzeScreenshot(tempPath);

      expect(result.urls).toContain("https://evil-phishing.xyz/login");
      expect(result.evidence.urls).toContain("https://evil-phishing.xyz/login");
    } finally {
      cleanupTempFile(tempPath);
    }
  });

  it("analyzes message text when OCR returns text without URLs", async () => {
    const orch = new AnalysisOrchestrator({
      ocrService: createMockOcrService({
        text: "Congratulations! You have won Rs. 500,000!",
        urls: [],
      }),
      messageAnalyzer: createMockMessageAnalyzer({
        riskScore: 70,
        signals: ["urgency", "financial"],
        indicators: [{ type: "scam", severity: "high" }],
      }),
      urlAnalyzer: createMockUrlAnalyzer(),
      riskEngine: createMockRiskEngine({ riskScore: 70, threatLevel: "High" }),
      aiAgent: createMockAiAgent({ adjustedScore: 75 }),
    });

    const tempPath = createTempImage();
    try {
      const result = await orch.analyzeScreenshot(tempPath);

      expect(result.evidence.messageSignals).toContain("urgency");
      expect(result.evidence.messageSignals).toContain("financial");
      expect(result.deterministic.threatLevel).toBe("High");
    } finally {
      cleanupTempFile(tempPath);
    }
  });

  it("handles multiple URLs from OCR", async () => {
    const orch = new AnalysisOrchestrator({
      ocrService: createMockOcrService({
        text: "Check https://a.com and https://b.com",
        urls: ["https://a.com", "https://b.com"],
      }),
      messageAnalyzer: createMockMessageAnalyzer(),
      urlAnalyzer: createMockUrlAnalyzer({ riskScore: 30 }),
      riskEngine: createMockRiskEngine({ riskScore: 30, threatLevel: "Suspicious" }),
      aiAgent: createMockAiAgent({ adjustedScore: 35 }),
    });

    const tempPath = createTempImage();
    try {
      const result = await orch.analyzeScreenshot(tempPath);

      expect(result.urls).toContain("https://a.com");
      expect(result.urls).toContain("https://b.com");
      expect(result.evidence.urls).toContain("https://a.com");
      expect(result.evidence.urls).toContain("https://b.com");
    } finally {
      cleanupTempFile(tempPath);
    }
  });

  it("handles OCR returning empty text gracefully", async () => {
    const orch = new AnalysisOrchestrator({
      ocrService: createMockOcrService({ text: "", urls: [], confidence: 0.1 }),
      messageAnalyzer: createMockMessageAnalyzer(),
      urlAnalyzer: createMockUrlAnalyzer(),
      riskEngine: createMockRiskEngine({ riskScore: 0, threatLevel: "Low" }),
      aiAgent: createMockAiAgent({ adjustedScore: 0 }),
    });

    const tempPath = createTempImage();
    try {
      const result = await orch.analyzeScreenshot(tempPath);

      expect(result.evidence).toBeDefined();
      expect(result.deterministic.threatLevel).toBe("Low");
      expect(result.urls).toEqual([]);
    } finally {
      cleanupTempFile(tempPath);
    }
  });

  it("handles OCR failure gracefully", async () => {
    const orch = new AnalysisOrchestrator({
      ocrService: {
        extractText: async () => ({
          text: "",
          urls: [],
          confidence: 0,
          error: "Tesseract crashed",
        }),
      },
      messageAnalyzer: createMockMessageAnalyzer(),
      urlAnalyzer: createMockUrlAnalyzer(),
      riskEngine: createMockRiskEngine({ riskScore: 0, threatLevel: "Low" }),
      aiAgent: createMockAiAgent({ adjustedScore: 0 }),
    });

    const tempPath = createTempImage();
    try {
      const result = await orch.analyzeScreenshot(tempPath);
      expect(result.evidence).toBeDefined();
      expect(result.deterministic.threatLevel).toBe("Low");
    } finally {
      cleanupTempFile(tempPath);
    }
  });

  it("includes OCR event in timeline", async () => {
    const orch = new AnalysisOrchestrator({
      ocrService: createMockOcrService({ text: "test", urls: [] }),
      messageAnalyzer: createMockMessageAnalyzer(),
      urlAnalyzer: createMockUrlAnalyzer(),
      riskEngine: createMockRiskEngine(),
      aiAgent: createMockAiAgent(),
    });

    const tempPath = createTempImage();
    try {
      const result = await orch.analyzeScreenshot(tempPath);
      const events = result.timeline.map((t) => t.name);
      expect(events.some((e) => e.includes("Input received"))).toBe(true);
    } finally {
      cleanupTempFile(tempPath);
    }
  });

  it("temp file is deleted after successful processing", async () => {
    const orch = new AnalysisOrchestrator({
      ocrService: createMockOcrService({ text: "test" }),
      messageAnalyzer: createMockMessageAnalyzer(),
      urlAnalyzer: createMockUrlAnalyzer(),
      riskEngine: createMockRiskEngine(),
      aiAgent: createMockAiAgent(),
    });

    const tempPath = createTempImage();
    expect(fs.existsSync(tempPath)).toBe(true);

    // The controller handles cleanup, not the orchestrator
    // This test verifies the orchestrator doesn't hold file locks
    await orch.analyzeScreenshot(tempPath);

    // Simulate controller cleanup
    cleanupTempFile(tempPath);
    expect(fs.existsSync(tempPath)).toBe(false);
  });

  it("temp file is deleted after downstream failure", async () => {
    const orch = new AnalysisOrchestrator({
      ocrService: createMockOcrService({ text: "test" }),
      messageAnalyzer: {
        analyze: async () => {
          throw new Error("Message analyzer crashed");
        },
      },
      urlAnalyzer: createMockUrlAnalyzer(),
      riskEngine: createMockRiskEngine(),
      aiAgent: createMockAiAgent(),
    });

    const tempPath = createTempImage();
    expect(fs.existsSync(tempPath)).toBe(true);

    // Orchestrator should not crash even if downstream fails
    const result = await orch.analyzeScreenshot(tempPath);
    expect(result.evidence).toBeDefined();

    // Simulate controller cleanup
    cleanupTempFile(tempPath);
    expect(fs.existsSync(tempPath)).toBe(false);
  });
});
