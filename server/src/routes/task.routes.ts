import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { sendSuccess } from "../utils/responses.js";

export const taskRouter = Router();

taskRouter.use(requireAuth);

taskRouter.get("/", (request, response) => {
  sendSuccess(response, 200, {
    tasks: [
      { id: "TM-14", title: "Secure the authentication pipeline", status: "In progress", priority: "High" },
      { id: "TM-15", title: "Connect the protected dashboard", status: "To do", priority: "Medium" },
      { id: "TM-16", title: "Verify the production deployment", status: "To do", priority: "High" },
    ],
    authenticatedUserId: request.auth?.userId,
  });
});
