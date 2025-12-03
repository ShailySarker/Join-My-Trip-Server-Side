import { ISubscription } from "../subscription/subscription.interface";
import { ITrevelInterest } from "../travelPlan/travelPlan.interface";

export enum IUserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum IUserGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export interface IUser {
  fullname: string;
  email: string;
  password: string;
  role: IUserRole; // default user
  phone?: string;
  gender?: IUserGender;
  profilePhoto?: string;
  bio?: string;
  travelInterests?: ITrevelInterest;
  visitedCountries?: string[];
  currentLocation?: {
    city: string;
    country: string;
  };
  averageRating: number; //default 0 //  User can give each other a review after the trip is completed. User also can edit or delete the review.
  reviewCount: number; //default 0
  // subscription: {
  //   isActive: boolean; // default false
  //   subscriptionPlan?:
  //   expiresAt?: Date;
  // };
  subscription: ISubscription;
  isVerified: boolean; // default false
  isDeleted: boolean; // default false
  createdAt?: Date;
  updatedAt?: Date;
}
