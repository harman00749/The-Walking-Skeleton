import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { getEnv } from "../config/env.js";
import { aiSuggestionOutputSchema, type AiSuggestionInput } from "../schemas/ai.schema.js";
import { AppError } from "../utils/app-error.js";

export interface AiSuggestionService {
  generateSubtasks(input: AiSuggestionInput): Promise<string[]>;
}

function buildPrompt(input: AiSuggestionInput): string {
  return [
    "You are a secure agile planning assistant inside TaskMatrix.",
    `Break the supplied task into exactly ${input.count} concise implementation sub-steps.`,
    "Start every step with a verb and keep it under 100 characters.",
    "Never include markdown, credentials, shell commands, unsafe instructions, or claims that work is complete.",
    `Task title: ${input.taskTitle}`,
    `Task description: ${input.taskDescription || "No description supplied."}`,
    'Return only JSON in this form: {"subtasks":["step one","step two"]}',
  ].join("\n");
}

function sanitizeSubtasks(values: string[], expectedCount: number): string[] {
  const unique = new Set<string>();
  for (const value of values) {
    const cleaned = value
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 140);
    if (cleaned.length >= 2) unique.add(cleaned);
  }
  const subtasks = Array.from(unique).slice(0, expectedCount);
  if (subtasks.length !== expectedCount) {
    throw new AppError(502, "AI_INVALID_RESPONSE", "The AI provider returned an incomplete response.");
  }
  return subtasks;
}

export class GeminiSuggestionService implements AiSuggestionService {
  async generateSubtasks(input: AiSuggestionInput): Promise<string[]> {
    const { GEMINI_API_KEY, GEMINI_MODEL } = getEnv();
    if (!GEMINI_API_KEY) {
      throw new AppError(503, "AI_NOT_CONFIGURED", "AI suggestions are not configured on the server yet.");
    }

    try {
      const client = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = client.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              subtasks: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
            },
            required: ["subtasks"],
          },
          temperature: 0.3,
          maxOutputTokens: 800,
        },
      });
      const result = await model.generateContent(buildPrompt(input));
      const text = result.response.text();
      if (!text) throw new AppError(502, "AI_EMPTY_RESPONSE", "The AI provider returned an empty response.");

      const parsed = aiSuggestionOutputSchema.safeParse(JSON.parse(text));
      if (!parsed.success) {
        throw new AppError(502, "AI_INVALID_RESPONSE", "The AI provider returned an invalid response.");
      }
      return sanitizeSubtasks(parsed.data.subtasks, input.count);
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof SyntaxError) {
        throw new AppError(502, "AI_INVALID_RESPONSE", "The AI provider returned malformed JSON.");
      }
      throw new AppError(502, "AI_PROVIDER_ERROR", "The AI provider could not generate suggestions.");
    }
  }
}

