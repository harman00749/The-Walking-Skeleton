import type { Response } from "express";

export function sendSuccess(response: Response, status: number, data: unknown, message?: string): void {
  response.status(status).json({ success: true, message, data });
}
