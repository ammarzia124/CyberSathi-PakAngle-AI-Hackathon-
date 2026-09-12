import { UrlAnalyzer } from "../modules/url-analyzer/UrlAnalyzer.js";
import { MessageAnalyzer } from "../modules/message-analyzer/MessageAnalyzer.js";
import { RiskEngine } from "../modules/risk-engine/RiskEngine.js";
import { AiAgent } from "../modules/ai-agent/AiAgent.js";
import { OCRService } from "../modules/ocr/OCRService.js";
import { extractUrls } from "../utils/urlExtractor.js";
import { InvestigationTimeline } from "../utils/investigationTimeline.js";
import {
  createEmptyEvidence,
  addIndicator,
  addSourceResult,
  assembleUnifiedEvidence,
} from "../utils/orchestratorEvidence.js";
import { TimeoutError } from "../utils/errors.js";

const DEFAULT_TIMEOUT = 10000;
const MAX_CONCURRENT_URLS = 5;

function riskScoreToSeverity(score) {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function moduleOutputToIndicators(moduleOutput) {
  const indicators = [];
  const riskScore = moduleOutput.urlRiskScore || moduleOutput.messageRiskScore || 0;
  const severity = riskScoreToSeverity(riskScore);
  const sourceType = moduleOutput.type || "unknown";

  if (moduleOutput.indicators && moduleOutput.indicators.length > 0) {
    for (const ind of moduleOutput.indicators) {
      indicators.push({
        type: ind.type || sourceType,
        severity: ind.severity || severity,
        weight: ind.weight || 1,
        evidence: ind.evidence || ind.description || JSON.stringify(ind),
        source: `${sourceType}-analyzer`,
      });
    }
  } else {
    indicators.push({
      type: sourceType,
      severity,
      weight: 1,
      evidence: `Risk score ${riskScore}/100 from ${sourceType} analysis`,
      source: `${sourceType}-analyzer`,
    });
  }

  return indicators;
}

function transformToIndicators(moduleOutputs) {
  return moduleOutputs.flatMap(moduleOutputToIndicators);
}

function withTimeout(promise, ms, serviceName) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new TimeoutError(serviceName, `${serviceName} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.href;
  } catch {
    return url;
  }
}

async function runModuleWithSettled(promise, source, input) {
  try {
    const result = await promise;
    return { status: "fulfilled", value: { source, moduleOutput: result } };
  } catch (error) {
    return { status: "rejected", reason: { source, input, error } };
  }
}

export class AnalysisOrchestrator {
  constructor(deps = {}) {
    this.urlAnalyzer = deps.urlAnalyzer || new UrlAnalyzer();
    this.messageAnalyzer = deps.messageAnalyzer || new MessageAnalyzer();
    this.riskEngine = deps.riskEngine || new RiskEngine();
    this.aiAgent = deps.aiAgent || new AiAgent();
    this.ocrService = deps.ocrService || new OCRService();
    this.timeout = deps.timeout || DEFAULT_TIMEOUT;
  }

  async analyzeUrl(url) {
    const startTime = Date.now();
    const timeline = new InvestigationTimeline();
    timeline.start();

    timeline.addStep(1, "completed", { inputType: "url", url });

    const normalized = normalizeUrl(url);
    timeline.addStep(2, "completed", { urls: [normalized], count: 1 });

    let urlResult;
    try {
      urlResult = await withTimeout(
        this.urlAnalyzer.analyze(normalized),
        this.timeout,
        "URL analyzer"
      );
    } catch (error) {
      timeline.failStep(3, error.message);
      urlResult = { type: "url", indicators: [], urlRiskScore: 0, extractedDomains: [normalized] };
    }

    const evidence = createEmptyEvidence("url");
    evidence.urls.push(normalized);

    if (urlResult.indicators) {
      for (const ind of urlResult.indicators) {
        addIndicator(evidence, ind, "url-analyzer", normalized);
      }
    }

    if (urlResult.extractedDomains) {
      evidence.domainSignals.push(...(urlResult.suspiciousPatterns || []));
    }

    addSourceResult(evidence, "url-analyzer", normalized, "success", {
      riskScore: urlResult.urlRiskScore,
      indicatorCount: urlResult.indicators?.length || 0,
    });

    timeline.completeStep(3, { domains: urlResult.extractedDomains || [normalized] });

    timeline.addStep(4, "completed", { skipped: true, reason: "No message content in URL-only analysis" });

    timeline.completeStep(5, { indicatorCount: evidence.indicators.length });

    const indicators = transformToIndicators([urlResult]);
    const deterministic = this.riskEngine.computeScore(indicators);
    timeline.completeStep(6, { riskScore: deterministic.riskScore, threatLevel: deterministic.threatLevel });

    timeline.completeStep(7, { threatLevel: deterministic.threatLevel, threatType: deterministic.threatType });

    const aiResult = await this.aiAgent.interpret({
      evidence: indicators,
      baseRiskScore: deterministic.riskScore,
      urls: [normalized],
      inputType: "url",
    });
    const final = this.riskEngine.applyAiAdjustment(deterministic.riskScore, aiResult.scoreAdjustment);

    timeline.completeStep(8, {});

    evidence.metadata.analysisDuration = Date.now() - startTime;

    return {
      evidence,
      indicators: evidence.indicators,
      deterministic,
      aiResult: { ...aiResult, adjustedScore: final.finalScore },
      finalScore: final.finalScore,
      timeline: timeline.toJSON(),
      urls: [normalized],
    };
  }

  async analyzeMessage(text) {
    const startTime = Date.now();
    const timeline = new InvestigationTimeline();
    timeline.start();

    timeline.addStep(1, "completed", { inputType: "message" });

    const urls = extractUrls(text);
    timeline.addStep(2, "completed", { urls, count: urls.length });

    const settledResults = [];

    const messagePromise = withTimeout(
      this.messageAnalyzer.analyze(text),
      this.timeout,
      "Message analyzer"
    );
    settledResults.push(await runModuleWithSettled(messagePromise, "message-analyzer", text));

    if (urls.length > 0) {
      const urlPromises = this._createUrlAnalysisPromises(urls);
      const urlSettled = await Promise.allSettled(urlPromises);
      for (const s of urlSettled) settledResults.push(s.value);
    }

    const evidence = assembleUnifiedEvidence("message", settledResults);

    const moduleOutputs = settledResults
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value.moduleOutput);

    const domains = moduleOutputs
      .filter((o) => o.extractedDomains)
      .flatMap((o) => o.extractedDomains);
    timeline.completeStep(3, { domains });

    const signals = moduleOutputs
      .filter((o) => o.socialEngineeringSignals)
      .flatMap((o) => o.socialEngineeringSignals);
    timeline.completeStep(4, { signals });

    timeline.completeStep(5, { indicatorCount: evidence.indicators.length });

    const indicators = transformToIndicators(moduleOutputs);
    const deterministic = this.riskEngine.computeScore(indicators);
    timeline.completeStep(6, { riskScore: deterministic.riskScore, threatLevel: deterministic.threatLevel });

    timeline.completeStep(7, { threatLevel: deterministic.threatLevel, threatType: deterministic.threatType });

    const aiResult = await this.aiAgent.interpret({
      evidence: indicators,
      baseRiskScore: deterministic.riskScore,
      urls,
      inputType: "message",
    });
    const final = this.riskEngine.applyAiAdjustment(deterministic.riskScore, aiResult.scoreAdjustment);

    timeline.completeStep(8, {});

    evidence.metadata.analysisDuration = Date.now() - startTime;

    return {
      evidence,
      indicators: evidence.indicators,
      deterministic,
      aiResult: { ...aiResult, adjustedScore: final.finalScore },
      finalScore: final.finalScore,
      timeline: timeline.toJSON(),
      urls,
    };
  }

  async analyzeScreenshot(filePath) {
    const startTime = Date.now();
    const timeline = new InvestigationTimeline();
    timeline.start();

    timeline.addStep(1, "completed", { inputType: "screenshot" });

    const ocrResult = await withTimeout(
      this.ocrService.extractText(filePath),
      this.timeout,
      "OCR adapter"
    );

    const { text, urls: extractedUrls, confidence } = ocrResult;
    timeline.addStep(2, "completed", { urls: extractedUrls || [], count: extractedUrls?.length || 0 });

    const settledResults = [];

    if (text && text.trim().length > 0) {
      const messagePromise = withTimeout(
        this.messageAnalyzer.analyze(text),
        this.timeout,
        "Message analyzer"
      );
      settledResults.push(await runModuleWithSettled(messagePromise, "message-analyzer", text));
    }

    if (extractedUrls && extractedUrls.length > 0) {
      const urlPromises = this._createUrlAnalysisPromises(extractedUrls);
      const urlSettled = await Promise.allSettled(urlPromises);
      for (const s of urlSettled) settledResults.push(s.value);
    }

    const evidence = assembleUnifiedEvidence("screenshot", settledResults);

    const moduleOutputs = settledResults
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value.moduleOutput);

    const domains = moduleOutputs
      .filter((o) => o.extractedDomains)
      .flatMap((o) => o.extractedDomains);
    timeline.completeStep(3, { domains });

    const signals = moduleOutputs
      .filter((o) => o.socialEngineeringSignals)
      .flatMap((o) => o.socialEngineeringSignals);
    timeline.completeStep(4, { signals });

    timeline.completeStep(5, { indicatorCount: evidence.indicators.length });

    const indicators = transformToIndicators(moduleOutputs);
    const deterministic = this.riskEngine.computeScore(indicators);
    timeline.completeStep(6, { riskScore: deterministic.riskScore, threatLevel: deterministic.threatLevel });

    timeline.completeStep(7, { threatLevel: deterministic.threatLevel, threatType: deterministic.threatType });

    const aiResult = await this.aiAgent.interpret({
      evidence: indicators,
      baseRiskScore: deterministic.riskScore,
      urls: extractedUrls || [],
      inputType: "screenshot",
    });
    const final = this.riskEngine.applyAiAdjustment(deterministic.riskScore, aiResult.scoreAdjustment);

    timeline.completeStep(8, {});

    evidence.metadata.analysisDuration = Date.now() - startTime;

    return {
      evidence,
      indicators: evidence.indicators,
      deterministic,
      aiResult: { ...aiResult, adjustedScore: final.finalScore },
      finalScore: final.finalScore,
      timeline: timeline.toJSON(),
      urls: extractedUrls || [],
    };
  }

  async analyzeCombined(text, additionalUrls = []) {
    const startTime = Date.now();
    const timeline = new InvestigationTimeline();
    timeline.start();

    timeline.addStep(1, "completed", { inputType: "combined" });

    const textUrls = extractUrls(text);
    const allUrls = [...new Set([...textUrls, ...additionalUrls])].map(normalizeUrl);
    timeline.addStep(2, "completed", { urls: allUrls, count: allUrls.length });

    const settledResults = [];

    const messagePromise = withTimeout(
      this.messageAnalyzer.analyze(text),
      this.timeout,
      "Message analyzer"
    );
    settledResults.push(await runModuleWithSettled(messagePromise, "message-analyzer", text));

    if (allUrls.length > 0) {
      const urlPromises = this._createUrlAnalysisPromises(allUrls);
      const urlSettled = await Promise.allSettled(urlPromises);
      for (const s of urlSettled) settledResults.push(s.value);
    }

    const evidence = assembleUnifiedEvidence("combined", settledResults);

    const moduleOutputs = settledResults
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value.moduleOutput);

    const domains = moduleOutputs
      .filter((o) => o.extractedDomains)
      .flatMap((o) => o.extractedDomains);
    timeline.completeStep(3, { domains });

    const signals = moduleOutputs
      .filter((o) => o.socialEngineeringSignals)
      .flatMap((o) => o.socialEngineeringSignals);
    timeline.completeStep(4, { signals });

    timeline.completeStep(5, { indicatorCount: evidence.indicators.length });

    const indicators = transformToIndicators(moduleOutputs);
    const deterministic = this.riskEngine.computeScore(indicators);
    timeline.completeStep(6, { riskScore: deterministic.riskScore, threatLevel: deterministic.threatLevel });

    timeline.completeStep(7, { threatLevel: deterministic.threatLevel, threatType: deterministic.threatType });

    const aiResult = await this.aiAgent.interpret({
      evidence: indicators,
      baseRiskScore: deterministic.riskScore,
      urls: allUrls,
      inputType: "combined",
    });
    const final = this.riskEngine.applyAiAdjustment(deterministic.riskScore, aiResult.scoreAdjustment);

    timeline.completeStep(8, {});

    evidence.metadata.analysisDuration = Date.now() - startTime;

    return {
      evidence,
      indicators: evidence.indicators,
      deterministic,
      aiResult: { ...aiResult, adjustedScore: final.finalScore },
      finalScore: final.finalScore,
      timeline: timeline.toJSON(),
      urls: allUrls,
    };
  }

  _createUrlAnalysisPromises(urls) {
    const promises = [];
    for (let i = 0; i < urls.length; i += MAX_CONCURRENT_URLS) {
      const batch = urls.slice(i, i + MAX_CONCURRENT_URLS);
      for (const url of batch) {
        promises.push(
          (async () => {
            const result = await withTimeout(
              this.urlAnalyzer.analyze(url),
              this.timeout,
              `URL analyzer (${url})`
            );
            return { status: "fulfilled", value: { source: "url-analyzer", moduleOutput: result } };
          })().catch((error) => ({
            status: "rejected",
            reason: { source: "url-analyzer", input: url, error },
          }))
        );
      }
    }
    return promises;
  }
}
