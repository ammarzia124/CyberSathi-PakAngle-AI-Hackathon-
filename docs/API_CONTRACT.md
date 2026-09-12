# API Contract

## Endpoints

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/analyze/url` | `{ "url": "string" }` | Report |
| POST | `/api/analyze/message` | `{ "text": "string" }` | Report |
| POST | `/api/analyze/screenshot` | `multipart: screenshot` | Report |
| POST | `/api/analyze/combined` | `{ "text": "string", "urls": [] }` | Report |
| GET | `/api/report/:id` | — | Report |
| GET | `/api/scans?page=1` | — | { scans[], pagination } |
| GET | `/api/analytics` | — | { totalScans, threatDistribution, avgRiskScore } |
| POST | `/api/report/:id/urdu` | — | Report (with urduExplanation) |
| GET | `/api/health` | — | { status, timestamp, uptime } |

## Report Object Shape

```json
{
  "reportId": "string (UUID)",
  "inputType": "url | message | screenshot | combined",
  "riskScore": 0,
  "threatLevel": "Low | Suspicious | High | Critical",
  "threatType": "string",
  "indicators": [
    {
      "type": "string",
      "severity": "info | low | medium | high | critical",
      "description": "string",
      "evidence": "string"
    }
  ],
  "explanation": "string",
  "recommendedActions": ["string"],
  "urls": ["string"],
  "investigationTimeline": [
    {
      "id": "string",
      "timestamp": "ISO-8601",
      "event": "string",
      "source": "string"
    }
  ],
  "urduExplanation": "string | null",
  "createdAt": "ISO-8601"
}
```

## Scans List Response

```json
{
  "scans": [
    {
      "reportId": "string",
      "inputType": "string",
      "riskScore": 0,
      "threatLevel": "string",
      "threatType": "string",
      "createdAt": "ISO-8601"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "pages": 0
  }
}
```

## Urdu Translation Endpoint

```text
POST /api/report/:id/urdu
```

Triggers Urdu translation of the report's explanation and recommended actions.
The report must already exist (created via an analyze endpoint).

**Response:** Full report object with `urduExplanation` populated.

```json
{
  "reportId": "string",
  "inputType": "url",
  "riskScore": 75,
  "threatLevel": "High",
  "threatType": "Phishing",
  "indicators": [],
  "explanation": "English explanation...",
  "recommendedActions": [],
  "urls": [],
  "investigationTimeline": [],
  "urduExplanation": "اردو وضاحت...",
  "createdAt": "ISO-8601"
}
```

**Error responses:**

| Status | Body | Cause |
|---|---|---|
| 404 | `{ "error": "Report not found", "statusCode": 404 }` | Invalid report ID |
| 503 | `{ "error": "Translation service unavailable", "statusCode": 503 }` | LLM API failure, timeout, or malformed response |
| 503 | `{ "error": "Database unavailable", "statusCode": 503 }` | MongoDB unreachable |

**Translation behavior:**
- Translates explanation and recommended actions into natural Pakistani Urdu
- Preserves URLs exactly (never translated)
- Preserves numbers exactly
- Preserves security terminology (e.g., "phishing", "malware") where translation reduces clarity
- Does not add new security claims or remove recommendations
- Re-calling the endpoint re-translates (overwrites previous Urdu text)

## Risk Levels

| Range | Level |
|---|---|
| 0-29 | Low |
| 30-59 | Suspicious |
| 60-79 | High |
| 80-100 | Critical |

## AI Adjustment

- Min: -15
- Max: +15
- Final score clamped to 0-100
