import { AI_AGENT_CONFIG } from "./config.js";

export function validateAiResponse(parsed) {
  const errors = [];

  if (!parsed || typeof parsed !== "object") {
    return { valid: false, normalized: null, errors: ["Response is not an object"] };
  }

  if (typeof parsed.explanation !== "string" || parsed.explanation.trim().length === 0) {
    errors.push("explanation is missing or not a non-empty string");
  }

  if (!Array.isArray(parsed.recommendedActions)) {
    errors.push("recommendedActions is not an array");
  }

  if (parsed.scoreAdjustment === undefined || parsed.scoreAdjustment === null) {
    errors.push("scoreAdjustment is missing");
  } else if (!Number.isInteger(parsed.scoreAdjustment)) {
    errors.push("scoreAdjustment is not an integer");
  }

  if (errors.length > 0) {
    return { valid: false, normalized: null, errors };
  }

  const clampedAdjustment = Math.max(
    AI_AGENT_CONFIG.adjustmentMin,
    Math.min(AI_AGENT_CONFIG.adjustmentMax, parsed.scoreAdjustment)
  );

  const normalized = {
    explanation: parsed.explanation,
    threatType: typeof parsed.threatType === "string" ? parsed.threatType : "Unknown",
    recommendedActions: parsed.recommendedActions,
    scoreAdjustment: clampedAdjustment,
  };

  return { valid: true, normalized, errors: [] };
}

export function normalizeAdjustment(adjustment) {
  const value = typeof adjustment === "number" ? adjustment : 0;
  return Math.max(
    AI_AGENT_CONFIG.adjustmentMin,
    Math.min(AI_AGENT_CONFIG.adjustmentMax, value)
  );
}
