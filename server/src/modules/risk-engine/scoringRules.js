import { RISK_ENGINE_CONSTANTS } from "./constants.js";

function severityToScore(severity) {
  const key = (severity || "low").toLowerCase();
  return RISK_ENGINE_CONSTANTS.SEVERITY_SCORES[key] ?? RISK_ENGINE_CONSTANTS.SEVERITY_SCORES.low;
}

export function computeWeights(evidenceArray) {
  if (!Array.isArray(evidenceArray) || evidenceArray.length === 0) {
    return [];
  }

  const weights = [];

  for (const indicator of evidenceArray) {
    const severityScore = severityToScore(indicator.severity);
    const weight = typeof indicator.weight === "number" && indicator.weight > 0
      ? indicator.weight
      : 1;

    weights.push({
      source: indicator.source || indicator.type || "unknown",
      score: severityScore,
      weight,
    });
  }

  return weights;
}
