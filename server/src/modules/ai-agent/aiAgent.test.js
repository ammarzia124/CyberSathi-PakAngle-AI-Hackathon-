let AiAgent;
let validateAiResponse;
let normalizeAdjustment;
let buildPrompt;
let adjustScore;

beforeAll(async () => {
  const agentMod = await import("./AiAgent.js");
  AiAgent = agentMod.AiAgent;

  const validatorMod = await import("./scoreAdjuster.js");
  validateAiResponse = validatorMod.validateAiResponse;
  normalizeAdjustment = validatorMod.normalizeAdjustment;

  const promptMod = await import("./prompts.js");
  buildPrompt = promptMod.buildPrompt;

  const adjustMod = await import("./scoreAdjuster.js");
  adjustScore = adjustMod.normalizeAdjustment;
});

describe("validateAiResponse", () => {
  it("accepts a valid response", () => {
    const result = validateAiResponse({
      explanation: "This is a phishing attempt.",
      threatType: "phishing",
      recommendedActions: ["Do not click", "Report"],
      scoreAdjustment: 10,
    });
    expect(result.valid).toBe(true);
    expect(result.normalized.explanation).toBe("This is a phishing attempt.");
    expect(result.normalized.threatType).toBe("phishing");
    expect(result.normalized.scoreAdjustment).toBe(10);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects null input", () => {
    const result = validateAiResponse(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Response is not an object");
  });

  it("rejects non-object input", () => {
    const result = validateAiResponse("string");
    expect(result.valid).toBe(false);
  });

  it("rejects missing explanation", () => {
    const result = validateAiResponse({
      recommendedActions: [],
      scoreAdjustment: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("explanation"))).toBe(true);
  });

  it("rejects empty explanation", () => {
    const result = validateAiResponse({
      explanation: "",
      recommendedActions: [],
      scoreAdjustment: 0,
    });
    expect(result.valid).toBe(false);
  });

  it("rejects missing scoreAdjustment", () => {
    const result = validateAiResponse({
      explanation: "test",
      recommendedActions: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("scoreAdjustment"))).toBe(true);
  });

  it("rejects non-integer scoreAdjustment", () => {
    const result = validateAiResponse({
      explanation: "test",
      recommendedActions: [],
      scoreAdjustment: 5.5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("not an integer"))).toBe(true);
  });

  it("clamps scoreAdjustment above +15 to 15", () => {
    const result = validateAiResponse({
      explanation: "test",
      recommendedActions: [],
      scoreAdjustment: 20,
    });
    expect(result.valid).toBe(true);
    expect(result.normalized.scoreAdjustment).toBe(15);
  });

  it("clamps scoreAdjustment below -15 to -15", () => {
    const result = validateAiResponse({
      explanation: "test",
      recommendedActions: [],
      scoreAdjustment: -20,
    });
    expect(result.valid).toBe(true);
    expect(result.normalized.scoreAdjustment).toBe(-15);
  });

  it("rejects non-array recommendedActions", () => {
    const result = validateAiResponse({
      explanation: "test",
      recommendedActions: "not an array",
      scoreAdjustment: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("recommendedActions"))).toBe(true);
  });

  it("defaults threatType to Unknown when missing", () => {
    const result = validateAiResponse({
      explanation: "test",
      recommendedActions: [],
      scoreAdjustment: 0,
    });
    expect(result.valid).toBe(true);
    expect(result.normalized.threatType).toBe("Unknown");
  });

  it("collects multiple errors", () => {
    const result = validateAiResponse({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe("normalizeAdjustment", () => {
  it("returns value within bounds unchanged", () => {
    expect(normalizeAdjustment(10)).toBe(10);
    expect(normalizeAdjustment(-10)).toBe(-10);
    expect(normalizeAdjustment(0)).toBe(0);
  });

  it("clamps to +15", () => {
    expect(normalizeAdjustment(50)).toBe(15);
    expect(normalizeAdjustment(15)).toBe(15);
  });

  it("clamps to -15", () => {
    expect(normalizeAdjustment(-50)).toBe(-15);
    expect(normalizeAdjustment(-15)).toBe(-15);
  });

  it("treats non-number as 0", () => {
    expect(normalizeAdjustment(undefined)).toBe(0);
    expect(normalizeAdjustment(null)).toBe(0);
    expect(normalizeAdjustment("foo")).toBe(0);
  });
});

describe("buildPrompt", () => {
  it("builds a prompt with evidence and URLs", () => {
    const prompt = buildPrompt({
      evidence: [
        { type: "urgency", severity: "high", weight: 2, evidence: "Act now!", source: "msg" },
      ],
      baseRiskScore: 65,
      urls: ["https://evil.com"],
      inputType: "message",
    });
    expect(prompt).toContain("65/100");
    expect(prompt).toContain("message");
    expect(prompt).toContain("Act now!");
    expect(prompt).toContain("evil.com");
    expect(prompt).toContain("scoreAdjustment");
  });

  it("handles empty evidence", () => {
    const prompt = buildPrompt({
      evidence: [],
      baseRiskScore: 0,
      urls: [],
      inputType: "url",
    });
    expect(prompt).toContain("0/100");
    expect(prompt).toContain("Evidence:");
    expect(prompt).toContain("scoreAdjustment");
  });
});

describe("AiAgent.interpret", () => {
  it("returns fallback when no API key is set", async () => {
    const agent = new AiAgent();
    const result = await agent.interpret({
      evidence: [{ type: "urgency", severity: "high", weight: 1, evidence: "test", source: "s" }],
      baseRiskScore: 50,
      urls: [],
      inputType: "message",
    });
    expect(result.scoreAdjustment).toBe(0);
    expect(result.explanation).toContain("unavailable");
    expect(result.threatType).toBe("Unknown");
    expect(Array.isArray(result.recommendedActions)).toBe(true);
  });

  it("returns fallback on LLM timeout", async () => {
    const agent = new AiAgent();
    agent.callLlmWithRetry = async () => {
      const err = new Error("LLM request timed out");
      err.status = 504;
      throw err;
    };
    const result = await agent.interpret({
      evidence: [{ type: "financial", severity: "critical", weight: 3, evidence: "send money", source: "s" }],
      baseRiskScore: 90,
      urls: ["https://scam.pk"],
      inputType: "combined",
    });
    expect(result.scoreAdjustment).toBe(0);
    expect(result.explanation).toContain("unavailable");
  });

  it("returns fallback on malformed JSON from LLM", async () => {
    const agent = new AiAgent();
    agent.callLlmWithRetry = async () => {
      return "not valid json {{{";
    };
    const result = await agent.interpret({
      evidence: [{ type: "phishing", severity: "high", weight: 1, evidence: "login steal", source: "s" }],
      baseRiskScore: 60,
      urls: [],
      inputType: "url",
    });
    expect(result.scoreAdjustment).toBe(0);
  });

  it("returns fallback when LLM response fails validation", async () => {
    const agent = new AiAgent();
    agent.callLlmWithRetry = async () => {
      return { explanation: "", scoreAdjustment: "not-a-number" };
    };
    const result = await agent.interpret({
      evidence: [{ type: "urgency", severity: "medium", weight: 1, evidence: "test", source: "s" }],
      baseRiskScore: 30,
      urls: [],
      inputType: "message",
    });
    expect(result.scoreAdjustment).toBe(0);
  });

  it("validates and returns a proper LLM response", async () => {
    const agent = new AiAgent();
    agent.callLlmWithRetry = async () => ({
      explanation: "This looks like a phishing attempt targeting credentials.",
      threatType: "phishing",
      recommendedActions: ["Do not enter password", "Report to authorities"],
      scoreAdjustment: 8,
    });
    const result = await agent.interpret({
      evidence: [{ type: "credential", severity: "high", weight: 2, evidence: "login page", source: "url" }],
      baseRiskScore: 60,
      urls: ["https://phish.com"],
      inputType: "url",
    });
    expect(result.explanation).toContain("phishing");
    expect(result.threatType).toBe("phishing");
    expect(result.scoreAdjustment).toBe(8);
    expect(result.recommendedActions).toHaveLength(2);
  });

  it("clamps out-of-bounds scoreAdjustment from LLM", async () => {
    const agent = new AiAgent();
    agent.callLlmWithRetry = async () => ({
      explanation: "High risk.",
      threatType: "phishing",
      recommendedActions: ["Don't click"],
      scoreAdjustment: 50,
    });
    const result = await agent.interpret({
      evidence: [{ type: "phishing", severity: "critical", weight: 1, evidence: "test", source: "s" }],
      baseRiskScore: 90,
      urls: [],
      inputType: "url",
    });
    expect(result.scoreAdjustment).toBe(15);
  });

  it("handles negative out-of-bounds adjustment", async () => {
    const agent = new AiAgent();
    agent.callLlmWithRetry = async () => ({
      explanation: "Actually safe.",
      threatType: "Unknown",
      recommendedActions: [],
      scoreAdjustment: -50,
    });
    const result = await agent.interpret({
      evidence: [{ type: "unknown", severity: "low", weight: 1, evidence: "test", source: "s" }],
      baseRiskScore: 10,
      urls: [],
      inputType: "message",
    });
    expect(result.scoreAdjustment).toBe(-15);
  });

  it("retries on 429 error then succeeds", async () => {
    const agent = new AiAgent();
    let attempts = 0;
    agent.callLlm = async () => {
      attempts++;
      if (attempts === 1) {
        const err = new Error("rate limited");
        err.status = 429;
        throw err;
      }
      return {
        explanation: "Retry succeeded.",
        threatType: "scam",
        recommendedActions: [],
        scoreAdjustment: 5,
      };
    };
    const result = await agent.interpret({
      evidence: [{ type: "prize", severity: "medium", weight: 1, evidence: "you won", source: "s" }],
      baseRiskScore: 30,
      urls: [],
      inputType: "message",
    });
    expect(result.scoreAdjustment).toBe(5);
    expect(attempts).toBe(2);
  });

  it("does not retry on non-retryable error", async () => {
    const agent = new AiAgent();
    let attempts = 0;
    agent.callLlm = async () => {
      attempts++;
      const err = new Error("bad request");
      err.status = 400;
      throw err;
    };
    const result = await agent.interpret({
      evidence: [{ type: "test", severity: "low", weight: 1, evidence: "test", source: "s" }],
      baseRiskScore: 10,
      urls: [],
      inputType: "message",
    });
    expect(result.scoreAdjustment).toBe(0);
    expect(attempts).toBe(1);
  });
});
