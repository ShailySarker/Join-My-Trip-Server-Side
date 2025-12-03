import { Router } from "express";
import { AuthControllers } from "./auth.controller";
import { IUserRole } from "../user/user.interface";
import { checkAuth } from "../../middlewares/checkAuth";

const router = Router();

router.post("/login", AuthControllers.credentialsLogin);
router.post("/refresh-token", AuthControllers.getNewAccessToken);
router.post("/logout", AuthControllers.logout);
router.post(
  "/change-password",
  checkAuth(...Object.values(IUserRole)),
  AuthControllers.changePassword
);

export const AuthRoutes = router;
