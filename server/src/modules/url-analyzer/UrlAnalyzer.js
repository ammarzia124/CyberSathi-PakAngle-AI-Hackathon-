import { normalizeUrl } from "./normalization.js";
import { applyRules } from "./rules.js";
import { URL_ANALYZER_CONSTANTS } from "./constants.js";

export class UrlAnalyzer {
  async analyze(url) {
    const normalized = normalizeUrl(url);
    const result = applyRules(normalized);

    return {
      type: "url",
      indicators: result.indicators,
      suspiciousPatterns: result.suspiciousPatterns,
      urlRiskScore: result.riskScore,
      extractedDomains: result.domains,
      analyzedAt: new Date().toISOString(),
    };
  }
}
