export const AI_AGENT_CONFIG = {
  model: process.env.AI_MODEL || "gpt-4o-mini",
  temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.3,
  maxTokens: parseInt(process.env.AI_MAX_TOKENS, 10) || 500,
  apiUrl: process.env.AI_API_URL || "https://api.groq.com/openai/v1/chat/completions",
  timeoutMs: parseInt(process.env.AI_TIMEOUT_MS, 10) || 15000,
  adjustmentMin: parseInt(process.env.AI_ADJUSTMENT_MIN, 10) || -15,
  adjustmentMax: parseInt(process.env.AI_ADJUSTMENT_MAX, 10) || 15,
  maxRetries: parseInt(process.env.AI_MAX_RETRIES, 10) || 1,
};
