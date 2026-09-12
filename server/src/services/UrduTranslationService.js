import { AI_AGENT_CONFIG } from "../modules/ai-agent/config.js";

const TRANSLATION_SYSTEM_PROMPT = `You are a professional English-to-Urdu translator specializing in cybersecurity for Pakistani users.

RULES:
1. Translate meaning accurately into natural Pakistani Urdu (اردو).
2. Use Nastaliq-friendly characters.
3. Preserve security/technical terminology where translation would reduce clarity (e.g., "phishing", "malware", "URL", "HTTP", "HTTPS", "VPN", "firewall", "ransomware", "DDoS").
4. NEVER translate or modify URLs — copy them exactly as provided.
5. Preserve all numbers exactly as they appear.
6. Do NOT add any new security claims or assessments not present in the original.
7. Do NOT remove or weaken any recommendations from the original.
8. Return ONLY the translated text. No labels, no explanations, no quotes.
9. Maintain the same structure (paragraphs, bullet points, line breaks) as the input.`;

function buildTranslationPrompt(explanation, recommendedActions) {
  let prompt = `Translate the following cybersecurity report content into Urdu.\n\n`;

  prompt += `--- EXPLANATION ---\n${explanation}\n\n`;

  if (Array.isArray(recommendedActions) && recommendedActions.length > 0) {
    prompt += `--- RECOMMENDED ACTIONS ---\n`;
    recommendedActions.forEach((action, i) => {
      prompt += `${i + 1}. ${action}\n`;
    });
    prompt += `\n`;
  }

  prompt += `Return the translation in this exact JSON format:\n`;
  prompt += `{"explanation": "<urdu translation of explanation>", "recommendedActions": [<urdu translations of each action>]}\n`;
  prompt += `If there are no recommended actions, return an empty array for recommendedActions.`;

  return prompt;
}

function validateTranslationResult(result) {
  if (!result || typeof result !== "object") return false;
  if (typeof result.explanation !== "string" || result.explanation.trim().length === 0) return false;
  if (!Array.isArray(result.recommendedActions)) return false;
  return true;
}

export class UrduTranslationService {
  constructor(deps = {}) {
    this.fetchFn = deps.fetchFn || globalThis.fetch;
  }

  async translate(explanation, recommendedActions = []) {
    if (!explanation || typeof explanation !== "string") {
      return null;
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn("Urdu translation skipped: no OPENAI_API_KEY");
      return null;
    }

    const prompt = buildTranslationPrompt(explanation, recommendedActions);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await this.fetchFn(AI_AGENT_CONFIG.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: AI_AGENT_CONFIG.model,
          temperature: 0.2,
          max_tokens: 1000,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: TRANSLATION_SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn("Urdu translation API error:", response.status);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        console.warn("Urdu translation: empty API response");
        return null;
      }

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        console.warn("Urdu translation: malformed JSON response");
        return null;
      }

      if (!validateTranslationResult(parsed)) {
        console.warn("Urdu translation: invalid response structure");
        return null;
      }

      return {
        explanation: parsed.explanation.trim(),
        recommendedActions: parsed.recommendedActions,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        console.warn("Urdu translation timed out after 15s");
      } else {
        console.warn("Urdu translation failed:", error.message);
      }
      return null;
    }
  }
}
