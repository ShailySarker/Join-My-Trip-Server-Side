import { z } from "zod";
import { IUserGender } from "../user/user.interface";

// Participant details validation (reusable)
const participantDetailsSchema = z.object({
  name: z
    .string({ message: "Participant name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
  phone: z
    .string({ message: "Phone number is required" })
    .regex(/^(?:01\d{9})$/, {
      message: "Phone number must be valid for Bangladesh. Format:01XXXXXXXXX",
    })
    .trim(),
  gender: z.nativeEnum(IUserGender, {
    message: "Gender must be either MALE or FEMALE",
  }),
  age: z
    .number({ message: "Age is required" })
    .int("Age must be an integer")
    .min(5, "Age must be at least 5 years")
    .max(120, "Age cannot exceed 120 years"),
  userId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format")
    .optional(),
});

const createBookingValidationSchema = z
  .object({
    travelId: z
      .string({ message: "Travel plan ID is required" })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid travel plan ID format"),
    participants: z
      .array(participantDetailsSchema)
      .min(1, "At least one participant is required")
      .max(20, "Cannot add more than 20 participants in a single booking"),
    amount: z
      .number({ message: "Amount is required" })
      .positive("Amount must be greater than 0"),
    totalPeople: z
      .number({ message: "Total people is required" })
      .int("Total people must be an integer")
      .positive("Total people must be at least 1"),
  })
  .refine((data) => data.totalPeople === data.participants.length, {
    message: "Total people must equal the number of participants",
    path: ["totalPeople"],
  });

// Validation for adding participants to an existing booking
const addParticipantsValidationSchema = z.object({
  participants: z
    .array(participantDetailsSchema)
    .min(1, "At least one participant is required")
    .max(10, "Cannot add more than 10 participants at once"),
});

// Validation for removing participant from booking
const removeParticipantValidationSchema = z.object({
  params: z.object({
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid booking ID"),
    phone: z
      .string()
      .regex(/^(\+8801|01)[3-9]\d{8}$/, "Invalid phone number format"),
  }),
});

export const BookingValidations = {
  createBookingValidationSchema,
  addParticipantsValidationSchema,
  removeParticipantValidationSchema,
  participantDetailsSchema,
};
