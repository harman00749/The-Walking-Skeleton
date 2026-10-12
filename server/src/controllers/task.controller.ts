import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { Task, type TaskDocument } from "../models/task.model.js";
import type { CreateTaskInput, UpdateTaskInput } from "../schemas/task.schema.js";
import { AppError } from "../utils/app-error.js";
import { sendSuccess } from "../utils/responses.js";

function serializeTask(task: TaskDocument) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
    authorId: task.authorId.toString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

function parseDueDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  return value === null ? null : new Date(`${value}T00:00:00.000Z`);
}

function getRouteId(value: string | string[] | undefined): string {
  if (typeof value !== "string") throw new AppError(400, "INVALID_TASK_ID", "The task ID is invalid.");
  return value;
}

async function getTaskAndValidateOwnership(taskId: string, userId: string): Promise<TaskDocument> {
  if (!Types.ObjectId.isValid(taskId)) {
    throw new AppError(400, "INVALID_TASK_ID", "The task ID is invalid.");
  }

  const task = await Task.findById(taskId);
  if (!task) throw new AppError(404, "TASK_NOT_FOUND", "The requested task was not found.");
  if (task.authorId.toString() !== userId) {
    throw new AppError(403, "TASK_FORBIDDEN", "You do not have permission to access this task.");
  }
  return task;
}

export async function createTask(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const userId = request.auth!.userId;
    const input = request.body as CreateTaskInput;
    const task = await Task.create({ ...input, dueDate: parseDueDate(input.dueDate), authorId: userId });
    sendSuccess(response, 201, { task: serializeTask(task) }, "Task created successfully.");
  } catch (error) {
    next(error);
  }
}

export async function listTasks(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const tasks = await Task.find({ authorId: request.auth!.userId }).sort({ createdAt: -1 });
    sendSuccess(response, 200, { tasks: tasks.map(serializeTask) });
  } catch (error) {
    next(error);
  }
}

export async function getTask(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const task = await getTaskAndValidateOwnership(getRouteId(request.params.id), request.auth!.userId);
    sendSuccess(response, 200, { task: serializeTask(task) });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const task = await getTaskAndValidateOwnership(getRouteId(request.params.id), request.auth!.userId);
    const input = request.body as UpdateTaskInput;
    if (input.title !== undefined) task.title = input.title;
    if (input.description !== undefined) task.description = input.description;
    if (input.status !== undefined) task.status = input.status;
    if (input.priority !== undefined) task.priority = input.priority;
    if (input.dueDate !== undefined) task.dueDate = parseDueDate(input.dueDate) ?? null;
    await task.save();
    sendSuccess(response, 200, { task: serializeTask(task) }, "Task updated successfully.");
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const task = await getTaskAndValidateOwnership(getRouteId(request.params.id), request.auth!.userId);
    await task.deleteOne();
    sendSuccess(response, 200, { deletedTaskId: task.id }, "Task deleted successfully.");
  } catch (error) {
    next(error);
  }
}
