import { jest } from "@jest/globals";

process.env.SUPABASE_URL = "https://smnygafwwkiscugayuff.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
process.env.OPENAI_API_KEY = "";

jest.setTimeout(30000);

const { default: request } = await import("supertest");
const { default: app } = await import("../../src/app.js");

const REQUIRED_REPORT_FIELDS = [
  "reportId", "inputType", "riskScore", "threatLevel", "threatType",
  "indicators", "explanation", "recommendedActions", "urls",
  "investigationTimeline", "urduExplanation", "createdAt",
];

function validateReportShape(report) {
  for (const field of REQUIRED_REPORT_FIELDS) {
    expect(report).toHaveProperty(field);
  }
  expect(typeof report.reportId).toBe("string");
  expect(report.reportId.length).toBeGreaterThan(0);
  expect(typeof report.riskScore).toBe("number");
  expect(report.riskScore).toBeGreaterThanOrEqual(0);
  expect(report.riskScore).toBeLessThanOrEqual(100);
  expect(["Low", "Suspicious", "High", "Critical"]).toContain(report.threatLevel);
  expect(typeof report.explanation).toBe("string");
  expect(Array.isArray(report.indicators)).toBe(true);
  expect(Array.isArray(report.recommendedActions)).toBe(true);
  expect(Array.isArray(report.urls)).toBe(true);
  expect(report.urduExplanation).toBeNull();
  expect(typeof report.createdAt).toBe("string");
}

describe("API Integration Tests", () => {
  describe("POST /api/analyze/url", () => {
    it("analyzes a normal URL and returns Low threat", async () => {
      const res = await request(app)
        .post("/api/analyze/url")
        .send({ url: "https://www.google.com" });

      expect(res.status).toBe(201);
      validateReportShape(res.body);
      expect(res.body.inputType).toBe("url");
      expect(res.body.threatLevel).toBe("Low");
      expect(res.body.urls.some(u => u.includes("google.com"))).toBe(true);
    });

    it("analyzes a suspicious URL and detects threat", async () => {
      const res = await request(app)
        .post("/api/analyze/url")
        .send({ url: "http://192.168.1.1/login" });

      expect(res.status).toBe(201);
      validateReportShape(res.body);
      expect(res.body.threatLevel).not.toBe("Low");
      expect(res.body.indicators.length).toBeGreaterThan(0);
    });

    it("analyzes an impersonation domain", async () => {
      const res = await request(app)
        .post("/api/analyze/url")
        .send({ url: "https://paypa1-secure.xyz/verify" });

      expect(res.status).toBe(201);
      validateReportShape(res.body);
      expect(["High", "Critical"]).toContain(res.body.threatLevel);
      expect(res.body.indicators.some(i => i.type === "suspicious-tld")).toBe(true);
    });

    it("detects multiple suspicious indicators", async () => {
      const res = await request(app)
        .post("/api/analyze/url")
        .send({ url: "https://bit.ly/3xYzAbC" });

      expect(res.status).toBe(201);
      validateReportShape(res.body);
      expect(res.body.indicators.some(i => i.type === "url-shortener")).toBe(true);
    });

    it("rejects invalid URL", async () => {
      const res = await request(app)
        .post("/api/analyze/url")
        .send({ url: "not-a-valid-url" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("rejects missing url field", async () => {
      const res = await request(app)
        .post("/api/analyze/url")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/analyze/message", () => {
    it("analyzes a normal message and returns Low threat", async () => {
      const res = await request(app)
        .post("/api/analyze/message")
        .send({ text: "Meeting rescheduled to 3pm tomorrow." });

      expect(res.status).toBe(201);
      validateReportShape(res.body);
      expect(res.body.inputType).toBe("message");
      expect(res.body.threatLevel).toBe("Low");
    });

    it("detects urgency language", async () => {
      const res = await request(app)
        .post("/api/analyze/message")
        .send({ text: "Your account will be suspended within 24 hours. Verify immediately." });

      expect(res.status).toBe(201);
      validateReportShape(res.body);
      expect(res.body.threatLevel).not.toBe("Low");
    });

    it("detects credential request", async () => {
      const res = await request(app)
        .post("/api/analyze/message")
        .send({ text: "Verify your bank account password immediately at our secure portal." });

      expect(res.status).toBe(201);
      validateReportShape(res.body);
      expect(["High", "Critical"]).toContain(res.body.threatLevel);
    });

    it("detects payment request", async () => {
      const res = await request(app)
        .post("/api/analyze/message")
        .send({ text: "Send Rs. 5000 to claim your prize. Click here to pay now." });

      expect(res.status).toBe(201);
      validateReportShape(res.body);
      expect(res.body.threatLevel).not.toBe("Low");
    });

    it("detects OTP request", async () => {
      const res = await request(app)
        .post("/api/analyze/message")
        .send({ text: "Share your OTP code with us to verify your account." });

      expect(res.status).toBe(201);
      validateReportShape(res.body);
      expect(["High", "Critical"]).toContain(res.body.threatLevel);
    });

    it("detects authority impersonation", async () => {
      const res = await request(app)
        .post("/api/analyze/message")
        .send({ text: "FIA has blocked your CNIC. Verify your bank account now." });

      expect(res.status).toBe(201);
      validateReportShape(res.body);
      expect(res.body.threatLevel).not.toBe("Low");
    });

    it("extracts URLs from message text", async () => {
      const res = await request(app)
        .post("/api/analyze/message")
        .send({ text: "Visit https://evil.xyz to claim Rs. 500000 prize money." });

      expect(res.status).toBe(201);
      validateReportShape(res.body);
      expect(res.body.urls.length).toBeGreaterThan(0);
      expect(res.body.urls).toContain("https://evil.xyz");
    });

    it("rejects empty text", async () => {
      const res = await request(app)
        .post("/api/analyze/message")
        .send({ text: "" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("rejects missing text field", async () => {
      const res = await request(app)
        .post("/api/analyze/message")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/analyze/combined", () => {
    it("analyzes text + one URL", async () => {
      const res = await request(app)
        .post("/api/analyze/combined")
        .send({ text: "Check this link for your prize", urls: ["https://prize-scam.xyz/claim"] });

      expect(res.status).toBe(201);
      validateReportShape(res.body);
      expect(res.body.inputType).toBe("combined");
    });

    it("analyzes text + multiple URLs", async () => {
      const res = await request(app)
        .post("/api/analyze/combined")
        .send({
          text: "Check these links",
          urls: ["https://evil1.xyz", "https://evil2.xyz"],
        });

      expect(res.status).toBe(201);
      validateReportShape(res.body);
      expect(res.body.urls.length).toBeGreaterThanOrEqual(2);
    });

    it("deduplicates URLs from text and explicit list", async () => {
      const res = await request(app)
        .post("/api/analyze/combined")
        .send({
          text: "Visit https://evil.com for details",
          urls: ["https://evil.com"],
        });

      expect(res.status).toBe(201);
      const evilCount = res.body.urls.filter(u => u.includes("evil.com")).length;
      expect(evilCount).toBe(1);
    });

    it("extracts URL from text when explicit list is empty", async () => {
      const res = await request(app)
        .post("/api/analyze/combined")
        .send({ text: "Go to https://phish.xyz to verify account", urls: [] });

      expect(res.status).toBe(201);
      expect(res.body.urls.some(u => u.includes("phish.xyz"))).toBe(true);
    });

    it("rejects missing text", async () => {
      const res = await request(app)
        .post("/api/analyze/combined")
        .send({ urls: ["https://example.com"] });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/analyze/screenshot", () => {
    it("rejects request without file", async () => {
      const res = await request(app)
        .post("/api/analyze/screenshot");

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/screenshot/i);
    });

    it("rejects non-image file", async () => {
      const res = await request(app)
        .post("/api/analyze/screenshot")
        .attach("screenshot", Buffer.from("not an image"), { filename: "test.exe", contentType: "application/exe" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/scans", () => {
    it("returns paginated scans list", async () => {
      const res = await request(app).get("/api/scans");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("scans");
      expect(res.body).toHaveProperty("pagination");
      expect(Array.isArray(res.body.scans)).toBe(true);
      expect(res.body.pagination).toHaveProperty("page");
      expect(res.body.pagination).toHaveProperty("limit");
      expect(res.body.pagination).toHaveProperty("total");
      expect(res.body.pagination).toHaveProperty("pages");
    });
  });

  describe("GET /api/report/:id", () => {
    it("returns error for non-existent report (404 or 503 if DB unavailable)", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app).get(`/api/report/${fakeId}`);

      expect([404, 503]).toContain(res.status);
      expect(res.body).toHaveProperty("error");
    });

    it("returns error for non-existent or invalid report ID", async () => {
      const res = await request(app).get("/api/report/invalid-id");

      expect([404, 503]).toContain(res.status);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /api/health", () => {
    it("returns health status", async () => {
      const res = await request(app).get("/api/health");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("status");
      expect(res.body.status).toBe("ok");
    });
  });

  describe("404 handling", () => {
    it("returns 404 for unknown routes", async () => {
      const res = await request(app).get("/api/unknown");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Not found");
      expect(res.body.statusCode).toBe(404);
    });
  });

  describe("Error handling", () => {
    it("handles malformed JSON body", async () => {
      const res = await request(app)
        .post("/api/analyze/url")
        .set("Content-Type", "application/json")
        .send("{ invalid json }");

      expect(res.status).toBe(400);
    });
  });
});
