import z from "zod";
import { IUserGender, IUserRole } from "./user.interface";

export const createUserSchema = z
  .object({
    fullname: z
      .string()
      .min(2, { message: "Full name must be at least 2 characters" })
      .max(100, { message: "Full name cannot exceed 100 characters" }),
    email: z
      .string()
      .email({ message: "Please provide a valid email address" })
      .max(100, { message: "Email cannot exceed 100 characters" })
      .trim()
      .toLowerCase(),
    password: z
      .string({ message: "Password must be string" })
      .min(8, { message: "Password must be at least 8 characters long." })
      .regex(/^(?=.*[A-Z])/, {
        message: "Password must contain at least 1 uppercase letter.",
      })
      .regex(/^(?=.*[!@#$%^&*])/, {
        message: "Password must contain at least 1 special character.",
      })
      .regex(/^(?=.*\d)/, {
        message: "Password must contain at least 1 number.",
      }),

    role: z.nativeEnum(IUserRole).default(IUserRole.USER).optional(),
    phone: z
      .string({ message: "Phone Number must be string" })
      .regex(/^(?:01\d{9})$/, {
        message:
          "Phone number must be valid for Bangladesh. Format:01XXXXXXXXX",
      })
      .optional(),
    gender: z.nativeEnum(IUserGender).optional(),

    profilePhoto: z
      .string()
      .url({ message: "Profile photo must be a valid URL" })
      .optional()
      .or(z.literal("").transform(() => undefined)),

    bio: z
      .string()
      .min(20, { message: "Bio cannot exceed 20 characters" })
      .max(500, { message: "Bio cannot exceed 500 characters" })
      .optional()
      .default(""),

    travelInterests: z.array(z.string()).optional().default([]),

    visitedCountries: z.array(z.string()).optional().default([]),

    currentLocation: z
      .object({
        city: z
          .string()
          .max(50, { message: "City name cannot exceed 50 characters" })
          .optional(),
        country: z
          .string()
          .max(50, { message: "Country name cannot exceed 50 characters" })
          .optional(),
      })
      .optional(),

    averageRating: z
      .number()
      .min(0, { message: "Rating cannot be less than 0" })
      .max(5, { message: "Rating cannot exceed 5" })
      .default(0)
      .optional(),

    reviewCount: z
      .number()
      .min(0, { message: "Review count cannot be negative" })
      .default(0)
      .optional(),

    isVerified: z.boolean().default(false).optional(),

    isDeleted: z.boolean().default(false).optional(),
  })
  .refine(
    (data) => {
      // Only require gender if it's provided (not undefined)
      if (data.gender !== undefined) {
        return Object.values(IUserGender).includes(data.gender);
      }
      return true;
    },
    {
      message: "Please provide a valid gender",
      path: ["gender"],
    }
  );

export const updateUserSchema = z.object({
  fullname: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters" })
    .max(100, { message: "Full name cannot exceed 100 characters" })
    .optional(),

  phone: z
    .string({ message: "Phone Number must be string" })
    .regex(/^(?:01\d{9})$/, {
      message: "Phone number must be valid for Bangladesh. Format:01XXXXXXXXX",
    })
    .optional(),
  gender: z.nativeEnum(IUserGender).optional(),
  age: z
    .number("Age must be a number")
    .min(18, { message: "Age must be at least 18 years" })
    .max(50, { message: "Age must be less than 50 years" })
    .optional(),
  travelInterests: z
    .array(z.string({ message: "Travel interest must be string" }))
    .optional(),
  visitedCountries: z
    .array(z.string({ message: "Visited country name must be string" }))
    .optional(),
  bio: z
    .string()
    .min(20, { message: "Bio must be at least 20 characters" })
    .max(500, { message: "Bio cannot exceed 500 characters" })
    // .optional()
    .or(z.literal("")),

  currentLocation: z
    .object({
      city: z
        .string()
        .max(50, { message: "City name cannot exceed 50 characters" })
        .optional(),
      country: z
        .string()
        .max(50, { message: "Country name cannot exceed 50 characters" })
        .optional(),
    })
    .optional(),
});

export const UserSchemaValidation = {
  createUserSchema,
  updateUserSchema,
};
