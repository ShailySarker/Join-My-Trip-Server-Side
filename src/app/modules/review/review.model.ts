import { model, Schema } from "mongoose";
import { IReview } from "./review.interface";

const reviewSchema = new Schema<IReview>(
  {
    revieweeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    travelId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Ensure a user can only review another user once per trip
reviewSchema.index(
  { reviewerId: 1, revieweeId: 1, travelId: 1 },
  { unique: true }
);

export const Review = model<IReview>("Review", reviewSchema);
