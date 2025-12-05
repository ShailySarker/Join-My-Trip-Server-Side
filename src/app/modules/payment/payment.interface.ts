import mongoose from "mongoose";

export enum IPaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

// userId: mongoose.Types.ObjectId; //subscription id , here we found
//   travelId?: mongoose.Types.ObjectId;
//   bookingId?: mongoose.Types.ObjectId;
//   subscriptionId: mongoose.Types.ObjectId;
//   amount: number;
// totalPeople?: number;
//   status: IPaymentStatus; //default pending
//   //   stripeSubscriptionId?: string;
//   //   stripeCustomerId?: string;
//   paymentGatewayData?: any;
export interface IPayment {
  userId: mongoose.Types.ObjectId;
  travelId?: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  stripePaymentIntentId: string;
  stripeCustomerId?: string;
  amount: number;
  currency: string;
  totalPeople?: number;
  status: IPaymentStatus;
  transactionDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
