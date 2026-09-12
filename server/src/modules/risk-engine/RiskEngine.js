import { computeWeights } from "./scoringRules.js";
import { classifyThreat } from "./threatClassifier.js";
import { RISK_ENGINE_CONSTANTS } from "./constants.js";

export class RiskEngine {
  computeScore(evidenceArray) {
    const weightedScores = computeWeights(evidenceArray);
    const totalWeight = weightedScores.reduce((sum, w) => sum + w.weight, 0);
    const weightedSum = weightedScores.reduce(
      (sum, w) => sum + w.score * w.weight,
      0
    );

    const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const riskScore = Math.min(
      RISK_ENGINE_CONSTANTS.SCORE_BOUNDS.MAX,
      Math.max(RISK_ENGINE_CONSTANTS.SCORE_BOUNDS.MIN, Math.round(rawScore))
    );

    const { threatLevel, threatType } = classifyThreat(
      riskScore,
      evidenceArray
    );

    return {
      riskScore,
      threatLevel,
      threatType,
      scoringBreakdown: weightedScores,
    };
  }

  applyAiAdjustment(baseScore, adjustment) {
    const value = typeof adjustment === "number" ? adjustment : 0;
    const clamped = Math.max(
      RISK_ENGINE_CONSTANTS.AI_ADJUSTMENT.MIN,
      Math.min(RISK_ENGINE_CONSTANTS.AI_ADJUSTMENT.MAX, value)
    );
    const finalScore = Math.max(
      RISK_ENGINE_CONSTANTS.SCORE_BOUNDS.MIN,
      Math.min(RISK_ENGINE_CONSTANTS.SCORE_BOUNDS.MAX, baseScore + clamped)
    );

    return {
      finalScore,
      adjustment: clamped,
      baseScore,
      clamped: clamped !== value,
    };
  }
}
