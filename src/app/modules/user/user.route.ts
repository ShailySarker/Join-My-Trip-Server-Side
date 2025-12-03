import { Router } from "express";
import { validatedRequest } from "../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { UserSchemaValidation } from "./user.validation";

const router = Router();

router.post(
  "/register",
  validatedRequest(UserSchemaValidation.createUserSchema),
  UserControllers.createUser
);

export const UserRouters = router;
