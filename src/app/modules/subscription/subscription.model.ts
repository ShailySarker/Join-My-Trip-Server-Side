import mongoose, { Schema } from "mongoose";
import {
  ISubscription,
  ISubscriptionPlan,
  ISubscriptionPlanStatus,
} from "./subscription.interface";

const subscriptionSchema = new Schema<ISubscription>(
  {
    plan: {
      type: String,
      enum: Object.values(ISubscriptionPlan),
      default: ISubscriptionPlan.FREE,
    },
    status: {
      type: String,
      enum: Object.values(ISubscriptionPlanStatus),
      default: ISubscriptionPlanStatus.ACTIVE,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Booking = mongoose.model<ISubscription>(
  "Subscription",
  subscriptionSchema
);
