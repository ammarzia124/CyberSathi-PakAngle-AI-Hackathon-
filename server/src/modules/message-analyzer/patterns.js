import { MESSAGE_ANALYZER_CONSTANTS } from "./constants.js";

export function matchPatterns(text) {
  const indicators = [];
  const signals = [];
  let riskScore = 0;

  const urlRegex = /https?:\/\/[^\s]+/g;
  const extractedUrls = text.match(urlRegex) || [];

  const lowerText = text.toLowerCase();

  for (const pattern of MESSAGE_ANALYZER_CONSTANTS.URGENCY_PATTERNS) {
    if (lowerText.includes(pattern.toLowerCase())) {
      indicators.push({
        type: "urgency-language",
        severity: "medium",
        description: `Contains urgency pattern: "${pattern}"`,
        evidence: pattern,
      });
      signals.push("urgency");
      riskScore = Math.max(riskScore, 30);
    }
  }

  for (const authority of MESSAGE_ANALYZER_CONSTANTS.AUTHORITY_KEYWORDS) {
    if (text.includes(authority)) {
      indicators.push({
        type: "authority-impersonation",
        severity: "high",
        description: `References authority figure/institution: "${authority}"`,
        evidence: authority,
      });
      signals.push(`authority:${authority}`);
      riskScore = Math.max(riskScore, 50);
    }
  }

  for (const keyword of MESSAGE_ANALYZER_CONSTANTS.ENGLISH_SCAM_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      indicators.push({
        type: "scam-keyword",
        severity: "high",
        description: `Contains scam keyword: "${keyword}"`,
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
        description: `Contains financial term: "${keyword}"`,
        evidence: keyword,
      });
      signals.push("financial");
      riskScore = Math.max(riskScore, 40);
    }
  }

  if (/\bCNIC\b/.test(text) && /\b\d{5}-\d{7}-\d{1}\b/.test(text)) {
    indicators.push({
      type: "cnic-exposed",
      severity: "critical",
      description: "Message contains a CNIC number",
      evidence: text.match(/\b\d{5}-\d{7}-\d{1}\b/)?.[0],
    });
    riskScore = Math.max(riskScore, 80);
  }

  if (/\b(OTP|one.time.password|verification.code)\b/i.test(text)) {
    indicators.push({
      type: "otp-request",
      severity: "critical",
      description: "Message references OTP or verification code",
      evidence: text.match(/\b(OTP|one.time.password|verification.code)\b/i)?.[0],
    });
    signals.push("otp-request");
    riskScore = Math.max(riskScore, 70);
  }

  if (/\b(Rs\.?\s*\d|PKR|rupees|payment|send.*money|transfer)\b/i.test(text)) {
    indicators.push({
      type: "financial-request",
      severity: "high",
      description: "Message requests or references financial transaction",
      evidence: text.match(/\b(Rs\.?\s*\d|PKR|rupees|payment|send.*money|transfer)\b/i)?.[0],
    });
    signals.push("financial-request");
    riskScore = Math.max(riskScore, 50);
  }

  return { indicators, signals, riskScore, extractedUrls };
}
