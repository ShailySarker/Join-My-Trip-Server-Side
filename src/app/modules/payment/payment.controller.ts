import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { PaymentServices } from "./payment.service";
import { sendResponse } from "../../utils/sendResponse";
import status from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import { stripe } from "../../config/stripe.config";
import { Payment } from "./payment.model";
import mongoose from "mongoose";
import { IPaymentStatus } from "./payment.interface";
import AppError from "../../errorHelpers/AppError";
import { Subscription } from "../subscription/subscription.model";

const createCheckoutSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    // console.log(decodedToken);
    const userId = decodedToken.userId;
    const { subscriptionId } = req.body;
    // console.log(userId, subscriptionId);
    const result = await PaymentServices.createCheckoutSessionService(
      subscriptionId,
      userId
    );

    sendResponse(res, {
      success: true,
      statusCode: status.CREATED,
      message: "Payment checkout session created successfully",
      data: result,
    });
  }
);

const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const rawBody = (req as any).body;

  if (!sig || !rawBody)
    return res.status(400).send("Missing signature or raw body");

  let event;
  try {
    event = await stripe.webhooks.constructEvent(
      rawBody,
      sig,
      envVars.STRIPE.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  await PaymentServices.handleStripeWebhookService(event);
  res.json({ received: true });
};

const getAllPaymentHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await PaymentServices.getAllPaymentHistory();

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "All payment history retrieved successfully",
      data: result.data,
    });
  }
);

const getMyPaymentHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const userId = decodedToken.userId;

    const result = await PaymentServices.getMyPaymentHistory(userId);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Payment history retrieved successfully",
      data: result.data,
    });
  }
);

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
  createCheckoutSession,
  handleWebhook,
  getPaymentById,
  getAllPaymentHistory,
  getMyPaymentHistory,
};
