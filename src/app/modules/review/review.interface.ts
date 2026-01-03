import { Types } from "mongoose";

export interface IReview {
  revieweeId: Types.ObjectId; // User receiving the review
  reviewerId: Types.ObjectId; // User giving the review
  travelId: Types.ObjectId; // The trip context
  rating: number; // 1 to 5
  comment: string;
  createdAt?: Date;
  updatedAt?: Date;
}
