import { AppError } from "../utils/errors.js";

export const errorHandler = (err, req, res, _next) => {
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
      code: err.code,
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Malformed JSON body",
      statusCode: 400,
      code: "INVALID_JSON",
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      error: `Invalid ${err.path}: ${err.value}`,
      statusCode: 400,
      code: "INVALID_ID",
    });
  }

  if (err.name === "ValidationError" && err.errors) {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: "Validation failed",
      details,
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({
      error: `Upload error: ${err.message}`,
      statusCode: 400,
      code: "UPLOAD_ERROR",
    });
  }

  if (err.name === "MongoServerError" && err.code === 11000) {
    return res.status(409).json({
      error: "Duplicate entry",
      statusCode: 409,
      code: "DUPLICATE_KEY",
    });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    statusCode: 500,
  });
};
