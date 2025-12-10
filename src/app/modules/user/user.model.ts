import mongoose, { Schema, Document } from "mongoose";
import { IUser, IUserGender, IUserRole } from "./user.interface";
import {
  ISubscriptionPlan,
  ISubscriptionPlanStatus,
} from "../subscription/subscription.interface";

const userSchema = new Schema<IUser>(
  {
    fullname: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(IUserRole),
      default: IUserRole.USER,
    },
    phone: { type: String, trim: true },
    gender: { type: String, enum: Object.values(IUserGender) },
    age: { type: Number, min: 18 },
    profilePhoto: { type: String, default: null },
    bio: { type: String, default: "" },
    travelInterests: { type: [String], default: [] },
    visitedCountries: { type: [String], default: [] },
    currentLocation: {
      city: { type: String },
      country: { type: String },
    },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    totalProfileViews: { type: Number, default: 0 },
    myFollowers: { type: [String], default: [] },
    myFollowings: { type: [String], default: [] },
    subscriptionInfo: {
      subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscription",
      },
      plan: {
        type: String,
        enum: Object.values(ISubscriptionPlan),
      },
      status: {
        type: String,
        enum: Object.values(ISubscriptionPlanStatus),
        // default: ISubscriptionPlanStatus.ACTIVE,
      },
      startDate: Date,
      expireDate: Date,
    },
    stripeCustomerId: { type: String },
    isVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const User = mongoose.model<IUser>("User", userSchema);
