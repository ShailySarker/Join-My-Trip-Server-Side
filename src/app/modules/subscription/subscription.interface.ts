export enum ISubscriptionPlan {
  FREE = "FREE",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}
export enum ISubscriptionPlanStatus {
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export interface ISubscription {
  plan: ISubscriptionPlan; // default free
  status: ISubscriptionPlanStatus; // default active
  amount: number;
  startDate?: Date;
  endDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
