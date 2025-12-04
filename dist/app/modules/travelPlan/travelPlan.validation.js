"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelPlanSchemaValidation = exports.createTravelPlanSchema = void 0;
const zod_1 = require("zod");
const travelPlan_interface_1 = require("./travelPlan.interface");
exports.createTravelPlanSchema = zod_1.z.object({
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
        .max(100, "Minimum age cannot exceed 100")
        .default(18)
        .optional(),
}).refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
});
exports.TravelPlanSchemaValidation = {
    createTravelPlanSchema: exports.createTravelPlanSchema,
};
