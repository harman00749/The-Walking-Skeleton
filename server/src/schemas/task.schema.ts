import { z } from "zod";
import { taskPriorities, taskStatuses } from "../models/task.model.js";

const dateOnly = z.union([
  z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must use YYYY-MM-DD format.")
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
    }, "Due date must be a real calendar date."),
  z.null(),
]);

export const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).default(""),
  status: z.enum(taskStatuses).default("todo"),
  priority: z.enum(taskPriorities).default("medium"),
  dueDate: dateOnly.optional().default(null),
}).strict();

export const updateTaskSchema = createTaskSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  { message: "At least one task field must be provided." },
);

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
