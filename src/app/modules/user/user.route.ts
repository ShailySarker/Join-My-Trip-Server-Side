import { Router } from "express";
import { validatedRequest } from "../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { UserSchemaValidation } from "./user.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { IUserRole } from "./user.interface";
import { multerUpload } from "../../config/multer.config";

const router = Router();

router.post(
  "/register",
  validatedRequest(UserSchemaValidation.createUserSchema),
  UserControllers.createUser
);
router.get(
  "/me",
  checkAuth(...Object.values(IUserRole)),
  UserControllers.getMe
);
router.patch(
  "/me",
  checkAuth(...Object.values(IUserRole)),
  multerUpload.single("profilePhoto"),
  validatedRequest(UserSchemaValidation.updateUserSchema),
  UserControllers.updateUserProfile
);

router.get(
  "/",
  checkAuth(...Object.values(IUserRole)),
  UserControllers.getAllUsers
);

router.get(
  "/:id",
  checkAuth(...Object.values(IUserRole)),
  UserControllers.getSingleUser
);
router.delete(
  "/:id",
  checkAuth(IUserRole.ADMIN, IUserRole.SUPER_ADMIN),
  UserControllers.deleteSingleUser
);

export const UserRouters = router;
