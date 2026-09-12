import { RISK_ENGINE_CONSTANTS } from "./constants.js";

export function classifyThreat(riskScore, evidenceArray) {
  const threatLevel = getThreatLevel(riskScore);
  const threatType = deriveThreatType(evidenceArray);
  return { threatLevel, threatType };
}

function getThreatLevel(score) {
  if (score <= RISK_ENGINE_CONSTANTS.LEVELS.LOW.max) return "Low";
  if (score <= RISK_ENGINE_CONSTANTS.LEVELS.SUSPICIOUS.max) return "Suspicious";
  if (score <= RISK_ENGINE_CONSTANTS.LEVELS.HIGH.max) return "High";
  return "Critical";
}

function deriveThreatType(evidenceArray) {
  if (!Array.isArray(evidenceArray) || evidenceArray.length === 0) {
    return "Unknown";
  }

  const indicatorTexts = evidenceArray
    .map((e) => `${e.type || ""} ${e.evidence || ""}`.toLowerCase())
    .join(" ");

  let bestMatch = "Unknown";
  let bestScore = 0;

  for (const [threatType, keywords] of Object.entries(RISK_ENGINE_CONSTANTS.THREAT_TYPE_KEYWORDS)) {
    let matchCount = 0;
    for (const keyword of keywords) {
      if (indicatorTexts.includes(keyword)) {
        matchCount++;
      }
    }
    if (matchCount > bestScore) {
      bestScore = matchCount;
      bestMatch = threatType;
    }
  }

  return bestMatch;
}
