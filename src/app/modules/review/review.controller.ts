import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import status from "http-status";
import { ReviewServices } from "./review.service";
import { JwtPayload } from "jsonwebtoken";

const createReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const reviewerId = decodedToken.userId;

    const result = await ReviewServices.createReview(reviewerId, req.body);

    sendResponse(res, {
      success: true,
      statusCode: status.CREATED,
      message: "Review created successfully",
      data: result.data,
    });
  }
);

const updateReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const reviewerId = decodedToken.userId;
    const { id } = req.params;

    const result = await ReviewServices.updateReview(id, reviewerId, req.body);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Review updated successfully",
      data: result.data,
    });
  }
);

const deleteReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const reviewerId = decodedToken.userId;
    const { id } = req.params;

    const result = await ReviewServices.deleteReview(id, reviewerId);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: result.message,
      data: null,
    });
  }
);

const getUserReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const result = await ReviewServices.getUserReviews(userId);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "User reviews retrieved successfully",
      data: result.data,
    });
  }
);

const getMyGivenReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const reviewerId = decodedToken.userId;

    const result = await ReviewServices.getMyGivenReviews(reviewerId);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Reviews you gave retrieved successfully",
      data: result.data,
    });
  }
);

const getMyGettingReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const userId = decodedToken.userId;

    const result = await ReviewServices.getMyGettingReviews(userId);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Reviews you received retrieved successfully",
      data: result.data,
    });
  }
);

const getAllReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await ReviewServices.getAllReviews();

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "All reviews retrieved successfully",
      data: result.data,
    });
  }
);

export const ReviewControllers = {
  createReview,
  updateReview,
  deleteReview,
  getUserReviews,
  getMyGivenReviews,
  getMyGettingReviews,
  getAllReviews,
};
