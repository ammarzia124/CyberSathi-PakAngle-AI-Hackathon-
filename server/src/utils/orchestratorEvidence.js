import { v4 as uuidv4 } from "uuid";

export function createEmptyEvidence(inputType) {
  return {
    indicators: [],
    urls: [],
    messageSignals: [],
    domainSignals: [],
    sourceResults: [],
    metadata: {
      inputType,
      totalUrls: 0,
      successfulAnalyses: 0,
      failedAnalyses: 0,
      analysisDuration: 0,
    },
  };
}

export function addIndicator(evidence, indicator, source, sourceInput) {
  evidence.indicators.push({
    id: uuidv4(),
    type: indicator.type || "unknown",
    severity: indicator.severity || "info",
    description: indicator.description || "",
    evidence: indicator.evidence || "",
    source,
    sourceInput: String(sourceInput || ""),
    analyzedAt: new Date().toISOString(),
  });
}

export function addSourceResult(evidence, module, input, status, data = {}) {
  const entry = {
    module,
    input: String(input || ""),
    status,
    timestamp: new Date().toISOString(),
  };

  if (status === "success") {
    entry.riskScore = data.riskScore ?? null;
    entry.indicatorCount = data.indicatorCount ?? 0;
    evidence.metadata.successfulAnalyses++;
  } else {
    entry.error = data.error || "Unknown error";
    entry.errorCode = data.errorCode || "MODULE_ERROR";
    evidence.metadata.failedAnalyses++;
  }

  evidence.sourceResults.push(entry);
}

export function mergeEvidence(target, source) {
  target.indicators.push(...(source.indicators || []));
  target.urls.push(...(source.urls || []));
  target.messageSignals.push(...(source.messageSignals || []));
  target.domainSignals.push(...(source.domainSignals || []));
  target.sourceResults.push(...(source.sourceResults || []));
  target.metadata.totalUrls = target.urls.length;
  target.metadata.successfulAnalyses += source.metadata?.successfulAnalyses || 0;
  target.metadata.failedAnalyses += source.metadata?.failedAnalyses || 0;
}

export function buildEvidenceFromModuleResult(moduleOutput, source) {
  const evidence = createEmptyEvidence(moduleOutput.type || source);

  if (moduleOutput.indicators) {
    for (const ind of moduleOutput.indicators) {
      addIndicator(evidence, ind, source, moduleOutput.input || "");
    }
  }

  if (moduleOutput.extractedDomains) {
    evidence.urls.push(...moduleOutput.extractedDomains);
    evidence.domainSignals.push(...(moduleOutput.suspiciousPatterns || []));
  }

  if (moduleOutput.socialEngineeringSignals) {
    evidence.messageSignals.push(...moduleOutput.socialEngineeringSignals);
  }

  if (moduleOutput.extractedUrls) {
    evidence.urls.push(...moduleOutput.extractedUrls);
  }

  evidence.urls = [...new Set(evidence.urls)];
  evidence.metadata.totalUrls = evidence.urls.length;

  return evidence;
}

export function assembleUnifiedEvidence(inputType, settledResults) {
  const unified = createEmptyEvidence(inputType);

  for (const result of settledResults) {
    if (result.status === "fulfilled") {
      const { source, moduleOutput } = result.value;
      const moduleEvidence = buildEvidenceFromModuleResult(moduleOutput, source);
      addSourceResult(unified, source, moduleEvidence.urls[0] || "", "success", {
        riskScore: moduleOutput.urlRiskScore ?? moduleOutput.messageRiskScore ?? null,
        indicatorCount: moduleEvidence.indicators.length,
      });
      mergeEvidence(unified, moduleEvidence);
    } else {
      const { source, input, error } = result.reason;
      addSourceResult(unified, source, input, "failed", {
        error: error?.message || String(error),
        errorCode: error?.code || "MODULE_ERROR",
      });
    }
  }

  unified.urls = [...new Set(unified.urls)];
  unified.metadata.totalUrls = unified.urls.length;

  return unified;
}
