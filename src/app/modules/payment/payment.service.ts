import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { IPayment, IPaymentStatus } from "./payment.interface";
import { Payment } from "./payment.model";
import { stripe } from "../../config/stripe.config";
import { User } from "../user/user.model";
import { Subscription } from "../subscription/subscription.model";
import {
  ISubscriptionPlan,
  ISubscriptionPlanStatus,
} from "../subscription/subscription.interface";
import mongoose from "mongoose";
import { envVars } from "../../config/env";
import { IUser } from "../user/user.interface";
import { calculateExpireDate } from "../../utils/calculateExpireDate";

const createCheckoutSessionService = async (
  subscriptionId: string,
  userId: string
) => {
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) throw new Error("Subscription plan not found");

  const userData = await User.findById(userId);
  if (!userData) throw new Error("User not found");

  // Check if user already has a Stripe customer
  let customer;
  if (userData.stripeCustomerId) {
    customer = await stripe.customers.retrieve(userData.stripeCustomerId);
  } else {
    customer = await stripe.customers.create({
      email: userData.email,
      name: userData.fullname,
      metadata: { userId: userId.toString() },
    });

    // Save customer ID to user
    await User.findByIdAndUpdate(userId, {
      stripeCustomerId: customer.id,
    });
  }

  // Calculate expiration date based on subscription type
  const now = new Date();
  let expireDate = new Date(now);

  if (subscription.plan.toLowerCase().includes("monthly")) {
    expireDate.setDate(now.getDate() + 30); // 30 days for monthly
  } else if (subscription.plan.toLowerCase().includes("yearly")) {
    expireDate.setDate(now.getDate() + 365); // 365 days for yearly
  } else {
    expireDate.setDate(now.getDate() + 30); // default to 30 days
  }

    const frontendUrl =
      envVars.NODE_ENV === "production"
        ? envVars.FRONTEND.FRONTEND_URL
        : envVars.FRONTEND.FRONTEND_URL_LOCAL;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer: customer.id,
      // customer_details: { name: userData.fullname, phone: userData?.phone },
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: `Plan: ${subscription.plan}`,
              description: `Payment for ${subscription.plan} plan - Valid for ${
                subscription.plan.toLowerCase().includes("monthly")
                  ? "30 days"
                  : "1 year"
              }`,
            },
            unit_amount: subscription.amount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/dashboard/payment/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/dashboard/payment/payment-failed`,
    metadata: {
      userId: userId.toString(),
      subscriptionId: subscriptionId.toString(),
      subscriptionPlan: subscription.plan,
      expireDate: expireDate.toISOString(),
    },
  });

  const paymentDoc = await Payment.create({
    userId: new mongoose.Types.ObjectId(userId),
    subscriptionId: new mongoose.Types.ObjectId(subscriptionId),
    stripePaymentIntentId: session.id,
    stripeCustomerId: customer.id,
    amount: subscription.amount,
    currency: "bdt",
    status: IPaymentStatus.PENDING,
    // expireDate: expireDate,
  });
  return session.url;
};

const handleStripeWebhookService = async (event: any) => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      // Parse expireDate from metadata
      const expireDate = session.metadata.expireDate
        ? new Date(session.metadata.expireDate)
        : calculateExpireDate(session.metadata.subscriptionPlan);

      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: session.id },
        {
          status: IPaymentStatus.COMPLETED,
          stripeCustomerId: session.customer,
          transactionDate: new Date(),
          expireDate: expireDate,
        }
      );

      await User.findOneAndUpdate(
        { _id: session.metadata.userId },
        {
          stripeCustomerId: session.customer,
          subscriptionInfo: {
            subscriptionId: new mongoose.Types.ObjectId(
              session.metadata.subscriptionId
            ),
            plan: session.metadata.subscriptionPlan,
            status: ISubscriptionPlanStatus.ACTIVE,
            startDate: new Date(),
            expireDate: expireDate,
          },
        }
      );
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      const customer = invoice.customer;
      const amountPaid = invoice.amount_paid;
      await Payment.findOneAndUpdate(
        { stripeCustomerId: customer },
        {
          subscriptionId,
          amount: amountPaid / 100,
          currency: invoice.currency,
          status: IPaymentStatus.COMPLETED,
          transactionDate: new Date(),
        }
      );
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      await Payment.findOneAndUpdate(
        { stripeCustomerId: invoice.customer },
        { status: IPaymentStatus.FAILED }
      );
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
};

const getMyPaymentHistory = async (userId: string) => {
  const payments = await Payment.find({ userId: userId })
    .populate("subscriptionId", "plan amount")
    .sort({ createdAt: -1 });

  return {
    data: payments,
  };
};
const getAllPaymentHistory = async () => {
  const payments = await Payment.find()
    .populate({
      path: "userId",
      select: "fullname email profilePhoto",
    })
    .populate({
      path: "subscriptionId",
      select: "plan amount",
    })
    .sort({ createdAt: -1 })
    .lean();

  return {
    data: payments,
  };
};

const getPaymentById = async (id: string, userId: string) => {
  const payment = await Payment.findOne({ _id: id, userId: userId }).populate(
    "subscriptionId",
    "plan amount"
  );

  if (!payment) {
    throw new AppError(status.NOT_FOUND, "Payment not found");
  }

  return {
    data: payment,
  };
};

export const PaymentServices = {
  getPaymentById,
  createCheckoutSessionService,
  handleStripeWebhookService,
  getMyPaymentHistory,
  getAllPaymentHistory,
};
