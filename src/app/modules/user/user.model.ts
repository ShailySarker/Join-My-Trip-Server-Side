import mongoose, { Schema, Document } from "mongoose";
import { IUser, IUserGender, IUserRole } from "./user.interface";

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
      // required: true,
    },
    phone: { type: String, trim: true, unique: true },
    gender: { type: String, enum: Object.values(IUserGender) },
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
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      // required: true,
    },
    isVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const User = mongoose.model<IUser>("User", userSchema);
