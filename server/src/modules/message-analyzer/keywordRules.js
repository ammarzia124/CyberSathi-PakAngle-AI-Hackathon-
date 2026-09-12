import { MESSAGE_ANALYZER_CONSTANTS } from "./constants.js";

export function checkKeywords(text) {
  const indicators = [];
  const signals = [];
  let riskScore = 0;

  const lowerText = text.toLowerCase();

  for (const keyword of MESSAGE_ANALYZER_CONSTANTS.ENGLISH_SCAM_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      indicators.push({
        type: "scam-keyword",
        severity: "high",
        description: `Contains English scam keyword: "${keyword}"`,
        evidence: keyword,
      });
      signals.push("scam-keyword");
      riskScore = Math.max(riskScore, 40);
    }
  }

  for (const keyword of MESSAGE_ANALYZER_CONSTANTS.URDU_SCAM_KEYWORDS) {
    if (text.includes(keyword)) {
      indicators.push({
        type: "urdu-scam-keyword",
        severity: "high",
        description: `Contains Urdu scam keyword: "${keyword}"`,
        evidence: keyword,
      });
      signals.push("urdu-scam");
      riskScore = Math.max(riskScore, 45);
    }
  }

  for (const keyword of MESSAGE_ANALYZER_CONSTANTS.FINANCIAL_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      indicators.push({
        type: "financial-keyword",
        severity: "high",
        description: `Contains financial phishing term: "${keyword}"`,
        evidence: keyword,
      });
      signals.push("financial");
      riskScore = Math.max(riskScore, 40);
    }
  }

  if (lowerText.includes("password") || lowerText.includes("passwd")) {
    indicators.push({
      type: "credential-request",
      severity: "critical",
      description: "Message requests password/credentials",
      evidence: lowerText.includes("password") ? "password" : "passwd",
    });
    signals.push("credential-request");
    riskScore = Math.max(riskScore, 75);
  }

  if (/\b(click here|claim now|act now|verify now)\b/i.test(text)) {
    indicators.push({
      type: "call-to-action",
      severity: "medium",
      description: "Message contains aggressive call-to-action",
      evidence: text.match(/\b(click here|claim now|act now|verify now)\b/i)?.[0],
    });
    signals.push("call-to-action");
    riskScore = Math.max(riskScore, 30);
  }

  return { indicators, signals, riskScore };
}
