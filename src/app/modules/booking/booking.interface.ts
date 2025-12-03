import mongoose from "mongoose";
import { IPaymentStatus } from "../payment/payment.interface";

export enum IBookingStatus {
  BOOKED = "BOOKED",
  CANCELLED = "CANCELLED",
}

export interface IBooking {
  userId: mongoose.Types.ObjectId;
  travelId: mongoose.Types.ObjectId;
  bookingStatus: IBookingStatus; // default booked
  paymentStatus: IPaymentStatus; // default pending
  amount: number;
  totalPeople: number;
  createdAt?: Date;
  updatedAt?: Date;
}
