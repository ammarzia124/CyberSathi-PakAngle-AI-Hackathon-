export class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class UpstreamError extends AppError {
  constructor(service, message = "Service unavailable") {
    super(`${service}: ${message}`, 502, "UPSTREAM_ERROR");
    this.name = "UpstreamError";
  }
}

export class TimeoutError extends AppError {
  constructor(service, message = "Request timed out") {
    super(`${service}: ${message}`, 504, "TIMEOUT_ERROR");
    this.name = "TimeoutError";
    this.service = service;
  }
}

export class ModuleFailedError extends AppError {
  constructor(moduleName, input, cause) {
    super(`${moduleName} failed for input`, 500, "MODULE_FAILED");
    this.name = "ModuleFailedError";
    this.module = moduleName;
    this.input = input;
    this.cause = cause;
    this.isOperational = true;
  }
}
