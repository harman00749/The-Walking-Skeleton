import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../utils/app-error.js";

export const notFound: RequestHandler = (request, _response, next) => {
  next(new AppError(404, "NOT_FOUND", `Route ${request.method} ${request.originalUrl} was not found.`));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
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
