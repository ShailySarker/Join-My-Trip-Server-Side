import { NextFunction, Request, Response, Router } from "express";
import { AuthControllers } from "./auth.controller";
import { IUserRole } from "../user/user.interface";
import { checkAuth } from "../../middlewares/checkAuth";
import { envVars } from "../../config/env";
import passport from "passport";

const router = Router();

router.post("/login", AuthControllers.credentialsLogin);
router.post("/refresh-token", AuthControllers.getNewAccessToken);
router.post("/logout", AuthControllers.logout);
router.post(
  "/change-password",
  checkAuth(...Object.values(IUserRole)),
  AuthControllers.changePassword,
);

router.post(
  "/set-password",
  checkAuth(...Object.values(IUserRole)),
  AuthControllers.setPassword,
);
router.post("/forgot-password", AuthControllers.forgotPassword);
router.post(
  "/reset-password",
  checkAuth(...Object.values(IUserRole)),
  AuthControllers.resetPassword,
);

router.get(
  "/google",
  async (req: Request, res: Response, next: NextFunction) => {
    const redirect = req.query.redirect || "/";
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: redirect as string,
    })(req, res, next);
  },
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    //     failureRedirect: `${envVars.FRONTEND.FRONTEND_URL}/login?error=There is some issues with your account. Please contact with out support team!`,
    failureRedirect: `${envVars.NODE_ENV === "production" ? envVars.FRONTEND.FRONTEND_URL : envVars.FRONTEND.FRONTEND_URL_LOCAL}/login?error=There is some issues with your account. Please contact with out support team!`,
  }),
  AuthControllers.googleCallback,
);

export const AuthRoutes = router;
