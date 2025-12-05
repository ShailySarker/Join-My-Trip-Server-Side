import { Router } from "express";
import { PaymentControllers } from "./payment.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { IUserRole } from "../user/user.interface";

const router = Router();

// Create payment intent (User only)
router.post(
  "/create-intent",
  checkAuth(IUserRole.USER),
  PaymentControllers.createPaymentIntent
);

// Stripe webhook (No auth required - Stripe verified)
// IMPORTANT: This route needs raw body, configure in main app
router.post("/webhook", PaymentControllers.handleWebhook);

// Get payment history
router.get(
  "/history",
  checkAuth(IUserRole.USER),
  PaymentControllers.getPaymentHistory
);

// Get payment by ID
router.get(
  "/:id",
  checkAuth(IUserRole.USER),
  PaymentControllers.getPaymentById
);

export const PaymentRouters = router;
