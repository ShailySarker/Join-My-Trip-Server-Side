import httpStatus from "http-status";
import AppError from "../../errorHelpers/AppError";
import { Review } from "./review.model";
import { TravelPlan } from "../travelPlan/travelPlan.model";
import { IReview } from "./review.interface";
import { ITrevelStatus } from "../travelPlan/travelPlan.interface";
import { User } from "../user/user.model";
import QueryBuilder from "../../utils/QueryBuilder";

const createReview = async (reviewerId: string, payload: IReview) => {
  const { revieweeId, travelId } = payload;

  console.log(reviewerId, payload);
  if (reviewerId === revieweeId.toString()) {
    throw new AppError(httpStatus.BAD_REQUEST, "You cannot review yourself");
  }

  const travelPlan = await TravelPlan.findById(travelId);
  if (!travelPlan) {
    throw new AppError(httpStatus.NOT_FOUND, "Travel plan not found");
  }

  // 1. Check if Travel Plan is COMPLETED
  if (travelPlan.status !== ITrevelStatus.COMPLETED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You can only review after the trip is completed"
    );
  }

  // 2. Verify Involvement
  // Collect all participant user IDs (including host)
  const participantIds = travelPlan.participants
    .map((p) => p.userId?.toString())
    .filter(Boolean); // filter out undefined
  participantIds.push(travelPlan.host.toString());

  // Check if reviewer was involved
  if (!participantIds.includes(reviewerId)) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You were not a participant of this trip"
    );
  }

  // Check if reviewee was involved
  if (!participantIds.includes(revieweeId.toString())) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "The user you are reviewing was not part of this trip"
    );
  }

  // 4. Check if already reviewed
  const existingReview = await Review.findOne({
    reviewerId,
    revieweeId,
    travelId,
  });

  if (existingReview) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already reviewed this user for this trip"
    );
  }

  // 5. Create Review
  const review = await Review.create({
    ...payload,
    reviewerId,
  });

  // 4. Update Average Rating for Reviewee
  await updateUserAverageRating(revieweeId.toString());

  return review;
};

const updateReview = async (
  reviewId: string,
  reviewerId: string,
  payload: Partial<IReview>
) => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  if (review.reviewerId.toString() !== reviewerId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to update this review"
    );
  }

  const updatedReview = await Review.findByIdAndUpdate(reviewId, payload, {
    new: true,
  });

  if (updatedReview) {
    await updateUserAverageRating(updatedReview.revieweeId.toString());
  }

  return updatedReview;
};

const deleteReview = async (reviewId: string, reviewerId: string) => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  if (review.reviewerId.toString() !== reviewerId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to delete this review"
    );
  }

  await Review.findByIdAndDelete(reviewId);
  await updateUserAverageRating(review.revieweeId.toString());

  return review;
};

const updateUserAverageRating = async (userId: string) => {
  // Find all reviews for this user
  const reviews = await Review.find({ revieweeId: userId });

  if (reviews.length > 0) {
    const total = reviews.reduce((sum, rev) => sum + rev.rating, 0);
    const avg = total / reviews.length;
    // Round to 1 decimal place
    const roundedAvg = Math.round(avg * 10) / 10;

    await User.findByIdAndUpdate(userId, {
      averageRating: roundedAvg,
      reviewCount: reviews.length,
    });
  } else {
    await User.findByIdAndUpdate(userId, {
      averageRating: 0,
      reviewCount: 0,
    });
  }
};

const getMyGivenReviews = async (
  userId: string,
  query: Record<string, unknown>
) => {
  const reviewQuery = new QueryBuilder(
    Review.find({ reviewerId: userId })
      .populate("revieweeId", "fullname email profilePhoto")
      .populate("reviewerId", "fullname email profilePhoto")
      .populate("travelId", "title destination"),
    query
  )
    .filter(["rating"])
    .sort()
    .paginate()
    .fields();

  const result = await reviewQuery.execute();
  return result;
};

const getMyReceivedReviews = async (
  userId: string,
  query: Record<string, unknown>
) => {
  const reviewQuery = new QueryBuilder(
    Review.find({ revieweeId: userId })
      .populate("reviewerId", "fullname email profilePhoto")
      .populate("revieweeId", "fullname email profilePhoto")
      .populate("travelId", "title destination"),
    query
  )
    .filter(["rating"])
    .sort()
    .paginate()
    .fields();

  const result = await reviewQuery.execute();
  return result;
};

// Get reviews for a specific user (for profile display)
const getUserReviews = async (
  userId: string,
  query: Record<string, unknown>
) => {
  const reviewQuery = new QueryBuilder(
    Review.find({ revieweeId: userId })
      .populate("reviewerId", "fullname profilePhoto")
      .populate("travelId", "title destination"),
    query
  )
    .filter(["rating"])
    .sort()
    .paginate()
    .fields();

  const result = await reviewQuery.execute();
  return result;
};

// Admin can see all reviews
const getAllReviews = async (query: Record<string, unknown>) => {
  const reviewQuery = new QueryBuilder(
    Review.find()
      .populate("reviewerId", "fullname email")
      .populate("revieweeId", "fullname email")
      .populate("travelId", "title"),
    query
  )
    .search(["comment"])
    .filter(["rating"])
    .sort()
    .paginate()
    .fields();

  const result = await reviewQuery.execute();
  return result;
};

// Get single review by ID
const getReviewById = async (reviewId: string) => {
  const review = await Review.findById(reviewId)
    .populate("reviewerId", "fullname profilePhoto")
    .populate("revieweeId", "fullname profilePhoto")
    .populate("travelId", "title destination");

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  return review;
};

export const ReviewServices = {
  createReview,
  updateReview,
  deleteReview,
  getMyGivenReviews,
  getMyReceivedReviews,
  getUserReviews,
  getAllReviews,
  getReviewById,
};
