import rateLimit from "express-rate-limit";

function rateLimitResponse(code: string, message: string) {
  return { success: false, error: { code, message } };
}

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: rateLimitResponse("REGISTER_RATE_LIMITED", "Too many registration attempts. Please try again later."),
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: rateLimitResponse("LOGIN_RATE_LIMITED", "Too many failed login attempts. Please wait 15 minutes."),
});

export const aiSuggestionLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: rateLimitResponse("AI_RATE_LIMITED", "AI request limit reached. Please wait one minute."),
});

