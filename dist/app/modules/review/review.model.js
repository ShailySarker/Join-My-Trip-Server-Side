"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const mongoose_1 = require("mongoose");
const reviewSchema = new mongoose_1.Schema({
    revieweeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reviewerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    travelId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "TravelPlan",
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: true,
        trim: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
// Ensure a user can only review another user once per trip
reviewSchema.index({ reviewerId: 1, revieweeId: 1, travelId: 1 }, { unique: true });
exports.Review = (0, mongoose_1.model)("Review", reviewSchema);
