import { Router } from "express";
import { UserRouters } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { OtpRoutes } from "../modules/otp/otp.route";
import { TravelPlanRouters } from "../modules/travelPlan/travelPlan.route";
import { SubscriptionRouters } from "../modules/subscription/subscription.route";
import { PaymentRouters } from "../modules/payment/payment.route";
import { BookingRoutes } from "../modules/booking/booking.route";
import { ReviewRoutes } from "../modules/review/review.route";
import { ContactRoutes } from "../modules/contact/contact.route";

export const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    route: UserRouters,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/otp",
    route: OtpRoutes,
  },
  {
    path: "/travel-plan",
    route: TravelPlanRouters,
  },
  {
    path: "/subscription",
    route: SubscriptionRouters,
  },
  {
    path: "/payment",
    route: PaymentRouters,
  },
  {
    path: "/bookings",
    route: BookingRoutes,
  },
  {
    path: "/reviews",
    route: ReviewRoutes,
  },
  {
    path: "/contact",
    route: ContactRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
