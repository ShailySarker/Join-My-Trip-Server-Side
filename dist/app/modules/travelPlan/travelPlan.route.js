"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelPlanRouters = void 0;
const express_1 = require("express");
const validateRequest_1 = require("../../middlewares/validateRequest");
const travelPlan_controller_1 = require("./travelPlan.controller");
const travelPlan_validation_1 = require("./travelPlan.validation");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const multer_config_1 = require("../../config/multer.config");
const router = (0, express_1.Router)();
router.post("/", (0, checkAuth_1.checkAuth)(user_interface_1.IUserRole.USER), multer_config_1.multerUpload.single("image"), (0, validateRequest_1.validatedRequest)(travelPlan_validation_1.TravelPlanSchemaValidation.createTravelPlanSchema), travelPlan_controller_1.TravelPlanControllers.createTravelPlan);
router.get("/my-travel-plans", (0, checkAuth_1.checkAuth)(user_interface_1.IUserRole.USER), travelPlan_controller_1.TravelPlanControllers.getMyTravelPlan);
router.get("/", travelPlan_controller_1.TravelPlanControllers.getAllTravelPlansPublic);
router.get("/all-travel-plans", (0, checkAuth_1.checkAuth)(user_interface_1.IUserRole.ADMIN, user_interface_1.IUserRole.SUPER_ADMIN), travelPlan_controller_1.TravelPlanControllers.getAllTravelPlansAdmin);
router.get("/:id", travelPlan_controller_1.TravelPlanControllers.getTravelPlanById);
router.patch("/approve-tour/:id", (0, checkAuth_1.checkAuth)(user_interface_1.IUserRole.ADMIN, user_interface_1.IUserRole.SUPER_ADMIN), travelPlan_controller_1.TravelPlanControllers.approveTravelPlan);
router.patch("/cancel-tour/:id", (0, checkAuth_1.checkAuth)(user_interface_1.IUserRole.USER), travelPlan_controller_1.TravelPlanControllers.cancelTravelPlan);
router.patch("/:id", (0, checkAuth_1.checkAuth)(user_interface_1.IUserRole.USER), multer_config_1.multerUpload.single("image"), (0, validateRequest_1.validatedRequest)(travelPlan_validation_1.TravelPlanSchemaValidation.updateTravelPlanSchema), travelPlan_controller_1.TravelPlanControllers.updateTravelPlan);
// Participant Management Routes (Pre-booking)
// Add participant to travel plan (host only, before booking)
router.patch("/:id/participants", (0, checkAuth_1.checkAuth)(user_interface_1.IUserRole.USER), (0, validateRequest_1.validatedRequest)(travelPlan_validation_1.TravelPlanSchemaValidation.addParticipantSchema), travelPlan_controller_1.TravelPlanControllers.addParticipant);
// Remove participant from travel plan (host only, before booking)
router.patch("/:id/participants/:phone", (0, checkAuth_1.checkAuth)(user_interface_1.IUserRole.USER), travelPlan_controller_1.TravelPlanControllers.removeParticipant);
exports.TravelPlanRouters = router;
