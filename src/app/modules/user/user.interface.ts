import {
  ISubscriptionPlan,
  ISubscriptionPlanStatus,
} from "../subscription/subscription.interface";
import { ITrevelInterest } from "../travelPlan/travelPlan.interface";
import mongoose from "mongoose";

export enum IUserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum IUserGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export interface IUserSubscriptionInfo {
  subscriptionId?: mongoose.Types.ObjectId;
  plan: ISubscriptionPlan;
  status: ISubscriptionPlanStatus;
  startDate?: Date;
  expireDate?: Date;
}

export interface IUser {
  _id?: string;
  fullname: string;
  email: string;
  password: string;
  role: IUserRole; // default user
  phone?: string;
  gender?: IUserGender;
  age?: number;
  profilePhoto?: string;
  bio?: string;
  travelInterests?: ITrevelInterest[];
  visitedCountries?: string[];
  currentLocation?: {
    city: string;
    country: string;
  };
  averageRating?: number; //default 0 //  User can give each other a review after the trip is completed. User also can edit or delete the review.
  reviewCount?: number; //default 0
  totalProfileViews?: number; //default 0
  myFollowers?: string[];
  myFollowings?: string[];
  subscriptionInfo?: IUserSubscriptionInfo; // Embedded subscription details
  stripeCustomerId?: string; // Stripe customer ID
  isVerified: boolean; // default false
  isDeleted: boolean; // default false
  createdAt?: Date;
  updatedAt?: Date;
}
