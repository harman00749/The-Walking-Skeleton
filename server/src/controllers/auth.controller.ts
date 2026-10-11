import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { getEnv } from "../config/env.js";
import { User } from "../models/user.model.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import { AppError } from "../utils/app-error.js";
import { sendSuccess } from "../utils/responses.js";

function signToken(userId: string): string {
  const { JWT_SECRET, JWT_EXPIRES_IN } = getEnv();
  return jwt.sign({ sub: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: "taskmatrix-api",
    audience: "taskmatrix-client",
  });
}

function publicUser(user: { _id: unknown; name: string; email: string }) {
  return { id: String(user._id), name: user.name, email: user.email };
}

export async function register(request: Request<object, object, RegisterInput>, response: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await User.exists({ email: request.body.email });
    if (existing) throw new AppError(409, "EMAIL_EXISTS", "An account with this email already exists.");

    const user = await User.create(request.body);
    sendSuccess(response, 201, { user: publicUser(user), token: signToken(String(user._id)) }, "Account created successfully.");
  } catch (error) {
    next(error);
  }
}

export async function login(request: Request<object, object, LoginInput>, response: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findOne({ email: request.body.email }).select("+password");
    if (!user || !(await bcrypt.compare(request.body.password, user.password))) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }

    sendSuccess(response, 200, { user: publicUser(user), token: signToken(String(user._id)) }, "Login successful.");
  } catch (error) {
    next(error);
  }
}

export async function me(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(request.auth?.userId);
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "User account was not found.");
    sendSuccess(response, 200, { user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}
