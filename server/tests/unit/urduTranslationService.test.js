import { UrduTranslationService } from "../../src/services/UrduTranslationService.js";

beforeAll(() => {
  process.env.SUPABASE_URL = "https://smnygafwwkiscugayuff.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
});

function createMockFetch(responseBody, options = {}) {
  const { status = 200, ok = true, abortAfterMs = null } = options;
  return async (url, opts) => {
    if (abortAfterMs) {
      const signal = opts.signal;
      if (signal) {
        await new Promise((resolve) => setTimeout(resolve, abortAfterMs));
        if (signal.aborted) {
          const err = new Error("aborted");
          err.name = "AbortError";
          throw err;
        }
      }
    }
    return {
      ok,
      status,
      json: async () => responseBody,
    };
  };
}

function successfulUrduResponse() {
  return {
    choices: [
      {
        message: {
          content: JSON.stringify({
            explanation: "یہ URL فishing کی کوشش لگتا ہے۔",
            recommendedActions: ["اس URL پر نہ جائیں۔", "حکومتی اداروں کو رپورٹ کریں۔"],
          }),
        },
      },
    ],
  };
}

describe("UrduTranslationService", () => {
  describe("translate", () => {
    it("translates explanation and recommendedActions successfully", async () => {
      const service = new UrduTranslationService({
        fetchFn: createMockFetch(successfulUrduResponse()),
      });
      process.env.OPENAI_API_KEY = "test-key";

      const result = await service.translate(
        "This URL appears to be a phishing attempt.",
        ["Do not visit this URL", "Report to authorities"]
      );

      expect(result).not.toBeNull();
      expect(result.explanation).toBe("یہ URL فishing کی کوشش لگتا ہے۔");
      expect(result.recommendedActions).toHaveLength(2);
      expect(result.recommendedActions[0]).toBe("اس URL پر نہ جائیں۔");
    });

    it("returns null when no OPENAI_API_KEY", async () => {
      delete process.env.OPENAI_API_KEY;
      const service = new UrduTranslationService({
        fetchFn: createMockFetch(successfulUrduResponse()),
      });

      const result = await service.translate("Test explanation", []);
      expect(result).toBeNull();
    });

    it("returns null on API error (non-ok response)", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      const service = new UrduTranslationService({
        fetchFn: createMockFetch({}, { status: 500, ok: false }),
      });

      const result = await service.translate("Test explanation", []);
      expect(result).toBeNull();
    });

    it("returns null on timeout (AbortError)", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      const service = new UrduTranslationService({
        fetchFn: createMockFetch(null, { abortAfterMs: 1 }),
      });

      const result = await service.translate("Test explanation", []);
      expect(result).toBeNull();
    }, 20000);

    it("returns null on malformed JSON response", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      const service = new UrduTranslationService({
        fetchFn: async () => ({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: "not valid json {{{" } }],
          }),
        }),
      });

      const result = await service.translate("Test explanation", []);
      expect(result).toBeNull();
    });

    it("returns null on empty API response content", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      const service = new UrduTranslationService({
        fetchFn: async () => ({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: "" } }],
          }),
        }),
      });

      const result = await service.translate("Test explanation", []);
      expect(result).toBeNull();
    });

    it("returns null on invalid response structure (missing explanation)", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      const service = new UrduTranslationService({
        fetchFn: async () => ({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: JSON.stringify({ recommendedActions: [] }) } }],
          }),
        }),
      });

      const result = await service.translate("Test explanation", []);
      expect(result).toBeNull();
    });

    it("returns null on invalid response structure (non-array recommendedActions)", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      const service = new UrduTranslationService({
        fetchFn: async () => ({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: JSON.stringify({ explanation: "test", recommendedActions: "not-array" }) } }],
          }),
        }),
      });

      const result = await service.translate("Test explanation", []);
      expect(result).toBeNull();
    });

    it("returns null on null/undefined explanation input", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      const service = new UrduTranslationService({
        fetchFn: createMockFetch(successfulUrduResponse()),
      });

      expect(await service.translate(null, [])).toBeNull();
      expect(await service.translate(undefined, [])).toBeNull();
      expect(await service.translate("", [])).toBeNull();
      expect(await service.translate(123, [])).toBeNull();
    });

    it("handles explanation containing URLs (URLs passed to API)", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      let capturedBody;
      const service = new UrduTranslationService({
        fetchFn: async (url, opts) => {
          capturedBody = JSON.parse(opts.body);
          return {
            ok: true,
            json: async () => ({
              choices: [{ message: { content: JSON.stringify({ explanation: "یہ https://evil.com خطرناک ہے۔", recommendedActions: [] }) } }],
            }),
          };
        },
      });

      await service.translate("This https://evil.com is dangerous.", []);
      expect(capturedBody.messages[1].content).toContain("https://evil.com");
    });

    it("handles explanation containing numbers (numbers passed to API)", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      let capturedBody;
      const service = new UrduTranslationService({
        fetchFn: async (url, opts) => {
          capturedBody = JSON.parse(opts.body);
          return {
            ok: true,
            json: async () => ({
              choices: [{ message: { content: JSON.stringify({ explanation: "اسکور 75/100 ہے۔", recommendedActions: [] }) } }],
            }),
          };
        },
      });

      await service.translate("Score is 75/100.", []);
      expect(capturedBody.messages[1].content).toContain("75/100");
    });

    it("handles empty recommendedActions array", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      const service = new UrduTranslationService({
        fetchFn: createMockFetch(successfulUrduResponse()),
      });

      const result = await service.translate("Test explanation", []);
      expect(result).not.toBeNull();
      expect(Array.isArray(result.recommendedActions)).toBe(true);
    });

    it("handles missing recommendedActions parameter", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      const service = new UrduTranslationService({
        fetchFn: createMockFetch(successfulUrduResponse()),
      });

      const result = await service.translate("Test explanation");
      expect(result).not.toBeNull();
    });

    it("preserves structure in translation prompt", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      let capturedBody;
      const service = new UrduTranslationService({
        fetchFn: async (url, opts) => {
          capturedBody = JSON.parse(opts.body);
          return {
            ok: true,
            json: async () => ({
              choices: [{ message: { content: JSON.stringify({ explanation: "ترجمہ", recommendedActions: ["عمل 1"] }) } }],
            }),
          };
        },
      });

      await service.translate("Explanation text", ["Action 1", "Action 2"]);
      const prompt = capturedBody.messages[1].content;
      expect(prompt).toContain("EXPLANATION");
      expect(prompt).toContain("Explanation text");
      expect(prompt).toContain("RECOMMENDED ACTIONS");
      expect(prompt).toContain("Action 1");
      expect(prompt).toContain("Action 2");
    });

    it("uses json_object response format", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      let capturedBody;
      const service = new UrduTranslationService({
        fetchFn: async (url, opts) => {
          capturedBody = JSON.parse(opts.body);
          return {
            ok: true,
            json: async () => ({
              choices: [{ message: { content: JSON.stringify({ explanation: "ترجمہ", recommendedActions: [] }) } }],
            }),
          };
        },
      });

      await service.translate("Test", []);
      expect(capturedBody.response_format).toEqual({ type: "json_object" });
    });

    it("returns null on fetch network error", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      const service = new UrduTranslationService({
        fetchFn: async () => {
          throw new Error("Network failure");
        },
      });

      const result = await service.translate("Test explanation", []);
      expect(result).toBeNull();
    });
  });
});
