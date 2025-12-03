import mongoose, { Schema, Document } from "mongoose";
import { IBooking, IBookingStatus } from "./booking.interface";
import { IPaymentStatus } from "../payment/payment.interface";

const bookingSchema = new Schema<IBooking>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    travelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TravelPlan",
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: Object.values(IBookingStatus),
      default: IBookingStatus.BOOKED,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(IPaymentStatus),
      default: IPaymentStatus.PENDING,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPeople: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Booking = mongoose.model<IBooking>("Booking", bookingSchema);
