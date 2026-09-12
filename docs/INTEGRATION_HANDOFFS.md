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

**Implemented rules** (`server/src/modules/url-analyzer/rules.js`):
- Suspicious TLD detection (.xyz, .tk, .ml, etc.)
- IP address as hostname
- URL shortener detection (bit.ly, tinyurl, etc.)
- Excessive subdomains (>3)
- Phishing keywords in URL (login, verify, secure, bank, etc.)
- Obfuscated characters (%00, homoglyphs)

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

**Implemented patterns** (`server/src/modules/message-analyzer/patterns.js`):
- Urgency detection (immediately, within 24 hours, last chance, etc.)
- Authority impersonation (government, bank, police, etc.)
- Financial request detection (send money, bank details, CNIC, etc.)
- OTP/sensitive data requests
- Call-to-action urgency (click here, act now, etc.)

**Implemented keywords** (`server/src/modules/message-analyzer/keywordRules.js`):
- English scam keywords (congratulations, winner, verified, etc.)
- Urdu scam keywords (مبارک ہو, فوری, تصدیق, etc.)
- Financial terms (CNIC, account number, IBAN, Easypaisa, JazzCash, etc.)
- Credential requests (password, PIN, OTP, etc.)

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

**Endpoints available:**

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/analyze/url` | Analyze a URL |
| POST | `/api/analyze/message` | Analyze text message |
| POST | `/api/analyze/screenshot` | Analyze screenshot (OCR) |
| POST | `/api/analyze/combined` | Analyze text + URLs together |
| GET | `/api/report/:id` | Retrieve report by ID |
| GET | `/api/scans?page=1` | List all scans (paginated) |
| GET | `/api/scans/:id` | Get scan by ID |
| POST | `/api/report/:id/urdu` | Get Urdu translation |
| GET | `/api/health` | Health check |

### Report Controller (DI Pattern)

```js
// Production usage (default instance)
import { analyzeUrl, analyzeMessage } from "./controllers/report.controller.js";

// Testing usage (inject dependencies)
import { createReportController } from "./controllers/report.controller.js";
const controller = createReportController({ reportService, translationService });
```

## Ammar → AI Agent

**Input:** `evidence[], deterministicScore`
**Output:**
```js
{
  adjustment: number,          // -15 to +15
  adjustedScore: number,       // 0-100
  explanation: string,
  threatType: string,
  recommendedActions: [string]
}
```

**Fallback behavior:**
- No API key → deterministic-only, explanation = "AI analysis unavailable..."
- LLM timeout → same fallback
- Malformed LLM response → same fallback
- Score adjustment always clamped to [-15, +15]

## Failure Modes

| Module | Failure | Fallback |
|---|---|---|
| AI Agent | LLM timeout | Use deterministic score, null explanation |
| AI Agent | No API key | Deterministic-only, "unavailable" explanation |
| OCR | Extraction fails | Empty text, proceed with what's available |
| URL Analyzer | Invalid URL | Return parse error indicator |
| MongoDB | Unavailable | 503 on report/scans endpoints, analysis still works |
| Urdu Translation | LLM failure | 503 on `/api/report/:id/urdu` |

## Validation Guards

| Endpoint | Guard | Error |
|---|---|---|
| POST `/api/analyze/url` | `validateUrl("url")` | 400 if missing/invalid URL |
| POST `/api/analyze/message` | `validate(["text"])` | 400 if missing/empty text |
| POST `/api/analyze/screenshot` | `uploadMiddleware` | 400 if invalid file type |
| POST `/api/analyze/combined` | `validate(["text"])` + `validateUrlArray("urls")` | 400 if missing text or invalid URLs |
| All POST | Body guard | 400 if body is not JSON object |
