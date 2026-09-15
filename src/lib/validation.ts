import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z
  .object({
    firstName: z.string().min(1, "Enter your first name").max(40),
    lastName: z.string().min(1, "Enter your last name").max(40),
    country: z.string().min(1, "Select your country"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

export const profileSchema = z.object({
  fullName: z.string().min(2, "Enter your full name").max(80),
});

export const supportTicketSchema = z.object({
  category: z.string().min(1, "Select a category"),
  subject: z.string().min(3, "Subject is too short").max(120),
  message: z.string().min(10, "Please provide a bit more detail").max(2000),
});

export const depositRequestSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than 0"),
  method: z.enum(["bank_transfer", "card", "crypto", "other"], { message: "Select a payment method" }),
  note: z.string().max(500).optional(),
});

export const paperOrderSchema = z.object({
  symbol: z.string().min(1, "Select an asset"),
  side: z.enum(["buy", "sell"]),
  type: z.enum(["market", "limit", "stop"]),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  limitPrice: z.coerce.number().positive().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
export type DepositRequestInput = z.infer<typeof depositRequestSchema>;
export type DepositRequestFormValues = z.input<typeof depositRequestSchema>;
export type PaperOrderInput = z.infer<typeof paperOrderSchema>;
export type PaperOrderFormValues = z.input<typeof paperOrderSchema>;
