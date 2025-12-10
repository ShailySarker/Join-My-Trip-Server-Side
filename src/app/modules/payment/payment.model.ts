import mongoose, { Schema } from "mongoose";
import { IPayment, IPaymentStatus } from "./payment.interface";

/**
 
const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    travelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TravelPlan",
      // required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      // required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPeople: {
      type: Number,
      // required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: Object.values(IPaymentStatus),
      default: IPaymentStatus.PENDING,
    },
    paymentGatewayData: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

 */
const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // travelId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "TravelPlan",
    // },
    // bookingId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Booking",
    // },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    stripeCustomerId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "usd",
    },
    // totalPeople: {
    //   type: Number,
    //   min: 1,
    // },
    status: {
      type: String,
      enum: Object.values(IPaymentStatus),
      default: IPaymentStatus.PENDING,
    },
    transactionDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
