# Integration Handoffs

## Asad → Ammar

### UrlAnalyzer

**Input:** `string` (URL)
**Output:**
```js
{
  type: "url",
  indicators: [{ type, severity, description, evidence }],
  suspiciousPatterns: [string],
  urlRiskScore: number,        // 0-100
  extractedDomains: [string],
  analyzedAt: ISO timestamp
}
```

### MessageAnalyzer

**Input:** `string` (text)
**Output:**
```js
{
  type: "message",
  indicators: [{ type, severity, description, evidence }],
  socialEngineeringSignals: [string],
  messageRiskScore: number,    // 0-100
  extractedUrls: [string],
  analyzedAt: ISO timestamp
}
```

### RiskEngine

**Input:** `Evidence[]` (array from analyzers)
**Output:**
```js
{
  riskScore: number,           // 0-100 pre-AI
  threatLevel: "Low|Suspicious|High|Critical",
  threatType: string,
  scoringBreakdown: [{ source, weight, score }]
}
```

## Ammar → Toseef/Amna

### API Response

Standard report shape defined in `docs/API_CONTRACT.md`.

## Ammar → AI Agent

**Input:** `evidence[], deterministicScore`
**Output:**
```js
{
  adjustment: number,          // -15 to +15
  adjustedScore: number,       // 0-100
  explanation: string,
  urduExplanation: string,
  recommendedActions: [string]
}
```

## Failure Modes

| Module | Failure | Fallback |
|---|---|---|
| AI Agent | LLM timeout | Use deterministic score, null explanation |
| OCR | Extraction fails | Empty text, proceed with what's available |
| URL Analyzer | Invalid URL | Return parse error indicator |
