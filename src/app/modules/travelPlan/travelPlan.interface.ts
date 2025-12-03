import mongoose from "mongoose";

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

export interface ITravelPlan {
  host: mongoose.Types.ObjectId; //user or admin id
  title: string;
  slug: string;
  description: string;
  images: string[];
  budgetRange: {
    min: number;
    max: number;
    // currency: string;
  };
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
  participants: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}
