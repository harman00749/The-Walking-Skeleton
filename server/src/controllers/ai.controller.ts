import type { NextFunction, Request, Response } from "express";
import type { AiSuggestionInput } from "../schemas/ai.schema.js";
import type { AiSuggestionService } from "../services/ai.service.js";
import { sendSuccess } from "../utils/responses.js";

export function createAiSuggestionController(aiService: AiSuggestionService) {
  return async function suggestTaskSubsteps(
    request: Request<object, object, AiSuggestionInput>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const subtasks = await aiService.generateSubtasks(request.body);
      sendSuccess(response, 200, { subtasks }, "AI sub-steps generated successfully.");
    } catch (error) {
      next(error);
    }
  };
}

