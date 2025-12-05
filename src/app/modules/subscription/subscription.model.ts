import mongoose, { Schema } from "mongoose";
import {
  ISubscription,
  ISubscriptionPlan,
} from "./subscription.interface";

const subscriptionSchema = new Schema<ISubscription>(
  {
    plan: {
      type: String,
      enum: Object.values(ISubscriptionPlan),
    },
    // status: {
    //   type: String,
    //   enum: Object.values(ISubscriptionPlanStatus),
    //   default: ISubscriptionPlanStatus.WAITING,
    // },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  subscriptionSchema
);
