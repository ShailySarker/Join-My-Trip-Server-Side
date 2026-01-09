import express, { type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import httpStatus from "http-status";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import cors from "cors";
import { envVars } from "./app/config/env";
import { router } from "./app/routes";
import { PaymentControllers } from "./app/modules/payment/payment.controller";
import bodyParser from "body-parser";
import {
  checkSubscriptionExpiry,
  startSubscriptionCronJob,
  checkSubscriptionReminders,
} from "./app/utils/subscriptionManagement";
import { updateTravelPlanStatuses } from "./app/utils/updateTravelPlanStatuses";

const app = express();

app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  PaymentControllers.handleWebhook
);

app.use(cookieParser());
app.use(express.json()); //for json data parse
app.set("trust proxy", 1); //all external live links's proxy will trust
app.use(express.urlencoded({ extended: true })); //for form data

app.use(
  cors({
    origin: envVars.FRONTEND.FRONTEND_URL,
    credentials: true,
  })
);

// 1. Daily Travel Plan Status Update (Schedule: 0 0 * * *)
app.get("/api/v1/cron/travel-status", async (req, res) => {
  try {
    console.log(
      "CRON: Updating travel plan statuses...",
      new Date().toISOString()
    );
    await updateTravelPlanStatuses();

    // Also check for subscription reminders daily
    console.log("CRON: Checking subscription reminders...");
    try {
      await checkSubscriptionReminders();
    } catch (reminderError: any) {
      console.error("CRON Reminder Error:", reminderError);
    }

    // Return JSON response to avoid "Response data too big" error from HTML 504s
    return res.status(200).json({
      success: true,
      message: "Travel statuses updated and reminders checked",
    });
  } catch (e: any) {
    console.error("CRON Error:", e);
    // Return 200 even on error to stop cron retries (which cause 429s), but indicate failure in body
    return res
      .status(200)
      .json({ success: false, error: e.message || "Internal Server Error" });
  }
});

// 2. Hourly Subscription Expiry Check (Schedule: 0 * * * *)
app.get("/api/v1/cron/subscription-check", async (req, res) => {
  try {
    console.log(
      "CRON: Checking subscription expiry...",
      new Date().toISOString()
    );
    await checkSubscriptionExpiry();
    // Return JSON response
    return res
      .status(200)
      .json({ success: true, message: "Subscription expiry checked" });
  } catch (e: any) {
    console.error("CRON Error:", e);
    // Return 200 even on error to stop cron retries
    return res
      .status(200)
      .json({ success: false, error: e.message || "Internal Server Error" });
  }
});

app.use("/api/v1/", router);

app.get("/", (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    message: "Welcome to Join My Trip Server!",
  });
});

// global error handler
app.use(globalErrorHandler);

// not found route
app.use(notFound);

export default app;
