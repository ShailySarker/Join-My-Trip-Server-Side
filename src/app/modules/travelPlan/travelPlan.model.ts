import mongoose, { Schema, Document } from "mongoose";
import {
  ITravelPlan,
  ITravelType,
  ITrevelInterest,
  ITrevelIsApproved,
  ITrevelStatus,
} from "./travelPlan.interface";

const travelPlanSchema = new Schema<ITravelPlan>(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: { type: String, required: true },
    image: { type: String, required: true },
    // budgetRange: {
    //   min: {
    //     type: Number,
    //     required: true,
    //     min: 0,
    //   },
    //   max: {
    //     type: Number,
    //     required: true,
    //     min: 0,
    //   },
    // },
    budget: { type: Number, required: true },
    destination: {
      city: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
    },
    departureLocation: { type: String },
    arrivalLocation: { type: String },
    included: { type: [String], default: [] },
    excluded: { type: [String], default: [] },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    travelType: {
      type: String,
      enum: Object.values(ITravelType),
      required: true,
    },
    interests: {
      type: [String],
      enum: Object.values(ITrevelInterest),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ITrevelStatus),
      default: ITrevelStatus.UPCOMING,
    },
    maxGuest: {
      type: Number,
      required: true,
      min: 1,
    },
    minAge: {
      type: Number,
      default: 18,
      min: 5,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    isApproved: {
      type: String,
      enum: Object.values(ITrevelIsApproved),
      default: ITrevelIsApproved.PENDING,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const TravelPlan = mongoose.model<ITravelPlan>(
  "TravelPlan",
  travelPlanSchema
);
