import { z } from "zod";
import { ITravelType, ITrevelInterest } from "./travelPlan.interface";
import { IUserGender } from "../user/user.interface";

// Participant details validation schema
export const participantDetailsSchema = z.object({
  userId: z.string().optional(),
  bookingId: z.string().optional(),
  name: z
    .string({ message: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  phone: z
    .string({ message: "Phone Number must be string" })
    .regex(/^(?:01\d{9})$/, {
      message: "Phone number must be valid for Bangladesh. Format:01XXXXXXXXX",
    }),
  gender: z.nativeEnum(IUserGender, { error: "Gender is required" }),
  age: z
    .number({ message: "Age is required" })
    .int("Age must be a whole number")
    .min(5, "Age must be at least 5")
    .max(50, "Age must be less than 50"),
});

export const createTravelPlanSchema = z
  .object({
    title: z
      .string({ message: "Title is required" })
      .min(5, "Title must be at least 5 characters")
      .max(200, "Title cannot exceed 200 characters")
      .trim(),

    description: z
      .string({ message: "Description is required" })
      .min(20, "Description must be at least 20 characters")
      .max(2000, "Description cannot exceed 2000 characters"),

    budget: z
      .number({ message: "Budget is required" })
      .min(0, "Budget cannot be negative"),

    destination: z.object({
      city: z.string({ message: "Destination city is required" }).trim(),
      country: z.string({ message: "Destination country is required" }).trim(),
    }),

    departureLocation: z.string().trim().optional(),
    arrivalLocation: z.string().trim().optional(),
    included: z.array(z.string()).optional(),
    excluded: z.array(z.string()).optional(),

    startDate: z
      .string({ message: "Start date is required" })
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid start date format",
      })
      .transform((date) => new Date(date)),

    endDate: z
      .string({ message: "End date is required" })
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid end date format",
      })
      .transform((date) => new Date(date)),

    travelType: z.nativeEnum(ITravelType, {
      message: "Travel type is required",
    }),

    interests: z
      .array(z.nativeEnum(ITrevelInterest))
      .min(1, "At least one interest is required"),

    maxGuest: z
      .number({ message: "Maximum guests is required" })
      .int()
      .min(1, "At least 1 guest is required"),

    minAge: z
      .number()
      .int()
      .min(5, "Minimum age cannot be less than 5")
      .max(50, "Minimum age cannot exceed 50")
      .default(18)
      .optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 7); // Start date must be at least 7 days from today
      minDate.setHours(0, 0, 0, 0); // Normalize time
      return start >= minDate;
    },
    {
      message: "Start date must be at least 7 days from today",
      path: ["startDate"],
    }
  )
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const updateTravelPlanSchema = z
  .object({
    title: z
      .string()
      .min(5, "Title must be at least 5 characters")
      .max(200, "Title cannot exceed 200 characters")
      .trim()
      .optional(),

    description: z
      .string()
      .min(20, "Description must be at least 20 characters")
      .max(2000, "Description cannot exceed 2000 characters")
      .optional(),

    budget: z.number().min(0, "Budget cannot be negative").optional(),

    destination: z
      .object({
        city: z.string().trim(),
        country: z.string().trim(),
      })
      .optional(),

    departureLocation: z.string().trim().optional(),
    arrivalLocation: z.string().trim().optional(),
    included: z.array(z.string()).optional(),
    excluded: z.array(z.string()).optional(),

    startDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid start date format",
      })
      .transform((date) => new Date(date))
      .optional(),

    endDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid end date format",
      })
      .transform((date) => new Date(date))
      .optional(),

    travelType: z.nativeEnum(ITravelType).optional(),

    interests: z
      .array(z.nativeEnum(ITrevelInterest))
      .min(1, "At least one interest is required")
      .optional(),

    maxGuest: z
      .number()
      .int()
      .min(1, "At least 1 guest is required")
      .optional(),

    minAge: z
      .number()
      .int()
      .min(5, "Minimum age cannot be less than 5")
      .max(50, "Minimum age cannot exceed 50")
      .optional(),
});

// Add participant to travel plan validation
export const addParticipantSchema = participantDetailsSchema;

// Remove participant validation
export const removeParticipantSchema = z.object({
  params: z.object({
    travelPlanId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid travel plan ID"),
    phone: z.string().regex(/^(?:01\d{9})$/, {
      message: "Phone number must be valid for Bangladesh. Format:01XXXXXXXXX",
    }),
  }),
});

export const TravelPlanSchemaValidation = {
  createTravelPlanSchema,
  updateTravelPlanSchema,
  participantDetailsSchema,
  addParticipantSchema,
  removeParticipantSchema,
};
