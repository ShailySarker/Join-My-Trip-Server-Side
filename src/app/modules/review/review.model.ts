import mongoose, { Schema } from "mongoose";
import { IReview } from "./review.interface";

const reviewSchema = new Schema<IReview>(
  {
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    travelPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TravelPlan",
      required: true,
    },
    rating: { type: Number, default: 0, min: 0, max: 5, required: true },
    comment: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Review = mongoose.model<IReview>("Review", reviewSchema);
