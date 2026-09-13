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

  const patterns = MESSAGE_ANALYZER_CONSTANTS.PAKISTAN_SCAM_PATTERNS;

  const hasHecKeyword = patterns.HEC_IMPERSONATION.keywords.some((k) => lowerText.includes(k));
  const hasHecScamIndicator = patterns.HEC_IMPERSONATION.scamIndicators.some((s) => lowerText.includes(s));
  if (hasHecKeyword && hasHecScamIndicator) {
    indicators.push({
      type: "impersonation-scam",
      severity: "critical",
      description: patterns.HEC_IMPERSONATION.description,
      evidence: `HEC + scam indicator`,
    });
    signals.push("impersonation:hec");
    riskScore = Math.max(riskScore, patterns.HEC_IMPERSONATION.score);
  }

  const hasPlatform = patterns.EASYPAISA_JAZZCASH_PRIZE.platforms.some((p) => lowerText.includes(p));
  const hasPrizeIndicator = patterns.EASYPAISA_JAZZCASH_PRIZE.scamIndicators.some((s) => lowerText.includes(s));
  if (hasPlatform && hasPrizeIndicator) {
    indicators.push({
      type: "financial-scam",
      severity: "critical",
      description: patterns.EASYPAISA_JAZZCASH_PRIZE.description,
      evidence: `Platform + prize/lottery indicator`,
    });
    signals.push("financial-scam:prize");
    riskScore = Math.max(riskScore, patterns.EASYPAISA_JAZZCASH_PRIZE.score);
  }

  const hasScholarshipKeyword = patterns.SCHOLARSHIP_FEE.keywords.some((k) => lowerText.includes(k));
  const hasFeeIndicator = patterns.SCHOLARSHIP_FEE.feeIndicators.some((f) => lowerText.includes(f));
  if (hasScholarshipKeyword && hasFeeIndicator) {
    indicators.push({
      type: "financial-scam",
      severity: "high",
      description: patterns.SCHOLARSHIP_FEE.description,
      evidence: `Scholarship + fee request`,
    });
    signals.push("financial-scam:scholarship");
    riskScore = Math.max(riskScore, patterns.SCHOLARSHIP_FEE.score);
  }

  const hasCourier = patterns.COURIER_PAYMENT.couriers.some((c) => lowerText.includes(c));
  const hasDeliveryScam = patterns.COURIER_PAYMENT.scamIndicators.some((s) => lowerText.includes(s));
  if (hasCourier && hasDeliveryScam) {
    indicators.push({
      type: "financial-scam",
      severity: "high",
      description: patterns.COURIER_PAYMENT.description,
      evidence: `Courier + payment/delivery scam`,
    });
    signals.push("financial-scam:courier");
    riskScore = Math.max(riskScore, patterns.COURIER_PAYMENT.score);
  }

  const hasSocialPlatform = patterns.SOCIAL_MEDIA_OTP.platforms.some((p) => lowerText.includes(p));
  const hasOtpScam = patterns.SOCIAL_MEDIA_OTP.scamIndicators.some((s) => lowerText.includes(s));
  if (hasSocialPlatform && hasOtpScam) {
    indicators.push({
      type: "credential-harvesting",
      severity: "critical",
      description: patterns.SOCIAL_MEDIA_OTP.description,
      evidence: `Social media + OTP/verification request`,
    });
    signals.push("credential-harvesting:social-media");
    riskScore = Math.max(riskScore, patterns.SOCIAL_MEDIA_OTP.score);
  }

  const hasBank = patterns.BANK_VERIFICATION.banks.some((b) => lowerText.includes(b.toLowerCase()));
  const hasBankScam = patterns.BANK_VERIFICATION.scamIndicators.some((s) => lowerText.includes(s));
  if (hasBank && hasBankScam) {
    indicators.push({
      type: "phishing",
      severity: "critical",
      description: patterns.BANK_VERIFICATION.description,
      evidence: `Bank name + security alert scam`,
    });
    signals.push("phishing:bank");
    riskScore = Math.max(riskScore, patterns.BANK_VERIFICATION.score);
  }

  const hasJobKeyword = patterns.JOB_OFFER.keywords.some((k) => lowerText.includes(k));
  const hasRemoteIndicator = patterns.JOB_OFFER.remoteIndicators.some((r) => lowerText.includes(r));
  if (hasJobKeyword && hasRemoteIndicator) {
    indicators.push({
      type: "scam",
      severity: "high",
      description: patterns.JOB_OFFER.description,
      evidence: `Job offer + remote/work-from-home`,
    });
    signals.push("scam:job-offer");
    riskScore = Math.max(riskScore, patterns.JOB_OFFER.score);
  }

  return { indicators, signals, riskScore, extractedUrls };
}
