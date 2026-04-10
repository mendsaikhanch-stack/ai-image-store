import { z } from "zod";
import { t } from "@/lib/i18n";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email(t.auth.errors.invalidEmail);

export const passwordSchema = z
  .string()
  .min(6, t.auth.errors.passwordMin)
  .max(128);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, t.auth.errors.passwordRequired),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, t.auth.errors.nameRequired).max(80),
  email: emailSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
