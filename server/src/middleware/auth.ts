import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";
import { User } from "../models/user.model.js";
import { AppError } from "../utils/app-error.js";

type TokenPayload = jwt.JwtPayload & { sub: string };

export async function requireAuth(request: Request, _response: Response, next: NextFunction): Promise<void> {
  try {
    const authorization = request.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      throw new AppError(401, "AUTH_REQUIRED", "A valid authentication token is required.");
    }

    const token = authorization.slice(7).trim();
    const decoded = jwt.verify(token, getEnv().JWT_SECRET, {
      issuer: "taskmatrix-api",
      audience: "taskmatrix-client",
    }) as TokenPayload;
    if (!decoded.sub || !(await User.exists({ _id: decoded.sub }))) {
      throw new AppError(401, "INVALID_TOKEN", "The authentication token is invalid.");
    }

    request.auth = { userId: decoded.sub };
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, "INVALID_TOKEN", "The authentication token is invalid or expired."));
  }
}
