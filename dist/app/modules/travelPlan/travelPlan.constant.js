"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortableFields = exports.filterableFields = exports.searchableFields = void 0;
exports.searchableFields = [
    "title",
    "description",
    "destination.city",
    "destination.country",
    "departureLocation",
    "arrivalLocation",
];
exports.filterableFields = [
    "travelType",
    "interests",
    "status",
    "isApproved",
    "destination.city",
    "destination.country",
];
exports.sortableFields = [
    "title",
    "startDate",
    "endDate",
    "budget",
    "maxGuest",
    "createdAt",
    "updatedAt",
];
