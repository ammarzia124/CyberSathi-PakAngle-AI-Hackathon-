import { jest } from "@jest/globals";

process.env.SUPABASE_URL = "https://smnygafwwkiscugayuff.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
process.env.OPENAI_API_KEY = "";

jest.setTimeout(30000);

const { default: request } = await import("supertest");
const { default: app } = await import("../../src/app.js");
const { RiskEngine } = await import("../../src/modules/risk-engine/RiskEngine.js");
const { AiAgent } = await import("../../src/modules/ai-agent/AiAgent.js");
const { validateAiResponse, normalizeAdjustment } = await import("../../src/modules/ai-agent/scoreAdjuster.js");

describe("Security Tests", () => {
  describe("S1: API keys not in source code", () => {
    it("env.example does not contain real API keys", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const examplePath = path.default.join(process.cwd(), ".env.example");
      if (fs.default.existsSync(examplePath)) {
        const content = fs.default.readFileSync(examplePath, "utf-8");
        expect(content).not.toContain("sk-");
        expect(content).not.toContain("your-real-key");
      }
    });
  });

  describe("S2: Uploaded files are validated", () => {
    it("rejects .exe files", async () => {
      const res = await request(app)
        .post("/api/analyze/screenshot")
        .attach("screenshot", Buffer.from("MZ..."), {
          filename: "malware.exe",
          contentType: "application/exe",
        });

      expect(res.status).toBe(400);
    });

    it("rejects .txt files", async () => {
      const res = await request(app)
        .post("/api/analyze/screenshot")
        .attach("screenshot", Buffer.from("plain text"), {
          filename: "readme.txt",
          contentType: "text/plain",
        });

      expect(res.status).toBe(400);
    });

    it("rejects .pdf files", async () => {
      const res = await request(app)
        .post("/api/analyze/screenshot")
        .attach("screenshot", Buffer.from("%PDF-1.4"), {
          filename: "document.pdf",
          contentType: "application/pdf",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("S4: Invalid requests cannot crash the process", () => {
    it("handles malformed JSON", async () => {
      const res = await request(app)
        .post("/api/analyze/url")
        .set("Content-Type", "application/json")
        .send("{ broken }");

      expect(res.status).toBe(400);
    });

    it("handles missing body", async () => {
      const res = await request(app)
        .post("/api/analyze/url")
        .send();

      expect(res.status).toBe(400);
    });

    it("handles extremely long input", async () => {
      const longText = "a".repeat(100000);
      const res = await request(app)
        .post("/api/analyze/message")
        .send({ text: longText });

      expect([201, 400, 413]).toContain(res.status);
    });

    it("handles SQL injection in URL", async () => {
      const res = await request(app)
        .post("/api/analyze/url")
        .send({ url: "https://example.com?id=1'; DROP TABLE reports;--" });

      expect([201, 400]).toContain(res.status);
    });

    it("handles script injection in message", async () => {
      const res = await request(app)
        .post("/api/analyze/message")
        .send({ text: "<script>alert('xss')</script>" });

      expect([201, 400]).toContain(res.status);
    });
  });

  describe("S5: LLM output is schema-validated", () => {
    it("rejects null input", () => {
      const result = validateAiResponse(null);
      expect(result.valid).toBe(false);
    });

    it("rejects missing explanation", () => {
      const result = validateAiResponse({
        recommendedActions: [],
        scoreAdjustment: 0,
      });
      expect(result.valid).toBe(false);
    });

    it("rejects non-integer score adjustment", () => {
      const result = validateAiResponse({
        explanation: "test",
        recommendedActions: [],
        scoreAdjustment: 5.5,
      });
      expect(result.valid).toBe(false);
    });

    it("rejects non-array recommendedActions", () => {
      const result = validateAiResponse({
        explanation: "test",
        recommendedActions: "not-array",
        scoreAdjustment: 0,
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("S6: AI cannot change deterministic evidence", () => {
    it("AI adjustment is separate from evidence array", () => {
      const engine = new RiskEngine();
      const evidence = [
        { type: "suspicious-tld", severity: "high", weight: 1, evidence: "test", source: "url-analyzer" },
      ];
      const deterministic = engine.computeScore(evidence);
      const adjusted = engine.applyAiAdjustment(deterministic.riskScore, 15);

      expect(deterministic.riskScore).toBeGreaterThan(0);
      expect(adjusted.finalScore).toBeGreaterThanOrEqual(deterministic.riskScore);
    });
  });

  describe("S7: AI score adjustment is bounded", () => {
    it("clamps adjustment to +15", () => {
      expect(normalizeAdjustment(100)).toBe(15);
      expect(normalizeAdjustment(15)).toBe(15);
    });

    it("clamps adjustment to -15", () => {
      expect(normalizeAdjustment(-100)).toBe(-15);
      expect(normalizeAdjustment(-15)).toBe(-15);
    });

    it("preserves adjustment within bounds", () => {
      expect(normalizeAdjustment(10)).toBe(10);
      expect(normalizeAdjustment(-10)).toBe(-10);
      expect(normalizeAdjustment(0)).toBe(0);
    });
  });

  describe("S8: Scores cannot exceed 100", () => {
    it("clamps final score to 100", () => {
      const engine = new RiskEngine();
      const adjusted = engine.applyAiAdjustment(95, 15);
      expect(adjusted.finalScore).toBe(100);
    });

    it("clamps even with extreme input", () => {
      const engine = new RiskEngine();
      const adjusted = engine.applyAiAdjustment(100, 15);
      expect(adjusted.finalScore).toBe(100);
    });
  });

  describe("S9: Scores cannot fall below 0", () => {
    it("clamps final score to 0", () => {
      const engine = new RiskEngine();
      const adjusted = engine.applyAiAdjustment(5, -15);
      expect(adjusted.finalScore).toBe(0);
    });

    it("clamps even with extreme negative", () => {
      const engine = new RiskEngine();
      const adjusted = engine.applyAiAdjustment(0, -15);
      expect(adjusted.finalScore).toBe(0);
    });
  });

  describe("AI Agent fallback", () => {
    it("returns fallback when no API key is set", async () => {
      const agent = new AiAgent();
      const result = await agent.interpret({
        evidence: [{ type: "test", severity: "low", weight: 1, evidence: "test", source: "s" }],
        baseRiskScore: 50,
        urls: [],
        inputType: "message",
      });

      expect(result.scoreAdjustment).toBe(0);
      expect(result.explanation).toContain("unavailable");
      expect(result.threatType).toBe("Unknown");
      expect(Array.isArray(result.recommendedActions)).toBe(true);
    });
  });
});
