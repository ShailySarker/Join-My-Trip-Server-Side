import { z } from "zod";
import {
  ISubscriptionPlan,
  ISubscriptionPlanStatus,
} from "./subscription.interface";

export const createSubscriptionSchema = z.object({
  plan: z.nativeEnum(ISubscriptionPlan, {
    message: "Subscription plan is required",
  }),
  // status: z.nativeEnum(ISubscriptionPlanStatus, {
  //   message: "Subscription status is required",
  // }),
  amount: z
    .number({ message: "Amount is required" })
    .min(0, "Amount cannot be negative"),
});

export const SubscriptionSchemaValidation = {
  createSubscriptionSchema,
};
