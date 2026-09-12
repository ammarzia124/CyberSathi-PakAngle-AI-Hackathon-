const URL_REGEX = /https?:\/\/[^\s<>\"')\]]+/gi;

export function extractUrls(text) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const raw = text.match(URL_REGEX) || [];
  const valid = [];

  for (const candidate of raw) {
    const cleaned = candidate.replace(/[.,;:!?]+$/, "");
    try {
      const parsed = new URL(cleaned);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        valid.push(cleaned);
      }
    } catch {
      continue;
    }
  }

  return [...new Set(valid)];
}
