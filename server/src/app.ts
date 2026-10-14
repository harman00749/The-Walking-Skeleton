import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import { getEnv } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { createAiRouter } from "./routes/ai.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { paymentRouter } from "./routes/payment.routes.js";
import { taskRouter } from "./routes/task.routes.js";
import { GeminiSuggestionService, type AiSuggestionService } from "./services/ai.service.js";
import { sendSuccess } from "./utils/responses.js";

type AppOptions = { aiService?: AiSuggestionService };

export function createApp(options: AppOptions = {}) {
  const app = express();
  const { CLIENT_ORIGIN } = getEnv();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: CLIENT_ORIGIN.split(",").map((origin) => origin.trim()), credentials: true }));
  app.use(express.json({ limit: "50kb" }));

  app.get("/", (_request, response) => {
    sendSuccess(response, 200, {
      service: "TaskMatrix Sprint 16 API",
      documentation: "/api/health",
      message: "Secure CRUD, Stripe Checkout, and the server-side AI microservice are online.",
    });
  });

  app.get("/api/health", (_request, response) => {
    sendSuccess(response, 200, {
      service: "taskmatrix-sprint16-api",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/tasks", taskRouter);
  app.use("/api/ai", createAiRouter(options.aiService ?? new GeminiSuggestionService()));
  app.use("/api/payments", paymentRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

