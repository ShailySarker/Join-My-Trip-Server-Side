import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { IReview } from "./review.interface";
import { Review } from "./review.model";
import { TravelPlan } from "../travelPlan/travelPlan.model";
import { User } from "../user/user.model";
import { ITrevelStatus } from "../travelPlan/travelPlan.interface";

/**
 * Helper function to update user's average rating and review count
 */
const updateUserRating = async (userId: string) => {
  const reviews = await Review.find({ reviewedUserId: userId });

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

  await User.findByIdAndUpdate(userId, {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    reviewCount: reviews.length,
  });
};

/**
 * Create a review for a user after completing a travel plan
 */
const createReview = async (
  reviewerId: string,
  payload: Partial<IReview>
) => {
  const { reviewedUserId, travelPlanId, rating, comment } = payload;

  // 1. Validate cannot review self
  if (reviewerId === reviewedUserId!.toString()) {
    throw new AppError(status.BAD_REQUEST, "You cannot review yourself");
  }

  // 2. Validate travel plan exists and is completed
  const travelPlan = await TravelPlan.findById(travelPlanId);
  if (!travelPlan) {
    throw new AppError(status.NOT_FOUND, "Travel plan not found");
  }

  if (travelPlan.status !== ITrevelStatus.COMPLETED) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot create review - travel plan must be completed first"
    );
  }

  // 3. Validate reviewer was a participant
  const isParticipant = travelPlan.participants.some(
    (participant) => participant.toString() === reviewerId
  );

  if (!isParticipant) {
    throw new AppError(
      status.FORBIDDEN,
      "You were not a participant in this travel plan"
    );
  }

  // 4. Validate reviewed user was also a participant
  const isReviewedUserParticipant = travelPlan.participants.some(
    (participant) => participant.toString() === reviewedUserId!.toString()
  );

  if (!isReviewedUserParticipant) {
    throw new AppError(
      status.BAD_REQUEST,
      "The user you are trying to review was not a participant in this trip"
    );
  }

  // 5. Check for duplicate review
  const existingReview = await Review.findOne({
    reviewerId,
    reviewedUserId,
    travelPlanId,
  });

  if (existingReview) {
    throw new AppError(
      status.BAD_REQUEST,
      "You have already reviewed this user for this travel plan"
    );
  }

  // 6. Create review
  const review = await Review.create({
    reviewerId,
    reviewedUserId,
    travelPlanId,
    rating,
    comment,
  });

  // 7. Update reviewed user's rating
  await updateUserRating(reviewedUserId!.toString());

  const populatedReview = await Review.findById(review._id)
    .populate("reviewerId", "fullname email profilePhoto")
    .populate("reviewedUserId", "fullname email profilePhoto")
    .populate("travelPlanId", "title destination startDate endDate");

  return {
    data: populatedReview,
  };
};

/**
 * Update a review (only by the reviewer)
 */
const updateReview = async (
  reviewId: string,
  reviewerId: string,
  payload: Partial<IReview>
) => {
  const { rating, comment } = payload;

  // 1. Find review
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError(status.NOT_FOUND, "Review not found");
  }

  // 2. Validate ownership
  if (review.reviewerId.toString() !== reviewerId) {
    throw new AppError(
      status.FORBIDDEN,
      "You can only edit your own reviews"
    );
  }

  // 3. Update review
  const updatedReview = await Review.findByIdAndUpdate(
    reviewId,
    { rating, comment },
    { new: true, runValidators: true }
  )
    .populate("reviewerId", "fullname email profilePhoto")
    .populate("reviewedUserId", "fullname email profilePhoto")
    .populate("travelPlanId", "title destination startDate endDate");

  // 4. Update reviewed user's rating
  await updateUserRating(review.reviewedUserId.toString());

  return {
    data: updatedReview,
  };
};

/**
 * Delete a review (only by the reviewer)
 */
const deleteReview = async (reviewId: string, reviewerId: string) => {
  // 1. Find review
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError(status.NOT_FOUND, "Review not found");
  }

  // 2. Validate ownership
  if (review.reviewerId.toString() !== reviewerId) {
    throw new AppError(
      status.FORBIDDEN,
      "You can only delete your own reviews"
    );
  }

  const reviewedUserId = review.reviewedUserId.toString();

  // 3. Delete review
  await Review.findByIdAndDelete(reviewId);

  // 4. Update reviewed user's rating
  await updateUserRating(reviewedUserId);

  return {
    message: "Review deleted successfully",
  };
};

/**
 * Get all reviews for a specific user
 */
const getUserReviews = async (userId: string) => {
  const reviews = await Review.find({ reviewedUserId: userId })
    .populate("reviewerId", "fullname email profilePhoto")
    .populate("travelPlanId", "title destination startDate endDate")
    .sort({ createdAt: -1 });

  return {
    data: reviews,
  };
};

/**
 * Get all reviews written by the current user (reviews I gave)
 */
const getMyGivenReviews = async (reviewerId: string) => {
  const reviews = await Review.find({ reviewerId })
    .populate("reviewedUserId", "fullname email profilePhoto")
    .populate("travelPlanId", "title destination startDate endDate")
    .sort({ createdAt: -1 });

  return {
    data: reviews,
  };
};

/**
 * Get all reviews received by the current user (reviews I got)
 */
const getMyGettingReviews = async (userId: string) => {
  const reviews = await Review.find({ reviewedUserId: userId })
    .populate("reviewerId", "fullname email profilePhoto")
    .populate("travelPlanId", "title destination startDate endDate")
    .sort({ createdAt: -1 });

  return {
    data: reviews,
  };
};

/**
 * Get all reviews (Admin only)
 */
const getAllReviews = async () => {
  const reviews = await Review.find()
    .populate("reviewerId", "fullname email profilePhoto")
    .populate("reviewedUserId", "fullname email profilePhoto")
    .populate("travelPlanId", "title destination startDate endDate")
    .sort({ createdAt: -1 });

  return {
    data: reviews,
  };
};

export const ReviewServices = {
  createReview,
  updateReview,
  deleteReview,
  getUserReviews,
  getMyGivenReviews,
  getMyGettingReviews,
  getAllReviews,
};
