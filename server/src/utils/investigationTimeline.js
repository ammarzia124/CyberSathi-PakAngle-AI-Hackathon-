import { v4 as uuidv4 } from "uuid";
import { ValidationError } from "./errors.js";

const SENSITIVE_KEYS = new Set([
  "raw",
  "prompt",
  "token",
  "apiKey",
  "api_key",
  "password",
  "secret",
  "stack",
  "internal",
  "rawResponse",
  "providerMetadata",
  "latency",
]);

const STAGES = [
  { step: 1, name: "Input received + type identified" },
  { step: 2, name: "URLs/domains extracted" },
  { step: 3, name: "Domain analysis" },
  { step: 4, name: "Language/social-engineering analysis" },
  { step: 5, name: "Security indicators checked" },
  { step: 6, name: "Risk calculated" },
  { step: 7, name: "Threat classification" },
  { step: 8, name: "Final report generated" },
];

export function sanitizeMetadata(meta) {
  if (!meta || typeof meta !== "object") return {};
  const clean = {};
  for (const [key, value] of Object.entries(meta)) {
    if (!SENSITIVE_KEYS.has(key)) {
      clean[key] = value;
    }
  }
  return clean;
}

export function getStage(stepNumber) {
  return STAGES.find((s) => s.step === stepNumber) || null;
}

export class InvestigationTimeline {
  constructor() {
    this.events = [];
    this.startedAt = null;
    this.completedAt = null;
    this._currentStep = new Map();
  }

  start() {
    this.startedAt = new Date().toISOString();
    return this;
  }

  addStep(stepNumber, status = "in_progress", metadata = {}) {
    const stage = getStage(stepNumber);
    if (!stage) {
      throw new ValidationError(`Invalid step number: ${stepNumber}. Must be 1-8.`);
    }

    const existing = this._currentStep.get(stepNumber);
    if (existing) {
      existing.status = status;
      existing.metadata = { ...existing.metadata, ...sanitizeMetadata(metadata) };
      return this;
    }

    const event = {
      step: stage.step,
      name: stage.name,
      status,
      timestamp: new Date().toISOString(),
      metadata: sanitizeMetadata(metadata),
    };

    this.events.push(event);
    this._currentStep.set(stepNumber, event);
    return this;
  }

  completeStep(stepNumber, metadata = {}) {
    const event = this._currentStep.get(stepNumber);
    if (event) {
      event.status = "completed";
      event.metadata = { ...event.metadata, ...sanitizeMetadata(metadata) };
    } else {
      this.addStep(stepNumber, "completed", metadata);
    }
    return this;
  }

  failStep(stepNumber, reason, metadata = {}) {
    const enriched = { ...metadata, reason: reason || "Unknown error" };
    const event = this._currentStep.get(stepNumber);
    if (event) {
      event.status = "failed";
      event.metadata = { ...event.metadata, ...sanitizeMetadata(enriched) };
    } else {
      this.addStep(stepNumber, "failed", enriched);
    }
    return this;
  }

  toJSON() {
    if (!this.completedAt) {
      this.completedAt = new Date().toISOString();
    }
    return this.events.map((e) => ({
      id: `step-${e.step}`,
      name: e.name,
      timestamp: e.timestamp,
      status: e.status,
      metadata: e.metadata || {},
    }));
  }
}

export function createTimeline() {
  return new InvestigationTimeline();
}
