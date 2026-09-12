import { buildPrompt, SYSTEM_PROMPT } from "./prompts.js";
import { validateAiResponse, normalizeAdjustment } from "./scoreAdjuster.js";
import { AI_AGENT_CONFIG } from "./config.js";
import { env } from "../../config/env.js";

export class AiAgent {
  async interpret({ evidence, baseRiskScore, urls, inputType }) {
    const prompt = buildPrompt({ evidence, baseRiskScore, urls, inputType });

    let raw;
    try {
      raw = await this.callLlmWithRetry(prompt);
    } catch (error) {
      console.error("AI agent failed:", error.message);
      return this.getFallbackResponse();
    }

    const { valid, normalized, errors } = validateAiResponse(raw);

    if (!valid) {
      console.warn("AI response validation failed:", errors.join("; "));
      return this.getFallbackResponse();
    }

    return normalized;
  }

  async callLlmWithRetry(prompt) {
    const maxRetries = AI_AGENT_CONFIG.maxRetries;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.callLlm(prompt);
      } catch (error) {
        lastError = error;
        const isRetryable = [429, 502, 503].includes(error.status);
        if (isRetryable && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`LLM call failed (attempt ${attempt + 1}), retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  async callLlm(prompt) {
    if (!env.OPENAI_API_KEY) {
      return this.getFallbackResponse();
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      AI_AGENT_CONFIG.timeoutMs
    );

    try {
      const response = await fetch(AI_AGENT_CONFIG.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: AI_AGENT_CONFIG.model,
          temperature: AI_AGENT_CONFIG.temperature,
          max_tokens: AI_AGENT_CONFIG.maxTokens,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const err = new Error(`LLM API error: ${response.status}`);
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("LLM returned empty content");
      }

      return JSON.parse(content);
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === "AbortError") {
        const err = new Error("LLM request timed out");
        err.status = 504;
        throw err;
      }
      throw error;
    }
  }

  getFallbackResponse() {
    return {
      explanation: "AI analysis unavailable. Results based on deterministic rules only.",
      threatType: "Unknown",
      recommendedActions: [
        "Verify the URL on a phishing database",
        "Do not enter personal information",
      ],
      scoreAdjustment: 0,
    };
  }
}
