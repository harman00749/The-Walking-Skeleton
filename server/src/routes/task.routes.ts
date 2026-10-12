import { Router } from "express";
import { createTask, deleteTask, getTask, listTasks, updateTask } from "../controllers/task.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { createTaskSchema, updateTaskSchema } from "../schemas/task.schema.js";

export const taskRouter = Router();

taskRouter.use(requireAuth);
taskRouter.get("/", listTasks);
taskRouter.post("/", validateBody(createTaskSchema), createTask);
taskRouter.get("/:id", getTask);
taskRouter.put("/:id", validateBody(updateTaskSchema), updateTask);
taskRouter.delete("/:id", deleteTask);
