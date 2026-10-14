import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { loginLimiter, registerLimiter } from "../middleware/rate-limits.js";
import { validateBody } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

export const authRouter = Router();

authRouter.post("/register", registerLimiter, validateBody(registerSchema), register);
authRouter.post("/login", loginLimiter, validateBody(loginSchema), login);
authRouter.get("/me", requireAuth, me);

