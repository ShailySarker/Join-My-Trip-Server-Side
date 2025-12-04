import { Router } from "express";
import { UserRouters } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { OtpRoutes } from "../modules/otp/otp.route";
import { TravelPlanRouters } from "../modules/travelPlan/travelPlan.route";

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
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
