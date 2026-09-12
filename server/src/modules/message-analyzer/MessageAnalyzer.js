import { matchPatterns } from "./patterns.js";
import { checkKeywords } from "./keywordRules.js";
import { MESSAGE_ANALYZER_CONSTANTS } from "./constants.js";

export class MessageAnalyzer {
  async analyze(text) {
    const patternResult = matchPatterns(text);
    const keywordResult = checkKeywords(text);

    const allIndicators = [...patternResult.indicators, ...keywordResult.indicators];
    const combinedScore = Math.min(
      100,
      Math.max(patternResult.riskScore, keywordResult.riskScore)
    );

    return {
      type: "message",
      indicators: allIndicators,
      socialEngineeringSignals: [
        ...patternResult.signals,
        ...keywordResult.signals,
      ],
      messageRiskScore: combinedScore,
      extractedUrls: patternResult.extractedUrls,
      analyzedAt: new Date().toISOString(),
    };
  }
}
