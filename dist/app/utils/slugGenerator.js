"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueSlug = exports.generateSlug = void 0;
/**
 * Generate URL-friendly slug from title
 * @param title - The title string to convert to slug
 * @returns URL-friendly slug
 */
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};
exports.generateSlug = generateSlug;
/**
 * Generate unique slug by appending timestamp if needed
 * @param baseSlug - The base slug
 * @returns Unique slug
 */
const generateUniqueSlug = (baseSlug) => {
    const timestamp = Date.now().toString(36); // Convert timestamp to base36
    return `${baseSlug}-${timestamp}`;
};
exports.generateUniqueSlug = generateUniqueSlug;
