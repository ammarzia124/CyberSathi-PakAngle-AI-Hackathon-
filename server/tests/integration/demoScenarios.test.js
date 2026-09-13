import { jest } from "@jest/globals";

process.env.SUPABASE_URL = "https://smnygafwwkiscugayuff.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
process.env.OPENAI_API_KEY = "";

jest.setTimeout(30000);

const { default: request } = await import("supertest");
const { default: app } = await import("../../src/app.js");

function validateReportShape(report) {
  expect(report).toHaveProperty("reportId");
  expect(report).toHaveProperty("inputType");
  expect(report).toHaveProperty("riskScore");
  expect(report).toHaveProperty("threatLevel");
  expect(report).toHaveProperty("threatType");
  expect(report).toHaveProperty("indicators");
  expect(report).toHaveProperty("explanation");
  expect(report).toHaveProperty("recommendedActions");
  expect(report).toHaveProperty("urls");
  expect(report).toHaveProperty("investigationTimeline");
  expect(report).toHaveProperty("urduExplanation");
  expect(report).toHaveProperty("createdAt");
  expect(report.riskScore).toBeGreaterThanOrEqual(0);
  expect(report.riskScore).toBeLessThanOrEqual(100);
}

describe("Demo Scenario Validation", () => {
  it("D1: Fake HEC laptop scheme — advance-fee scam", async () => {
    const res = await request(app)
      .post("/api/analyze/message")
      .send({
        text: "HEC has announced free laptops for all university students. Click here to claim your Rs. 50000 laptop. Send your CNIC number and bank details to register.",
      });

    expect(res.status).toBe(201);
    validateReportShape(res.body);
    expect(["Suspicious", "High", "Critical"]).toContain(res.body.threatLevel);
    expect(res.body.riskScore).toBeGreaterThanOrEqual(30);
    expect(res.body.explanation.length).toBeGreaterThan(0);
    expect(res.body.recommendedActions.length).toBeGreaterThan(0);
  });

  it("D2: Fake multinational job offer — impersonation scam", async () => {
    const res = await request(app)
      .post("/api/analyze/message")
      .send({
        text: "Congratulations! You have been selected for a Senior Engineer position at Google Pakistan. Send your CNIC and bank account details for salary setup. Verify your identity within 24 hours.",
      });

    expect(res.status).toBe(201);
    validateReportShape(res.body);
    expect(["Suspicious", "High", "Critical"]).toContain(res.body.threatLevel);
    expect(res.body.riskScore).toBeGreaterThanOrEqual(30);
  });

  it("D3: Fake Easypaisa prize — OTP/credential harvesting", async () => {
    const res = await request(app)
      .post("/api/analyze/message")
      .send({
        text: "Easypaisa: You have won Rs. 100000! Share your OTP code sent to your phone to claim your prize immediately. Click here to verify.",
      });

    expect(res.status).toBe(201);
    validateReportShape(res.body);
    expect(["Suspicious", "High", "Critical"]).toContain(res.body.threatLevel);
    expect(res.body.riskScore).toBeGreaterThanOrEqual(30);
  });

  it("D4: Fake scholarship — phishing with suspicious domain", async () => {
    const res = await request(app)
      .post("/api/analyze/combined")
      .send({
        text: "HEC Scholarship 2025 is now open. Verify your bank account at the link below to receive Rs. 200000. Last chance to apply!",
        urls: ["https://scholarship-hec.xyz/verify"],
      });

    expect(res.status).toBe(201);
    validateReportShape(res.body);
    expect(["Suspicious", "High", "Critical"]).toContain(res.body.threatLevel);
    expect(res.body.riskScore).toBeGreaterThanOrEqual(30);
    expect(res.body.urls.some(u => u.includes("scholarship-hec.xyz"))).toBe(true);
  });

  it("D5: Fake courier payment — financial scam", async () => {
    const res = await request(app)
      .post("/api/analyze/message")
      .send({
        text: "TCS Courier: Your package is ready for delivery. Pay Rs. 2000 delivery fee via Easypaisa to receive your package. Click here to pay now.",
      });

    expect(res.status).toBe(201);
    validateReportShape(res.body);
    expect(["Suspicious", "High", "Critical"]).toContain(res.body.threatLevel);
    expect(res.body.riskScore).toBeGreaterThanOrEqual(30);
  });

  it("D6: Social media verification — urgency/fear tactic", async () => {
    const res = await request(app)
      .post("/api/analyze/message")
      .send({
        text: "Instagram: Your account has been flagged for suspicious activity. Verify your identity within 24 hours or your account will be permanently deleted. Click here now!",
      });

    expect(res.status).toBe(201);
    validateReportShape(res.body);
    expect(["Suspicious", "High", "Critical"]).toContain(res.body.threatLevel);
    expect(res.body.riskScore).toBeGreaterThanOrEqual(30);
  });

  it("D7: Genuine government URL — should be Low risk", async () => {
    const res = await request(app)
      .post("/api/analyze/url")
      .send({ url: "https://www.gov.pk" });

    expect(res.status).toBe(201);
    validateReportShape(res.body);
    expect(res.body.threatLevel).toBe("Low");
    expect(res.body.riskScore).toBeLessThan(30);
  });

  it("D8: Fake bank verification — combined phishing", async () => {
    const res = await request(app)
      .post("/api/analyze/combined")
      .send({
        text: "HBL Bank: Your account has been compromised. Verify your identity immediately at the link below or your account will be suspended.",
        urls: ["https://hbl-secure.xyz/verify"],
      });

    expect(res.status).toBe(201);
    validateReportShape(res.body);
    expect(["Suspicious", "High", "Critical"]).toContain(res.body.threatLevel);
    expect(res.body.riskScore).toBeGreaterThanOrEqual(30);
    expect(res.body.urls.some(u => u.includes("hbl-secure.xyz"))).toBe(true);
  });

  describe("Report persistence verification", () => {
    it.skip("report is retrievable after creation (requires MongoDB)", async () => {
      const createRes = await request(app)
        .post("/api/analyze/url")
        .send({ url: "https://test-persistence.example.com" });

      expect(createRes.status).toBe(201);
      const reportId = createRes.body.reportId;

      const getRes = await request(app).get(`/api/report/${createRes.body.reportId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.reportId).toBe(reportId);
    });

    it.skip("report appears in scans list (requires MongoDB)", async () => {
      await request(app)
        .post("/api/analyze/url")
        .send({ url: "https://test-scans.example.com" });

      const scansRes = await request(app).get("/api/scans");
      expect(scansRes.status).toBe(200);
      expect(Array.isArray(scansRes.body.scans)).toBe(true);
    });
  });
});
