import { z } from "zod";

export const aiSuggestionSchema = z.object({
  taskTitle: z.string().trim().min(3, "Task title must contain at least 3 characters.").max(120),
  taskDescription: z.string().trim().max(1000).default(""),
  count: z.coerce.number().int().min(3).max(8).default(5),
}).strict();

export const aiSuggestionOutputSchema = z.object({
  subtasks: z.array(z.string().trim().min(2).max(140)).min(3).max(8),
}).strict();

export type AiSuggestionInput = z.infer<typeof aiSuggestionSchema>;

