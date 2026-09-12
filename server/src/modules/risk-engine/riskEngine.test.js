let RiskEngine;

beforeAll(async () => {
  const mod = await import("./RiskEngine.js");
  RiskEngine = mod.RiskEngine;
});

describe("RiskEngine.computeScore", () => {
  it("returns score 0 for no indicators", () => {
    const engine = new RiskEngine();
    const result = engine.computeScore([]);
    expect(result.riskScore).toBe(0);
    expect(result.threatLevel).toBe("Low");
  });

  it("returns score 0 for undefined/null input", () => {
    const engine = new RiskEngine();
    expect(engine.computeScore(undefined).riskScore).toBe(0);
    expect(engine.computeScore(null).riskScore).toBe(0);
  });

  it("scores a single low indicator correctly", () => {
    const engine = new RiskEngine();
    const result = engine.computeScore([
      { type: "urgency", severity: "low", weight: 1, evidence: "test", source: "test" },
    ]);
    expect(result.riskScore).toBe(10);
    expect(result.threatLevel).toBe("Low");
  });

  it("scores a single medium indicator correctly", () => {
    const engine = new RiskEngine();
    const result = engine.computeScore([
      { type: "financial", severity: "medium", weight: 1, evidence: "test", source: "test" },
    ]);
    expect(result.riskScore).toBe(30);
    expect(result.threatLevel).toBe("Suspicious");
  });

  it("scores a single high indicator correctly", () => {
    const engine = new RiskEngine();
    const result = engine.computeScore([
      { type: "credential", severity: "high", weight: 1, evidence: "test", source: "test" },
    ]);
    expect(result.riskScore).toBe(60);
    expect(result.threatLevel).toBe("High");
  });

  it("scores a single critical indicator correctly", () => {
    const engine = new RiskEngine();
    const result = engine.computeScore([
      { type: "malware", severity: "critical", weight: 1, evidence: "test", source: "test" },
    ]);
    expect(result.riskScore).toBe(90);
    expect(result.threatLevel).toBe("Critical");
  });

  it("computes weighted average for multiple indicators", () => {
    const engine = new RiskEngine();
    const result = engine.computeScore([
      { type: "low", severity: "low", weight: 1, evidence: "a", source: "s" },
      { type: "high", severity: "high", weight: 1, evidence: "b", source: "s" },
    ]);
    // (10*1 + 60*1) / 2 = 35
    expect(result.riskScore).toBe(35);
  });

  it("weights indicators correctly", () => {
    const engine = new RiskEngine();
    const result = engine.computeScore([
      { type: "low", severity: "low", weight: 3, evidence: "a", source: "s" },
      { type: "high", severity: "high", weight: 1, evidence: "b", source: "s" },
    ]);
    // (10*3 + 60*1) / 4 = 90/4 = 22.5 -> 23
    expect(result.riskScore).toBe(23);
  });

  it("clamps score to max 100", () => {
    const engine = new RiskEngine();
    const result = engine.computeScore([
      { type: "critical", severity: "critical", weight: 1, evidence: "a", source: "s" },
      { type: "critical", severity: "critical", weight: 1, evidence: "b", source: "s" },
      { type: "critical", severity: "critical", weight: 1, evidence: "c", source: "s" },
      { type: "critical", severity: "critical", weight: 1, evidence: "d", source: "s" },
      { type: "critical", severity: "critical", weight: 1, evidence: "e", source: "s" },
    ]);
    // All critical (90), average is 90. Score is naturally clamped by bounds.
    expect(result.riskScore).toBeLessThanOrEqual(100);
    expect(result.riskScore).toBe(90);
  });

  it("clamps score to min 0", () => {
    const engine = new RiskEngine();
    const result = engine.computeScore([
      { type: "low", severity: "low", weight: 1, evidence: "a", source: "s" },
    ]);
    expect(result.riskScore).toBeGreaterThanOrEqual(0);
  });

  it("defaults weight to 1 when weight is missing or zero", () => {
    const engine = new RiskEngine();
    const result = engine.computeScore([
      { type: "medium", severity: "medium", evidence: "a", source: "s" },
      { type: "medium", severity: "medium", weight: 0, evidence: "b", source: "s" },
    ]);
    // Both should have weight 1: (30*1 + 30*1) / 2 = 30
    expect(result.riskScore).toBe(30);
  });

  it("defaults severity to low when severity is missing", () => {
    const engine = new RiskEngine();
    const result = engine.computeScore([
      { type: "unknown", weight: 1, evidence: "a", source: "s" },
    ]);
    expect(result.riskScore).toBe(10);
  });

  it("returns scoring breakdown", () => {
    const engine = new RiskEngine();
    const result = engine.computeScore([
      { type: "urgency", severity: "medium", weight: 2, evidence: "a", source: "msg" },
    ]);
    expect(result.scoringBreakdown).toHaveLength(1);
    expect(result.scoringBreakdown[0]).toEqual({
      source: "msg",
      score: 30,
      weight: 2,
    });
  });

  it("derives threat type from urgency indicators", () => {
    const engine = new RiskEngine();
    const result = engine.computeScore([
      { type: "urgency", severity: "high", weight: 1, evidence: "act now or else", source: "s" },
    ]);
    expect(result.threatType).toBe("social-engineering");
  });

  it("derives threat type from financial indicators", () => {
    const engine = new RiskEngine();
    const result = engine.computeScore([
      { type: "financial", severity: "high", weight: 1, evidence: "send money via upi", source: "s" },
    ]);
    expect(result.threatType).toBe("financial-fraud");
  });

  it("returns Unknown threat type for empty evidence", () => {
    const engine = new RiskEngine();
    const result = engine.computeScore([]);
    expect(result.threatType).toBe("Unknown");
  });
});

describe("RiskEngine.applyAiAdjustment", () => {
  it("applies positive adjustment within bounds", () => {
    const engine = new RiskEngine();
    const result = engine.applyAiAdjustment(50, 10);
    expect(result.finalScore).toBe(60);
    expect(result.adjustment).toBe(10);
    expect(result.baseScore).toBe(50);
    expect(result.clamped).toBe(false);
  });

  it("applies negative adjustment within bounds", () => {
    const engine = new RiskEngine();
    const result = engine.applyAiAdjustment(50, -10);
    expect(result.finalScore).toBe(40);
    expect(result.adjustment).toBe(-10);
    expect(result.clamped).toBe(false);
  });

  it("clamps adjustment to +15 max", () => {
    const engine = new RiskEngine();
    const result = engine.applyAiAdjustment(50, 50);
    expect(result.finalScore).toBe(65);
    expect(result.adjustment).toBe(15);
    expect(result.clamped).toBe(true);
  });

  it("clamps adjustment to -15 min", () => {
    const engine = new RiskEngine();
    const result = engine.applyAiAdjustment(50, -50);
    expect(result.finalScore).toBe(35);
    expect(result.adjustment).toBe(-15);
    expect(result.clamped).toBe(true);
  });

  it("clamps final score to max 100", () => {
    const engine = new RiskEngine();
    const result = engine.applyAiAdjustment(95, 15);
    expect(result.finalScore).toBe(100);
    expect(result.adjustment).toBe(15);
  });

  it("clamps final score to min 0", () => {
    const engine = new RiskEngine();
    const result = engine.applyAiAdjustment(5, -15);
    expect(result.finalScore).toBe(0);
    expect(result.adjustment).toBe(-15);
  });

  it("treats undefined adjustment as 0", () => {
    const engine = new RiskEngine();
    const result = engine.applyAiAdjustment(50, undefined);
    expect(result.finalScore).toBe(50);
    expect(result.adjustment).toBe(0);
    expect(result.clamped).toBe(false);
  });

  it("treats null adjustment as 0", () => {
    const engine = new RiskEngine();
    const result = engine.applyAiAdjustment(50, null);
    expect(result.finalScore).toBe(50);
    expect(result.adjustment).toBe(0);
  });

  it("treats non-number adjustment as 0", () => {
    const engine = new RiskEngine();
    const result = engine.applyAiAdjustment(50, "invalid");
    expect(result.finalScore).toBe(50);
    expect(result.adjustment).toBe(0);
  });

  it("handles adjustment of exactly 0", () => {
    const engine = new RiskEngine();
    const result = engine.applyAiAdjustment(50, 0);
    expect(result.finalScore).toBe(50);
    expect(result.adjustment).toBe(0);
    expect(result.clamped).toBe(false);
  });
});

describe("RiskEngine integration", () => {
  it("computeScore works without AI agent", () => {
    const engine = new RiskEngine();
    const score = engine.computeScore([
      { type: "phishing", severity: "critical", weight: 5, evidence: "login page steal", source: "url-analyzer" },
      { type: "urgency", severity: "high", weight: 3, evidence: "act now", source: "message-analyzer" },
    ]);
    // (90*5 + 60*3) / 8 = 630/8 = 78.75 -> 79
    expect(score.riskScore).toBe(79);
    expect(score.threatLevel).toBe("High");
  });

  it("full pipeline: compute + adjust", () => {
    const engine = new RiskEngine();
    const base = engine.computeScore([
      { type: "financial", severity: "high", weight: 2, evidence: "send money", source: "s" },
    ]);
    const final = engine.applyAiAdjustment(base.riskScore, -5);
    expect(final.finalScore).toBe(55);
    expect(final.baseScore).toBe(60);
  });
});
