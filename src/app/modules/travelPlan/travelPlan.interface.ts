import mongoose from "mongoose";
import { IUserGender } from "../user/user.interface";

export enum ITravelType {
  SOLO = "SOLO",
  FAMILY = "FAMILY",
  FRIENDS = "FRIENDS",
  COUPLE = "COUPLE",
}

export enum ITrevelInterest {
  HIKING = "HIKING",
  BEACH = "BEACH",
  CULTURAL = "CULTURAL",
  ADVENTURE = "ADVENTURE",
  NATURE = "NATURE",
  WILDLIFE = "WILDLIFE",
  ROAD_TRIPS = "ROAD_TRIPS",
  HISTORICAL = "HISTORICAL",
  CAMPING = "CAMPING",
  NIGHTLIFE_EXPLORATION = "NIGHTLIFE_EXPLORATION",
  LUXURY_TRAVEL = "LUXURY_TRAVEL",
  CITY_EXPLORATION = "CITY_EXPLORATION",
  VILLAGE_LIFE = "VILLAGE_LIFE",
  PHOTOGRAPHY = "PHOTOGRAPHY",
  FOOD_FESTIVAL = "FOOD_FESTIVAL",
  SHOPPING = "SHOPPING",
  RELAXATION = "RELAXATION",
  INTERNATIONAL = "INTERNATIONAL",
}

export enum ITrevelStatus {
  UPCOMING = "UPCOMING",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum ITrevelIsApproved {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface IParticipantDetails {
  userId?: mongoose.Types.ObjectId; // Reference to User if participant is a registered user
  bookingId?: mongoose.Types.ObjectId; // Reference to Booking that added this participant
  name: string;
  phone: string; // Bangladesh phone number
  gender: IUserGender;
  age: number;
}

export interface ITravelPlan {
  host: mongoose.Types.ObjectId; //user or admin id
  title: string;
  slug: string;
  description: string;
  image: string;
  // budgetRange: {
  //   min: number;
  //   max: number;
  //   // currency: string;
  // };
  budget: number;
  destination: {
    city: string;
    country: string;
  };
  departureLocation?: string;
  arrivalLocation?: string;
  included?: string[];
  excluded?: string[];
  startDate: Date;
  endDate: Date;
  travelType: ITravelType;
  interests: ITrevelInterest[];
  status: ITrevelStatus; //default upcoming
  maxGuest: number;
  minAge: number;
  isApproved: ITrevelIsApproved; //default PENDING -- only admin can approve
  participants: IParticipantDetails[]; // Array of participant details (can include registered users or outsiders)
  createdAt?: Date;
  updatedAt?: Date;
}
