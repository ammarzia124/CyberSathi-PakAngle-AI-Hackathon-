import {
  InvestigationTimeline,
  createTimeline,
  sanitizeMetadata,
  getStage,
} from "../../src/utils/investigationTimeline.js";

describe("InvestigationTimeline", () => {
  describe("constructor", () => {
    it("creates empty timeline", () => {
      const timeline = new InvestigationTimeline();
      expect(timeline.events).toEqual([]);
      expect(timeline.startedAt).toBeNull();
      expect(timeline.completedAt).toBeNull();
    });
  });

  describe("start", () => {
    it("sets startedAt to ISO timestamp", () => {
      const timeline = new InvestigationTimeline();
      timeline.start();
      expect(timeline.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("returns this for chaining", () => {
      const timeline = new InvestigationTimeline();
      expect(timeline.start()).toBe(timeline);
    });
  });

  describe("addStep", () => {
    it("creates event with correct shape", () => {
      const timeline = new InvestigationTimeline();
      timeline.start();
      timeline.addStep(1, "completed", { inputType: "url" });

      expect(timeline.events).toHaveLength(1);
      const event = timeline.events[0];
      expect(event.step).toBe(1);
      expect(event.name).toBe("Input received + type identified");
      expect(event.status).toBe("completed");
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(event.metadata).toEqual({ inputType: "url" });
    });

    it("defaults status to in_progress", () => {
      const timeline = new InvestigationTimeline();
      timeline.addStep(1);
      expect(timeline.events[0].status).toBe("in_progress");
    });

    it("throws on invalid step number", () => {
      const timeline = new InvestigationTimeline();
      expect(() => timeline.addStep(99)).toThrow("Invalid step number: 99");
      expect(() => timeline.addStep(0)).toThrow("Invalid step number: 0");
      expect(() => timeline.addStep(-1)).toThrow("Invalid step number: -1");
    });

    it("updates existing step instead of duplicating", () => {
      const timeline = new InvestigationTimeline();
      timeline.addStep(1, "in_progress");
      timeline.addStep(1, "completed", { extra: true });

      expect(timeline.events).toHaveLength(1);
      expect(timeline.events[0].status).toBe("completed");
      expect(timeline.events[0].metadata.extra).toBe(true);
    });

    it("returns this for chaining", () => {
      const timeline = new InvestigationTimeline();
      expect(timeline.addStep(1)).toBe(timeline);
    });
  });

  describe("completeStep", () => {
    it("updates existing step status to completed", () => {
      const timeline = new InvestigationTimeline();
      timeline.addStep(1, "in_progress");
      timeline.completeStep(1, { domains: ["example.com"] });

      expect(timeline.events[0].status).toBe("completed");
      expect(timeline.events[0].metadata.domains).toEqual(["example.com"]);
    });

    it("creates new completed step if not found", () => {
      const timeline = new InvestigationTimeline();
      timeline.completeStep(5, { count: 3 });

      expect(timeline.events).toHaveLength(1);
      expect(timeline.events[0].step).toBe(5);
      expect(timeline.events[0].status).toBe("completed");
    });

    it("returns this for chaining", () => {
      const timeline = new InvestigationTimeline();
      expect(timeline.completeStep(1)).toBe(timeline);
    });
  });

  describe("failStep", () => {
    it("sets failed status and reason in metadata", () => {
      const timeline = new InvestigationTimeline();
      timeline.addStep(3, "in_progress");
      timeline.failStep(3, "Module timeout");

      expect(timeline.events[0].status).toBe("failed");
      expect(timeline.events[0].metadata.reason).toBe("Module timeout");
    });

    it("creates new failed step if not found", () => {
      const timeline = new InvestigationTimeline();
      timeline.failStep(7, "Unexpected error");

      expect(timeline.events).toHaveLength(1);
      expect(timeline.events[0].step).toBe(7);
      expect(timeline.events[0].status).toBe("failed");
      expect(timeline.events[0].metadata.reason).toBe("Unexpected error");
    });

    it("defaults reason to Unknown error", () => {
      const timeline = new InvestigationTimeline();
      timeline.failStep(4);
      expect(timeline.events[0].metadata.reason).toBe("Unknown error");
    });

    it("returns this for chaining", () => {
      const timeline = new InvestigationTimeline();
      expect(timeline.failStep(1, "err")).toBe(timeline);
    });
  });

  describe("toJSON", () => {
    it("returns flat array with correct event shape", () => {
      const timeline = new InvestigationTimeline();
      timeline.start();
      timeline.addStep(1, "completed");
      timeline.addStep(2, "completed");
      const json = timeline.toJSON();

      expect(Array.isArray(json)).toBe(true);
      expect(json).toHaveLength(2);
      expect(json[0]).toHaveProperty("id");
      expect(json[0]).toHaveProperty("name");
      expect(json[0]).toHaveProperty("timestamp");
      expect(json[0]).toHaveProperty("status");
      expect(json[0]).toHaveProperty("metadata");
      expect(json[0].id).toBe("step-1");
      expect(json[0].name).toBe("Input received + type identified");
      expect(json[0].status).toBe("completed");
    });

    it("returns copies of events not references", () => {
      const timeline = new InvestigationTimeline();
      timeline.addStep(1, "completed");
      const json = timeline.toJSON();
      json[0].name = "Modified";
      expect(timeline.events[0].name).toBe("Input received + type identified");
    });
  });

  describe("sanitizeMetadata", () => {
    it("removes sensitive keys", () => {
      const dirty = {
        inputType: "url",
        raw: "secret data",
        apiKey: "sk-123",
        password: "pass",
        token: "abc",
        internal: true,
        stack: "Error at ...",
        rawResponse: "llm output",
        providerMetadata: { model: "gpt-4" },
        latency: 150,
      };
      const clean = sanitizeMetadata(dirty);
      expect(clean).toEqual({ inputType: "url" });
    });

    it("preserves non-sensitive keys", () => {
      const meta = { domains: ["example.com"], count: 3, reason: "timeout" };
      expect(sanitizeMetadata(meta)).toEqual(meta);
    });

    it("returns empty object for null/undefined", () => {
      expect(sanitizeMetadata(null)).toEqual({});
      expect(sanitizeMetadata(undefined)).toEqual({});
    });

    it("returns empty object for non-object input", () => {
      expect(sanitizeMetadata("string")).toEqual({});
      expect(sanitizeMetadata(42)).toEqual({});
    });
  });

  describe("getStage", () => {
    it("returns correct stage for each step number", () => {
      expect(getStage(1)).toEqual({ step: 1, name: "Input received + type identified" });
      expect(getStage(2)).toEqual({ step: 2, name: "URLs/domains extracted" });
      expect(getStage(3)).toEqual({ step: 3, name: "Domain analysis" });
      expect(getStage(4)).toEqual({ step: 4, name: "Language/social-engineering analysis" });
      expect(getStage(5)).toEqual({ step: 5, name: "Security indicators checked" });
      expect(getStage(6)).toEqual({ step: 6, name: "Risk calculated" });
      expect(getStage(7)).toEqual({ step: 7, name: "Threat classification" });
      expect(getStage(8)).toEqual({ step: 8, name: "Final report generated" });
    });

    it("returns null for invalid step", () => {
      expect(getStage(99)).toBeNull();
      expect(getStage(0)).toBeNull();
    });
  });

  describe("createTimeline", () => {
    it("returns new InvestigationTimeline instance", () => {
      const timeline = createTimeline();
      expect(timeline).toBeInstanceOf(InvestigationTimeline);
    });
  });

  describe("full pipeline", () => {
    it("supports complete 8-step investigation", () => {
      const timeline = createTimeline();
      timeline.start();
      timeline.addStep(1, "completed", { inputType: "url" });
      timeline.addStep(2, "completed", { urls: ["https://example.com"] });
      timeline.addStep(3, "completed", { domains: ["example.com"] });
      timeline.addStep(4, "completed", { skipped: true });
      timeline.addStep(5, "completed", { indicatorCount: 3 });
      timeline.addStep(6, "completed", { riskScore: 65, threatLevel: "High" });
      timeline.addStep(7, "completed", { threatLevel: "High", threatType: "Phishing" });
      timeline.addStep(8, "completed", {});

      const json = timeline.toJSON();
      expect(json).toHaveLength(8);
      expect(json.map((e) => e.id)).toEqual([
        "step-1", "step-2", "step-3", "step-4",
        "step-5", "step-6", "step-7", "step-8",
      ]);
      expect(json.every((e) => e.status === "completed")).toBe(true);
    });

    it("handles mixed completed and failed steps", () => {
      const timeline = createTimeline();
      timeline.start();
      timeline.addStep(1, "completed");
      timeline.addStep(2, "completed");
      timeline.addStep(3, "in_progress");
      timeline.failStep(3, "Timeout");
      timeline.addStep(4, "completed");
      timeline.addStep(5, "completed");
      timeline.addStep(6, "completed");
      timeline.addStep(7, "completed");
      timeline.addStep(8, "completed");

      const json = timeline.toJSON();
      expect(json).toHaveLength(8);
      const step3 = json.find((e) => e.id === "step-3");
      expect(step3.status).toBe("failed");
      expect(step3.metadata.reason).toBe("Timeout");
    });

    it("chains all methods fluently", () => {
      const result = createTimeline()
        .start()
        .addStep(1, "completed")
        .addStep(2, "completed")
        .completeStep(3, {})
        .addStep(4, "completed")
        .addStep(5, "completed")
        .completeStep(6, {})
        .completeStep(7, {})
        .completeStep(8, {})
        .toJSON();

      expect(result).toHaveLength(8);
    });
  });
});
