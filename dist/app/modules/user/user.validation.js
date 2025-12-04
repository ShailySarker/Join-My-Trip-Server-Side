"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchemaValidation = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const user_interface_1 = require("./user.interface");
exports.createUserSchema = zod_1.default
    .object({
    fullname: zod_1.default
        .string()
        .min(2, { message: "Full name must be at least 2 characters" })
        .max(100, { message: "Full name cannot exceed 100 characters" }),
    email: zod_1.default
        .string()
        .email({ message: "Please provide a valid email address" })
        .max(100, { message: "Email cannot exceed 100 characters" })
        .trim()
        .toLowerCase(),
    password: zod_1.default
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
    role: zod_1.default.nativeEnum(user_interface_1.IUserRole).default(user_interface_1.IUserRole.USER).optional(),
    phone: zod_1.default
        .string({ message: "Phone Number must be string" })
        .regex(/^(?:01\d{9})$/, {
        message: "Phone number must be valid for Bangladesh. Format:01XXXXXXXXX",
    })
        .optional(),
    gender: zod_1.default.nativeEnum(user_interface_1.IUserGender).optional(),
    profilePhoto: zod_1.default
        .string()
        .url({ message: "Profile photo must be a valid URL" })
        .optional()
        .or(zod_1.default.literal("").transform(() => undefined)),
    bio: zod_1.default
        .string()
        .min(20, { message: "Bio cannot exceed 20 characters" })
        .max(500, { message: "Bio cannot exceed 500 characters" })
        .optional()
        .default(""),
    travelInterests: zod_1.default.array(zod_1.default.string()).optional().default([]),
    visitedCountries: zod_1.default.array(zod_1.default.string()).optional().default([]),
    currentLocation: zod_1.default
        .object({
        city: zod_1.default
            .string()
            .max(50, { message: "City name cannot exceed 50 characters" })
            .optional(),
        country: zod_1.default
            .string()
            .max(50, { message: "Country name cannot exceed 50 characters" })
            .optional(),
    })
        .optional(),
    averageRating: zod_1.default
        .number()
        .min(0, { message: "Rating cannot be less than 0" })
        .max(5, { message: "Rating cannot exceed 5" })
        .default(0)
        .optional(),
    reviewCount: zod_1.default
        .number()
        .min(0, { message: "Review count cannot be negative" })
        .default(0)
        .optional(),
    isVerified: zod_1.default.boolean().default(false).optional(),
    isDeleted: zod_1.default.boolean().default(false).optional(),
})
    .refine((data) => {
    // Only require gender if it's provided (not undefined)
    if (data.gender !== undefined) {
        return Object.values(user_interface_1.IUserGender).includes(data.gender);
    }
    return true;
}, {
    message: "Please provide a valid gender",
    path: ["gender"],
});
exports.updateUserSchema = zod_1.default.object({
    fullname: zod_1.default
        .string()
        .min(2, { message: "Full name must be at least 2 characters" })
        .max(100, { message: "Full name cannot exceed 100 characters" })
        .optional(),
    phone: zod_1.default
        .string({ message: "Phone Number must be string" })
        .regex(/^(?:01\d{9})$/, {
        message: "Phone number must be valid for Bangladesh. Format:01XXXXXXXXX",
    })
        .optional(),
    gender: zod_1.default.nativeEnum(user_interface_1.IUserGender).optional(),
    travelInterests: zod_1.default
        .array(zod_1.default.string({ message: "Travel interest must be string" }))
        .optional(),
    visitedCountries: zod_1.default
        .array(zod_1.default.string({ message: "Visited country name must be string" }))
        .optional(),
    bio: zod_1.default
        .string()
        .min(20, { message: "Bio must be at least 20 characters" })
        .max(500, { message: "Bio cannot exceed 500 characters" })
        .optional(),
    currentLocation: zod_1.default
        .object({
        city: zod_1.default
            .string()
            .max(50, { message: "City name cannot exceed 50 characters" })
            .optional(),
        country: zod_1.default
            .string()
            .max(50, { message: "Country name cannot exceed 50 characters" })
            .optional(),
    })
        .optional(),
});
exports.UserSchemaValidation = {
    createUserSchema: exports.createUserSchema,
    updateUserSchema: exports.updateUserSchema,
};
