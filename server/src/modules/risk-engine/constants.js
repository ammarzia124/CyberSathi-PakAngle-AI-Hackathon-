export const RISK_ENGINE_CONSTANTS = {
  LEVELS: {
    LOW: { min: 0, max: 29 },
    SUSPICIOUS: { min: 30, max: 59 },
    HIGH: { min: 60, max: 79 },
    CRITICAL: { min: 80, max: 100 },
  },
  AI_ADJUSTMENT: {
    MIN: -15,
    MAX: 15,
  },
  SCORE_BOUNDS: {
    MIN: 0,
    MAX: 100,
  },
  SEVERITY_SCORES: {
    low: 10,
    medium: 30,
    high: 60,
    critical: 90,
  },
  EVIDENCE_WEIGHTS: {
    url: 1.0,
    message: 0.8,
    combined: 1.2,
  },
  THREAT_TYPE_KEYWORDS: {
    "phishing": ["credential", "login", "password", "verify", "account"],
    "financial-fraud": ["financial", "bank", "payment", "money", "transfer", "upi", "credit"],
    "social-engineering": ["urgency", "fear", "authority", "impersonation", "social"],
    "scam": ["prize", "lottery", "winner", "offer", "free", "reward"],
    "malware": ["technical", "install", "download", "execute", "malware"],
    "data-theft": ["data", "personal", "pii", "information", "harvest"],
  },
};
