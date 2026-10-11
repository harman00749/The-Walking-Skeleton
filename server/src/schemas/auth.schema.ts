import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(160);
const password = z.string().min(8, "Password must contain at least 8 characters.").max(72);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters.").max(80),
  email,
  password,
}).strict();

export const loginSchema = z.object({ email, password }).strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
