import { ValidationError } from "./errors.js";

export const validate = (requiredFields) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== "object") {
      return next(new ValidationError("Request body must be a JSON object"));
    }

    for (const field of requiredFields) {
      const value = req.body[field];
      if (value === undefined || value === null) {
        return next(new ValidationError(`Missing required field: ${field}`));
      }
      if (typeof value === "string" && value.trim().length === 0) {
        return next(new ValidationError(`Field '${field}' cannot be empty`));
      }
    }

    next();
  };
};

export const validateUrl = (fieldName = "url") => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== "object") {
      return next(new ValidationError("Request body must be a JSON object"));
    }
    const value = req.body[fieldName];
    if (value === undefined || value === null) {
      return next(new ValidationError(`Missing required field: ${fieldName}`));
    }
    if (typeof value !== "string") {
      return next(new ValidationError(`Field '${fieldName}' must be a string`));
    }
    try {
      new URL(value);
    } catch {
      return next(new ValidationError(`Field '${fieldName}' must be a valid URL`));
    }
    next();
  };
};

export const validateUrlArray = (fieldName = "urls") => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== "object") {
      return next(new ValidationError("Request body must be a JSON object"));
    }
    const value = req.body[fieldName];
    if (value === undefined || value === null) {
      return next();
    }
    if (!Array.isArray(value)) {
      return next(new ValidationError(`Field '${fieldName}' must be an array`));
    }
    for (let i = 0; i < value.length; i++) {
      if (typeof value[i] !== "string") {
        return next(new ValidationError(`Field '${fieldName}[${i}]' must be a string`));
      }
      try {
        new URL(value[i]);
      } catch {
        return next(new ValidationError(`Field '${fieldName}[${i}]' must be a valid URL`));
      }
    }
    next();
  };
};
