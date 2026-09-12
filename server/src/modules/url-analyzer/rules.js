import { URL_ANALYZER_CONSTANTS } from "./constants.js";

export function applyRules(normalizedUrl) {
  const indicators = [];
  const suspiciousPatterns = [];
  let riskScore = 0;
  const domains = normalizedUrl.hostname ? [normalizedUrl.hostname] : [];

  if (normalizedUrl.parseError) {
    indicators.push({
      type: "invalid-url",
      severity: "medium",
      description: "URL could not be parsed",
      evidence: normalizedUrl.original,
    });
    riskScore += 20;
    return { indicators, suspiciousPatterns, riskScore: Math.min(100, riskScore), domains };
  }

  const hostname = (normalizedUrl.hostname || "").toLowerCase();
  const pathname = (normalizedUrl.pathname || "").toLowerCase();
  const fullUrl = normalizedUrl.normalized.toLowerCase();

  for (const tld of URL_ANALYZER_CONSTANTS.SUSPICIOUS_TLDS) {
    if (hostname.endsWith(tld)) {
      indicators.push({
        type: "suspicious-tld",
        severity: "high",
        description: `Uses suspicious TLD: ${tld}`,
        evidence: hostname,
      });
      suspiciousPatterns.push(`suspicious-tld:${tld}`);
      riskScore += 30;
      break;
    }
  }

  if (URL_ANALYZER_CONSTANTS.IP_ADDRESS_PATTERN.test(hostname)) {
    indicators.push({
      type: "ip-address-url",
      severity: "high",
      description: "URL uses IP address instead of domain name",
      evidence: hostname,
    });
    suspiciousPatterns.push("ip-address");
    riskScore += 35;
  }

  for (const shortener of URL_ANALYZER_CONSTANTS.SHORTENER_DOMAINS) {
    if (hostname === shortener || hostname.endsWith(`.${shortener}`)) {
      indicators.push({
        type: "url-shortener",
        severity: "medium",
        description: `Uses URL shortener: ${shortener}`,
        evidence: hostname,
      });
      suspiciousPatterns.push(`shortener:${shortener}`);
      riskScore += 20;
      break;
    }
  }

  const subdomains = hostname.split(".");
  if (subdomains.length > URL_ANALYZER_CONSTANTS.MAX_SUBDOMAINS + 1) {
    indicators.push({
      type: "excessive-subdomains",
      severity: "medium",
      description: `Has ${subdomains.length - 1} subdomains (max recommended: ${URL_ANALYZER_CONSTANTS.MAX_SUBDOMAINS})`,
      evidence: hostname,
    });
    suspiciousPatterns.push("excessive-subdomains");
    riskScore += 15;
  }

  const pathKeywords = pathname.split(/[\/\-\_\.]/);
  for (const keyword of URL_ANALYZER_CONSTANTS.PHISHING_KEYWORDS) {
    if (pathKeywords.includes(keyword)) {
      indicators.push({
        type: "phishing-keyword",
        severity: "high",
        description: `Path contains phishing keyword: "${keyword}"`,
        evidence: pathname,
      });
      suspiciousPatterns.push(`phishing-keyword:${keyword}`);
      riskScore += 20;
      break;
    }
  }

  if (fullUrl.includes("@" )) {
    indicators.push({
      type: "obfuscated-url",
      severity: "high",
      description: "URL contains @ symbol which may hide the real destination",
      evidence: normalizedUrl.normalized,
    });
    suspiciousPatterns.push("obfuscated-url");
    riskScore += 25;
  }

  riskScore = Math.min(100, riskScore);

  return { indicators, suspiciousPatterns, riskScore, domains };
}
