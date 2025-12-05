import { Router } from "express";
import { ReviewControllers } from "./review.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { IUserRole } from "../user/user.interface";
import { validatedRequest } from "../../middlewares/validateRequest";
import { ReviewValidations } from "./review.validation";

const router = Router();

// Get all reviews (Admin only)
router.get(
  "/",
  checkAuth(IUserRole.ADMIN, IUserRole.SUPER_ADMIN),
  ReviewControllers.getAllReviews
);

// Create review (USER only)
router.post(
  "/",
  checkAuth(IUserRole.USER),
  validatedRequest(ReviewValidations.createReviewSchema),
  ReviewControllers.createReview
);

// Update review (USER only, must be owner)
router.patch(
  "/:id",
  checkAuth(IUserRole.USER),
  validatedRequest(ReviewValidations.updateReviewSchema),
  ReviewControllers.updateReview
);

// Delete review (USER only, must be owner)
router.delete(
  "/:id",
  checkAuth(IUserRole.USER),
  ReviewControllers.deleteReview
);

// Get reviews I gave (written by current user)
router.get(
  "/my-given-reviews",
  checkAuth(IUserRole.USER),
  ReviewControllers.getMyGivenReviews
);

// Get reviews I received (written for current user)
router.get(
  "/my-getting-reviews",
  checkAuth(IUserRole.USER),
  ReviewControllers.getMyGettingReviews
);

// Get reviews for a specific user (public)
router.get("/user/:userId", ReviewControllers.getUserReviews);

export const ReviewRoutes = router;
