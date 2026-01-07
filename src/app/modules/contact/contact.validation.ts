import { z } from "zod";

export const createContactSchema = z.object({
  name: z
    .string({
      message: "Name is required",
    })
    .min(2, "Name must be at least 2 characters"),
  email: z
    .string({
      message: "Email is required",
    })
    .email("Invalid email address"),
  subject: z
    .string({
      message: "Subject is required",
    })
    .min(5, "Subject must be at least 5 characters"),
  message: z
    .string({
      message: "Message is required",
    })
    .min(10, "Message must be at least 10 characters"),
});

export const updateContactStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "IN_PROGRESS", "RESOLVED"], {
      message: "Status is required",
    }),
    adminResponse: z.string().optional(),
  }),
});
