import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { AppError } from "../utils/app-error.js";

export const notFound: RequestHandler = (request, _response, next) => {
  next(new AppError(404, "NOT_FOUND", `Route ${request.method} ${request.originalUrl} was not found.`));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({ success: false, error: { code: "INVALID_JSON", message: "The request body contains invalid JSON." } });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    response.status(400).json({ success: false, error: { code: "INVALID_IDENTIFIER", message: "The supplied resource identifier is invalid." } });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    response.status(400).json({ success: false, error: { code: "DATABASE_VALIDATION_ERROR", message: "The submitted data is invalid." } });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      error: { code: error.code, message: error.message, details: error.details },
    });
    return;
  }

  if (typeof error === "object" && error && "code" in error && error.code === 11000) {
    response.status(409).json({ success: false, error: { code: "EMAIL_EXISTS", message: "An account with this email already exists." } });
    return;
  }

  response.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected server error occurred." } });
};

