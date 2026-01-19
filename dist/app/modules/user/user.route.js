"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRouters = void 0;
const express_1 = require("express");
const validateRequest_1 = require("../../middlewares/validateRequest");
const user_controller_1 = require("./user.controller");
const user_validation_1 = require("./user.validation");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("./user.interface");
const multer_config_1 = require("../../config/multer.config");
const router = (0, express_1.Router)();
router.post("/register", (0, validateRequest_1.validatedRequest)(user_validation_1.UserSchemaValidation.createUserSchema), user_controller_1.UserControllers.createUser);
router.get("/me", (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.IUserRole)), user_controller_1.UserControllers.getMe);
router.patch("/me", (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.IUserRole)), multer_config_1.multerUpload.single("profilePhoto"), (0, validateRequest_1.validatedRequest)(user_validation_1.UserSchemaValidation.updateUserSchema), user_controller_1.UserControllers.updateUserProfile);
router.get("/my-followers", (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.IUserRole)), user_controller_1.UserControllers.getMyFollowers);
router.get("/my-followings", (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.IUserRole)), user_controller_1.UserControllers.getMyFollowings);
router.get("/dashboard-stats", (0, checkAuth_1.checkAuth)(user_interface_1.IUserRole.USER), user_controller_1.UserControllers.getUserDashboardStats);
router.get("/admin-dashboard-stats", (0, checkAuth_1.checkAuth)(user_interface_1.IUserRole.ADMIN, user_interface_1.IUserRole.SUPER_ADMIN), user_controller_1.UserControllers.getAdminDashboardStats);
router.get("/public-stats", user_controller_1.UserControllers.getPublicStats);
router.post("/follow/:id", (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.IUserRole)), user_controller_1.UserControllers.toggleFollow);
router.get("/", 
// checkAuth(...Object.values(IUserRole)),
user_controller_1.UserControllers.getAllUsers);
router.get("/:id", (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.IUserRole)), user_controller_1.UserControllers.getSingleUser);
router.delete("/:id", (0, checkAuth_1.checkAuth)(user_interface_1.IUserRole.ADMIN, user_interface_1.IUserRole.SUPER_ADMIN), user_controller_1.UserControllers.deleteSingleUser);
exports.UserRouters = router;
