import express from "express";
import { IUserRole } from "../user/user.interface";
import { ReviewControllers } from "./review.controller";
import { ReviewValidation } from "./review.validation";
import { validatedRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";

const router = express.Router();

// Create review
router.post(
  "/",
  checkAuth(IUserRole.USER),
  validatedRequest(ReviewValidation.createReviewSchema),
  ReviewControllers.createReview
);

// Update review
router.patch(
  "/:id",
  checkAuth(IUserRole.USER),
  validatedRequest(ReviewValidation.updateReviewSchema),
  ReviewControllers.updateReview
);

// Delete review
router.delete(
  "/:id",
  checkAuth(IUserRole.USER),
  ReviewControllers.deleteReview
);

// Get my given reviews
router.get(
  "/given-reviews",
  checkAuth(IUserRole.USER),
  ReviewControllers.getMyGivenReviews
);

// Get my received reviews
router.get(
  "/received-reviews",
  checkAuth(IUserRole.USER),
  ReviewControllers.getMyReceivedReviews
);

// Get reviews for a specific user (for displaying on profile)
router.get(
  "/user/:userId",
  checkAuth(IUserRole.USER, IUserRole.ADMIN, IUserRole.SUPER_ADMIN),
  ReviewControllers.getUserReviews
);

// Get all reviews (Admin only)
router.get(
  "/",
  // checkAuth(IUserRole.ADMIN, IUserRole.SUPER_ADMIN),
  ReviewControllers.getAllReviews
);

// Get single review by ID
router.get(
  "/:id",
  checkAuth(IUserRole.USER, IUserRole.ADMIN, IUserRole.SUPER_ADMIN),
  ReviewControllers.getReviewById
);

export const ReviewRoutes = router;

/**
 * need to update the logic frontend and backend as required-
1) for travelPlan- creating/update-- need to select start date as 7 day after as today and end date >= start date.
2) travelPlan status-- need to update automatically(initially as Upcoming, start date- ongoing till end date, after end date- completed) without travelPlan status is cancelled.
3) after travelPlan is completed then host and participate can give each other review with rating(own written review- he can edit, delete)
a) show this reviews with rating in particular user profile in a section if have, 
b) after add, edit and delete reviews moment update which particular user average rating and display average rating on user card if have 
c) help to arrange all the reviews that he was given in GivenReviewsPage, and he was got in ReceivedReviewsPage
d) show all reviews in admin dashboard page with filter options and pagination
4) finally you make a wonderfull dashboard page for user-UserDashboardPage and admin - AdminDashboardPage 
*/
