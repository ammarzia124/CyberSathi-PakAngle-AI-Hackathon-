# Architecture

## Pipeline

```
React → Express API → Controller → AnalysisOrchestrator
         → Deterministic Modules → Unified Evidence
         → RiskEngine → AI Agent → Report Service
         → MongoDB → API Response → React UI
```

## Data Flow

1. **Input:** User submits URL, message, screenshot, or combined
2. **Controller:** Validates input, delegates to Orchestrator
3. **Orchestrator:** Routes to correct analysis pipeline
4. **Deterministic Analysis:** Asad's modules produce evidence
5. **Risk Engine:** Computes weighted score from evidence
6. **AI Agent:** Interprets evidence, provides explanation, adjusts score ±15
7. **Report Service:** Builds final API response, persists to MongoDB
8. **Frontend:** Fetches report, renders UI

## Module Ownership

| Module | Owner |
|---|---|
| URL Analyzer | Asad |
| Message Analyzer | Asad |
| Risk Engine | Asad |
| AI Agent | Ammar |
| OCR | Ammar |
| Orchestrator | Ammar |
| Report Service | Ammar |
| Routes/Controllers | Ammar |
| Report UI | Toseef |
| Dashboard | Toseef |
| Timeline UI | Toseef |
| Input UX | Amna |
| Deployment | Amna |
