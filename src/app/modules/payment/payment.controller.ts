import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { PaymentServices } from "./payment.service";
import { sendResponse } from "../../utils/sendResponse";
import status from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import { stripe } from "../../config/stripe.config";

/**
 * Create payment intent for subscription purchase
 */
const createPaymentIntent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const userId = decodedToken.userId;
    const { subscriptionId } = req.body;

    const result = await PaymentServices.createPaymentIntent(userId, subscriptionId);

    sendResponse(res, {
      success: true,
      statusCode: status.CREATED,
      message: "Payment intent created successfully",
      data: result,
    });
  }
);

/**
 * Stripe webhook handler
 */
const handleWebhook = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sig = req.headers["stripe-signature"] as string;

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        envVars.STRIPE.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err: any) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        await PaymentServices.handlePaymentSuccess(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await PaymentServices.handlePaymentFailure(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

/**
 * Get user payment history
 */
const getPaymentHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const userId = decodedToken.userId;

    const result = await PaymentServices.getPaymentHistory(userId);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Payment history retrieved successfully",
      data: result.data,
    });
  }
);

/**
 * Get payment by ID
 */
const getPaymentById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const userId = decodedToken.userId;
    const { id } = req.params;

    const result = await PaymentServices.getPaymentById(id, userId);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Payment retrieved successfully",
      data: result.data,
    });
  }
);

export const PaymentControllers = {
  createPaymentIntent,
  handleWebhook,
  getPaymentHistory,
  getPaymentById,
};
