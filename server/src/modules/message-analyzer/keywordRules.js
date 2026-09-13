export function checkKeywords(text) {
  const indicators = [];
  const signals = [];
  let riskScore = 0;

  const lowerText = text.toLowerCase();

  if (lowerText.includes("password") || lowerText.includes("passwd")) {
    indicators.push({
      type: "credential-request",
      severity: "critical",
      description: "Message requests password/credentials",
      evidence: lowerText.includes("password") ? "password" : "passwd",
    });
    signals.push("credential-request");
    riskScore = Math.max(riskScore, 75);
  }

  if (/\b(click here|claim now|act now|verify now)\b/i.test(text)) {
    indicators.push({
      type: "call-to-action",
      severity: "medium",
      description: "Message contains aggressive call-to-action",
      evidence: text.match(/\b(click here|claim now|act now|verify now)\b/i)?.[0],
    });
    signals.push("call-to-action");
    riskScore = Math.max(riskScore, 30);
  }

  return { indicators, signals, riskScore };
}
