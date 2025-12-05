import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { ISubscription } from "./subscription.interface";
import { Subscription } from "./subscription.model";

const createSubscription = async (payload: Partial<ISubscription>) => {
  const subscription = await Subscription.create(payload);
  return subscription;
};

const getSubscriptionById = async (id: string) => {
  const subscription = await Subscription.findById(id);

  if (!subscription) {
    throw new AppError(status.NOT_FOUND, "Subscription not found");
  }

  return {
    data: subscription,
  };
};

const getAllSubscriptions = async () => {
  const subscriptions = await Subscription.find();

  return {
    data: subscriptions,
  };
};

const deleteSubscription = async (id: string) => {
  const subscription = await Subscription.findByIdAndDelete(id);

  if (!subscription) {
    throw new AppError(status.NOT_FOUND, "Subscription not found");
  }

  return {
    data: subscription,
  };
};

export const SubscriptionServices = {
  createSubscription,
  getSubscriptionById,
  getAllSubscriptions,
  deleteSubscription,
};
