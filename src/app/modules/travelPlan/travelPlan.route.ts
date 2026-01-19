import { Router } from "express";
import { validatedRequest } from "../../middlewares/validateRequest";
import { TravelPlanControllers } from "./travelPlan.controller";
import { TravelPlanSchemaValidation } from "./travelPlan.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { IUserRole } from "../user/user.interface";
import { multerUpload } from "../../config/multer.config";

const router = Router();

router.post(
  "/",
  checkAuth(IUserRole.USER),
  multerUpload.single("image"),
  validatedRequest(TravelPlanSchemaValidation.createTravelPlanSchema),
  TravelPlanControllers.createTravelPlan
);

router.get(
  "/my-travel-plans",
  checkAuth(IUserRole.USER),
  TravelPlanControllers.getMyTravelPlan
);

router.get("/popular-destinations", TravelPlanControllers.getPopularDestinations);

router.get("/", TravelPlanControllers.getAllTravelPlansPublic);

router.get(
  "/all-travel-plans",
  checkAuth(IUserRole.ADMIN, IUserRole.SUPER_ADMIN),
  TravelPlanControllers.getAllTravelPlansAdmin
);

router.get("/:id", TravelPlanControllers.getTravelPlanById);

router.patch(
  "/approve-tour/:id",
  checkAuth(IUserRole.ADMIN, IUserRole.SUPER_ADMIN),
  TravelPlanControllers.approveTravelPlan
);

router.patch(
  "/cancel-tour/:id",
  checkAuth(IUserRole.USER),
  TravelPlanControllers.cancelTravelPlan
);

router.patch(
  "/:id",
  checkAuth(IUserRole.USER),
  multerUpload.single("image"),
  validatedRequest(TravelPlanSchemaValidation.updateTravelPlanSchema),
  TravelPlanControllers.updateTravelPlan
);

// Participant Management Routes (Pre-booking)
// Add participant to travel plan (host only, before booking)
router.patch(
  "/:id/participants",
  checkAuth(IUserRole.USER),
  validatedRequest(TravelPlanSchemaValidation.addParticipantSchema),
  TravelPlanControllers.addParticipant
);

// Remove participant from travel plan (host only, before booking)
router.patch(
  "/:id/participants/:phone",
  checkAuth(IUserRole.USER),
  TravelPlanControllers.removeParticipant
);

export const TravelPlanRouters = router;
