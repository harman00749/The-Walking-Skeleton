import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createCheckoutSession, verifyCheckoutSession } from "../controllers/payment.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const paymentRouter = Router();

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "CHECKOUT_RATE_LIMIT", message: "Too many checkout attempts. Try again later." } },
});

paymentRouter.use(requireAuth);
paymentRouter.post("/create-checkout-session", checkoutLimiter, createCheckoutSession);
paymentRouter.get("/sessions/:sessionId", verifyCheckoutSession);
