"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelPlanSchemaValidation = exports.removeParticipantSchema = exports.addParticipantSchema = exports.updateTravelPlanSchema = exports.createTravelPlanSchema = exports.participantDetailsSchema = void 0;
const zod_1 = require("zod");
const travelPlan_interface_1 = require("./travelPlan.interface");
const user_interface_1 = require("../user/user.interface");
// Participant details validation schema
exports.participantDetailsSchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    bookingId: zod_1.z.string().optional(),
    name: zod_1.z
        .string({ message: "Name is required" })
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name is too long"),
    phone: zod_1.z
        .string({ message: "Phone Number must be string" })
        .regex(/^(?:01\d{9})$/, {
        message: "Phone number must be valid for Bangladesh. Format:01XXXXXXXXX",
    }),
    gender: zod_1.z.nativeEnum(user_interface_1.IUserGender, { error: "Gender is required" }),
    age: zod_1.z
        .number({ message: "Age is required" })
        .int("Age must be a whole number")
        .min(5, "Age must be at least 5")
        .max(50, "Age must be less than 50"),
});
exports.createTravelPlanSchema = zod_1.z
    .object({
    title: zod_1.z
        .string({ message: "Title is required" })
        .min(5, "Title must be at least 5 characters")
        .max(200, "Title cannot exceed 200 characters")
        .trim(),
    description: zod_1.z
        .string({ message: "Description is required" })
        .min(20, "Description must be at least 20 characters")
        .max(2000, "Description cannot exceed 2000 characters"),
    budget: zod_1.z
        .number({ message: "Budget is required" })
        .min(0, "Budget cannot be negative"),
    destination: zod_1.z.object({
        city: zod_1.z.string({ message: "Destination city is required" }).trim(),
        country: zod_1.z.string({ message: "Destination country is required" }).trim(),
    }),
    departureLocation: zod_1.z.string().trim().optional(),
    arrivalLocation: zod_1.z.string().trim().optional(),
    included: zod_1.z.array(zod_1.z.string()).optional(),
    excluded: zod_1.z.array(zod_1.z.string()).optional(),
    startDate: zod_1.z
        .string({ message: "Start date is required" })
        .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid start date format",
    })
        .transform((date) => new Date(date)),
    endDate: zod_1.z
        .string({ message: "End date is required" })
        .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid end date format",
    })
        .transform((date) => new Date(date)),
    travelType: zod_1.z.nativeEnum(travelPlan_interface_1.ITravelType, {
        message: "Travel type is required",
    }),
    interests: zod_1.z
        .array(zod_1.z.nativeEnum(travelPlan_interface_1.ITrevelInterest))
        .min(1, "At least one interest is required"),
    maxGuest: zod_1.z
        .number({ message: "Maximum guests is required" })
        .int()
        .min(1, "At least 1 guest is required"),
    minAge: zod_1.z
        .number()
        .int()
        .min(5, "Minimum age cannot be less than 5")
        .max(50, "Minimum age cannot exceed 50")
        .default(18)
        .optional(),
})
    .refine((data) => {
    const start = new Date(data.startDate);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 7); // Start date must be at least 7 days from today
    minDate.setHours(0, 0, 0, 0); // Normalize time
    return start >= minDate;
}, {
    message: "Start date must be at least 7 days from today",
    path: ["startDate"],
})
    .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
});
exports.updateTravelPlanSchema = zod_1.z
    .object({
    title: zod_1.z
        .string()
        .min(5, "Title must be at least 5 characters")
        .max(200, "Title cannot exceed 200 characters")
        .trim()
        .optional(),
    description: zod_1.z
        .string()
        .min(20, "Description must be at least 20 characters")
        .max(2000, "Description cannot exceed 2000 characters")
        .optional(),
    budget: zod_1.z.number().min(0, "Budget cannot be negative").optional(),
    destination: zod_1.z
        .object({
        city: zod_1.z.string().trim(),
        country: zod_1.z.string().trim(),
    })
        .optional(),
    departureLocation: zod_1.z.string().trim().optional(),
    arrivalLocation: zod_1.z.string().trim().optional(),
    included: zod_1.z.array(zod_1.z.string()).optional(),
    excluded: zod_1.z.array(zod_1.z.string()).optional(),
    startDate: zod_1.z
        .string()
        .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid start date format",
    })
        .transform((date) => new Date(date))
        .optional(),
    endDate: zod_1.z
        .string()
        .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid end date format",
    })
        .transform((date) => new Date(date))
        .optional(),
    travelType: zod_1.z.nativeEnum(travelPlan_interface_1.ITravelType).optional(),
    interests: zod_1.z
        .array(zod_1.z.nativeEnum(travelPlan_interface_1.ITrevelInterest))
        .min(1, "At least one interest is required")
        .optional(),
    maxGuest: zod_1.z
        .number()
        .int()
        .min(1, "At least 1 guest is required")
        .optional(),
    minAge: zod_1.z
        .number()
        .int()
        .min(5, "Minimum age cannot be less than 5")
        .max(50, "Minimum age cannot exceed 50")
        .optional(),
});
// Add participant to travel plan validation
exports.addParticipantSchema = exports.participantDetailsSchema;
// Remove participant validation
exports.removeParticipantSchema = zod_1.z.object({
    params: zod_1.z.object({
        travelPlanId: zod_1.z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid travel plan ID"),
        phone: zod_1.z.string().regex(/^(?:01\d{9})$/, {
            message: "Phone number must be valid for Bangladesh. Format:01XXXXXXXXX",
        }),
    }),
});
exports.TravelPlanSchemaValidation = {
    createTravelPlanSchema: exports.createTravelPlanSchema,
    updateTravelPlanSchema: exports.updateTravelPlanSchema,
    participantDetailsSchema: exports.participantDetailsSchema,
    addParticipantSchema: exports.addParticipantSchema,
    removeParticipantSchema: exports.removeParticipantSchema,
};
