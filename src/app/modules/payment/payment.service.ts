import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { IPayment, IPaymentStatus } from "./payment.interface";
import { Payment } from "./payment.model";
import { stripe } from "../../config/stripe.config";
import { User } from "../user/user.model";
import { Subscription } from "../subscription/subscription.model";
import { ISubscriptionPlan, ISubscriptionPlanStatus } from "../subscription/subscription.interface";

/**
 * Create Stripe Payment Intent for subscription purchase
 */
const createPaymentIntent = async (userId: string, subscriptionId: string) => {
  // 1. Get subscription details
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throw new AppError(status.NOT_FOUND, "Subscription plan not found");
  }

  // 2. Get user details
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // 3. Create or get Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.fullname,
      metadata: {
        userId: userId,
      },
    });
    customerId = customer.id;

    // Save Stripe customer ID to user
    await User.findByIdAndUpdate(userId, {
      stripeCustomerId: customerId,
    });
  }

  // 4. Create Stripe Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(subscription.amount * 100), // Convert to cents
    currency: "usd",
    customer: customerId,
    metadata: {
      userId,
      subscriptionId,
      plan: subscription.plan,
    },
    description: `Subscription: ${subscription.plan}`,
  });

  // 5. Create payment record
  const payment = await Payment.create({
    userId: userId,
    subscriptionId: subscriptionId,
    stripePaymentIntentId: paymentIntent.id,
    stripeCustomerId: customerId,
    amount: subscription.amount,
    currency: "usd",
    status: IPaymentStatus.PENDING,
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: payment._id,
    amount: subscription.amount,
  };
};

/**
 * Handle successful payment - Update user subscription
 */
const handlePaymentSuccess = async (paymentIntent: any) => {
  const { userId, subscriptionId, plan } = paymentIntent.metadata;

  // 1. Update payment status
  await Payment.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntent.id },
    {
      status: IPaymentStatus.COMPLETED,
      transactionDate: new Date(),
    }
  );

  // 2. Calculate subscription dates
  const startDate = new Date();
  const expireDate = new Date();

  if (plan === ISubscriptionPlan.MONTHLY) {
    expireDate.setMonth(expireDate.getMonth() + 1);
  } else if (plan === ISubscriptionPlan.YEARLY) {
    expireDate.setFullYear(expireDate.getFullYear() + 1);
  }

  // 3. Update user subscription info
  await User.findByIdAndUpdate(userId, {
    subscriptionInfo: {
      subscriptionId,
      plan,
      status: ISubscriptionPlanStatus.ACTIVE,
      startDate,
      expireDate,
    },
  });

  console.log(`✅ Payment successful for user ${userId}, subscription activated`);
};

/**
 * Handle failed payment
 */
const handlePaymentFailure = async (paymentIntent: any) => {
  await Payment.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntent.id },
    {
      status: IPaymentStatus.FAILED,
    }
  );

  console.log(`❌ Payment failed for payment intent ${paymentIntent.id}`);
};

/**
 * Get user payment history
 */
const getPaymentHistory = async (userId: string) => {
  const payments = await Payment.find({ userId: userId })
    .populate("subscriptionId", "plan amount")
    .sort({ createdAt: -1 });

  return {
    data: payments,
  };
};

/**
 * Get payment by ID
 */
const getPaymentById = async (id: string, userId: string) => {
  const payment = await Payment.findOne({ _id: id, userId: userId })
    .populate("subscriptionId", "plan amount");

  if (!payment) {
    throw new AppError(status.NOT_FOUND, "Payment not found");
  }

  return {
    data: payment,
  };
};

export const PaymentServices = {
  createPaymentIntent,
  handlePaymentSuccess,
  handlePaymentFailure,
  getPaymentHistory,
  getPaymentById,
};
