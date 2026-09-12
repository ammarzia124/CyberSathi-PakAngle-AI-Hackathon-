export const SYSTEM_PROMPT = `You are CyberSathi's contextual security explanation agent. You do not perform independent security detection. Deterministic security modules have already analyzed the submitted content and produced structured evidence. Your job is to interpret that evidence, explain the risk in plain language, classify the likely threat category, recommend safe user actions, and optionally provide a contextual risk adjustment from -15 to +15. Never invent evidence. Never fabricate URLs, indicators, or technical findings. If the evidence is weak or ambiguous, say so. Your score adjustment must reflect context only and must never replace the deterministic risk score.`;

function sanitize(text) {
  if (typeof text !== "string") return String(text);
  return text.replace(/[\x00-\x1f\x7f]/g, "").slice(0, 500);
}

export function buildPrompt({ evidence, baseRiskScore, urls, inputType }) {
  const evidenceList = Array.isArray(evidence)
    ? evidence.map((e) => `- [${e.type}] severity=${e.severity} weight=${e.weight} source=${e.source}: "${sanitize(e.evidence)}"`).join("\n")
    : "No evidence provided.";

  const urlSection = Array.isArray(urls) && urls.length > 0
    ? `\nURLs found: ${urls.map((u) => sanitize(u)).join(", ")}`
    : "";

  return `Analyze the following security evidence and provide a contextual explanation.

Deterministic base risk score: ${baseRiskScore}/100
Input type: ${inputType || "unknown"}

Evidence:
${evidenceList}${urlSection}

Respond with valid JSON only (no markdown, no text outside the JSON). Use this exact shape:
{
  "explanation": "<concise plain-language explanation based on the evidence>",
  "threatType": "<phishing|financial-fraud|social-engineering|scam|malware|data-theft|Unknown>",
  "recommendedActions": ["<action1>", "<action2>"],
  "scoreAdjustment": <integer from -15 to +15, 0 if context is ambiguous>
}`;
}
