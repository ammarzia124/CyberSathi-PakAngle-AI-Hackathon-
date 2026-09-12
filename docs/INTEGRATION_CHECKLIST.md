# Integration Checklist

## Pre-Integration (Completed)

- [x] URL analyzer deterministic rules implemented (`server/src/modules/url-analyzer/rules.js`)
- [x] Message analyzer patterns implemented (`server/src/modules/message-analyzer/patterns.js`)
- [x] Message analyzer keyword rules implemented (`server/src/modules/message-analyzer/keywordRules.js`)
- [x] Urdu translation service fully rewritten (`server/src/services/UrduTranslationService.js`)
- [x] Report controller refactored to DI factory pattern (`server/src/controllers/report.controller.js`)
- [x] Bug fix: `analyze.controller.js:25` no longer references non-existent `aiResult.urduExplanation`
- [x] GET `/api/scans/:id` route wired (`server/src/routes/scans.routes.js`)
- [x] Input validation guards for missing request body (`server/src/utils/validation.js`)
- [x] Unit tests: 28 passing (urduTranslationService + reportUrdu)
- [x] Integration tests: 203 passing (api + security + demoScenarios + orchestrator + screenshot)
- [x] 15 test suites, 0 failures, 2 skipped (MongoDB-dependent)
- [x] 82% statement coverage, 90% function coverage

## Team Handoff Status

### Ammar (Backend Integration) → Toseef (Frontend/Report)

| Item | Status | Notes |
|---|---|---|
| Report schema preserved | ✅ | All 12 fields in `server/src/models/Report.js` |
| API response shape | ✅ | Documented in `docs/API_CONTRACT.md` |
| GET `/api/report/:id` | ✅ | Returns full report, 503 if MongoDB down |
| POST `/api/report/:id/urdu` | ✅ | Triggers translation, returns full report |
| GET `/api/scans` | ✅ | Returns paginated scan list |
| GET `/api/scans/:id` | ✅ | Returns single scan by ID |

### Ammar → Asad (Analyzers)

| Item | Status | Notes |
|---|---|---|
| UrlAnalyzer interface | ✅ | Input: URL string, Output: `{ indicators, urlRiskScore, ... }` |
| MessageAnalyzer interface | ✅ | Input: text string, Output: `{ indicators, messageRiskScore, ... }` |
| RiskEngine integration | ✅ | Consumes evidence array, returns `{ riskScore, threatLevel, threatType }` |
| AI Agent fallback | ✅ | No API key → deterministic-only with "unavailable" explanation |

### Ammar → Amna (Deployment/Input)

| Item | Status | Notes |
|---|---|---|
| MongoDB URI config | ✅ | `process.env.MONGODB_URI` |
| OpenAI API key config | ✅ | `process.env.OPENAI_API_KEY` |
| CORS origins config | ✅ | `process.env.CORS_ORIGINS` (comma-separated) |
| Rate limiting | ✅ | 100 requests per 15 min on `/api/*` |
| File upload validation | ✅ | Only .jpg/.jpeg/.png/.gif/.webp accepted |

## Environment Variables Required

```bash
# Required for full functionality
OPENAI_API_KEY=sk-...          # LLM for explanation + Urdu translation
MONGODB_URI=mongodb://...      # Report persistence

# Optional
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
PORT=3000
```

## Test Commands

```bash
cd server
npm test                        # Run all tests with coverage
npx jest tests/integration/     # Integration tests only
npx jest tests/unit/            # Unit tests only
```

## Known Limitations (No MongoDB)

- `GET /api/report/:id` returns 503
- `POST /api/report/:id/urdu` returns 503
- `GET /api/scans` returns empty list
- Reports are not persisted (created in-memory only)
- All analysis endpoints still work (201 responses)

## Known Limitations (No OpenAI API Key)

- AI explanation falls back to "AI analysis unavailable" text
- Urdu translation returns 503
- Score adjustment is always 0 (deterministic-only)
- Threat classification is purely rule-based

## Post-Integration Steps

1. **Start MongoDB**: `mongod` or use MongoDB Atlas
2. **Set environment variables**: Copy `.env.example` to `.env` and fill in
3. **Run full test suite**: `npm test` (should show 231 passing)
4. **Start server**: `npm run dev`
5. **Test with frontend**: Verify all API calls from client
6. **Demo scenarios**: All 8 scenarios should produce correct threat levels
