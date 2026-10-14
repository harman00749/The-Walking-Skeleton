import { Router } from "express";
import { createAiSuggestionController } from "../controllers/ai.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { aiSuggestionLimiter } from "../middleware/rate-limits.js";
import { validateBody } from "../middleware/validate.js";
import { aiSuggestionSchema } from "../schemas/ai.schema.js";
import type { AiSuggestionService } from "../services/ai.service.js";

export function createAiRouter(aiService: AiSuggestionService): Router {
  const router = Router();
  router.use(requireAuth);
  router.post("/suggest", aiSuggestionLimiter, validateBody(aiSuggestionSchema), createAiSuggestionController(aiService));
  return router;
}

