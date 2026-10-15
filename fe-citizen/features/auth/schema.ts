import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z
    .string()
    .min(3, "At least 3 characters")
    .regex(/^[a-zA-Z0-9_.]+$/, "Letters, numbers, underscores and dots only"),
  email: z.string().email("Enter a valid email address"),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Enter a valid phone number"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Needs an uppercase letter")
    .regex(/[a-z]/, "Needs a lowercase letter")
    .regex(/[0-9\W]/, "Needs a number or symbol"),
});

export type RegisterValues = z.infer<typeof registerSchema>;
