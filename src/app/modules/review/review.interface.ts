import mongoose from "mongoose";

export interface IReview {
  reviewerId: mongoose.Types.ObjectId; // who give the review
  reviewedUserId: mongoose.Types.ObjectId; // who get the review
  travelPlanId: mongoose.Types.ObjectId; // for which plan
  rating: number;
  comment: string;
  createdAt?: Date;
  updatedAt?: Date;
}
