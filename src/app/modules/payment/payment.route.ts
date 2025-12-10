import { Router } from "express";
import { PaymentControllers } from "./payment.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { IUserRole } from "../user/user.interface";

const router = Router();

router.post(
  "/create-checkout-session",
  checkAuth(IUserRole.USER),
  PaymentControllers.createCheckoutSession
);

router.get(
  "/history",
  checkAuth(IUserRole.USER),
  PaymentControllers.getMyPaymentHistory
);

router.get(
  "/",
  checkAuth(IUserRole.ADMIN, IUserRole.SUPER_ADMIN),
  PaymentControllers.getAllPaymentHistory
);

router.get(
  "/:id",
  checkAuth(IUserRole.USER),
  PaymentControllers.getPaymentById
);

export const PaymentRouters = router;
