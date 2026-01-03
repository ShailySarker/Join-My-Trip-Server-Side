import { Router } from "express";
import { validatedRequest } from "../../middlewares/validateRequest";
import { SubscriptionControllers } from "./subscription.controller";
import { SubscriptionSchemaValidation } from "./subscription.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { IUserRole } from "../user/user.interface";

const router = Router();

router.post(
  "/",
  checkAuth(IUserRole.ADMIN, IUserRole.SUPER_ADMIN),
  validatedRequest(SubscriptionSchemaValidation.createSubscriptionSchema),
  SubscriptionControllers.createSubscription
);

router.get(
  "/",
  // checkAuth(IUserRole.USER, IUserRole.ADMIN, IUserRole.SUPER_ADMIN),
  SubscriptionControllers.getAllSubscriptions
);

router.get(
  "/:id",
  checkAuth(IUserRole.ADMIN, IUserRole.SUPER_ADMIN),
  SubscriptionControllers.getSubscriptionById
);

router.delete(
  "/:id",
  checkAuth(IUserRole.ADMIN, IUserRole.SUPER_ADMIN),
  SubscriptionControllers.deleteSubscription
);

export const SubscriptionRouters = router;
