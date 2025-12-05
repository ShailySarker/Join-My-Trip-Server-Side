import mongoose from "mongoose";
import { IPaymentStatus } from "../payment/payment.interface";
import { IParticipantDetails } from "../travelPlan/travelPlan.interface";

export enum IBookingStatus {
  BOOKED = "BOOKED",
  CANCELLED = "CANCELLED",
}

export interface IBooking {
  userId: mongoose.Types.ObjectId; // The user who made the booking
  travelId: mongoose.Types.ObjectId; // Reference to the travel plan
  participants: IParticipantDetails[]; // All participants included in this booking
  bookingStatus: IBookingStatus; // default booked
  // paymentStatus: IPaymentStatus; // default pending
  amount: number;
  totalPeople: number; // Should equal participants.length
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Booking Workflow:
 * 1. When creating a booking, user must provide participants array with details
 * 2. System validates each participant (age, phone format, etc.)
 * 3. System checks if total participants don't exceed available seats
 * 4. All participants are added to both booking and travel plan
 * 5. Users can add/remove participants after booking (within limits)
 */