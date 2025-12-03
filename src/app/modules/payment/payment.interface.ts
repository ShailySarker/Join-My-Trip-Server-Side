import mongoose from "mongoose";

export enum IPaymentStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export interface IPayment {
  userId: mongoose.Types.ObjectId; //subscription id , here we found
  travelId?: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  amount: number;
  totalPeople?: number;
  status: IPaymentStatus; //default pending
  //   stripeSubscriptionId?: string;
  //   stripeCustomerId?: string;
  paymentGatewayData?: any;
  //   currency: string;
  createdAt?: Date;
  updatedAt?: Date;
}
