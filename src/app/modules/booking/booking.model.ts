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
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: false,
        },
        bookingId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Booking",
          required: false,
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        phone: {
          type: String,
          required: true,
          trim: true,
          match: [/^(\+8801|01)[3-9]\d{8}$/, "Please provide a valid Bangladesh phone number"],
        },
        gender: {
          type: String,
          enum: ["MALE", "FEMALE"],
          required: true,
        },
        age: {
          type: Number,
          required: true,
          min: 5,
        },
      },
    ],
    bookingStatus: {
      type: String,
      enum: Object.values(IBookingStatus),
      default: IBookingStatus.BOOKED,
    },
    // paymentStatus: {
    //   type: String,
    //   enum: Object.values(IPaymentStatus),
    //   default: IPaymentStatus.PENDING,
    // },
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
