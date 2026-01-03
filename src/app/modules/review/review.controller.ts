import { Request, Response } from "express";
import httpStatus from "http-status";
import { ReviewServices } from "./review.service";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await ReviewServices.createReview(
    decodedToken.userId as string,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const { id } = req.params;

  const result = await ReviewServices.updateReview(
    id,
    decodedToken.userId as string,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review updated successfully",
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const { id } = req.params;
  const result = await ReviewServices.deleteReview(
    id,
    decodedToken.userId as string
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review deleted successfully",
    data: result,
  });
});

const getMyGivenReviews = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await ReviewServices.getMyGivenReviews(
    decodedToken.userId as string,
    req.query
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Given reviews retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getMyReceivedReviews = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await ReviewServices.getMyReceivedReviews(
    decodedToken.userId as string,
    req.query
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Received reviews retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getUserReviews = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await ReviewServices.getUserReviews(userId, req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User reviews retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.getAllReviews(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All reviews retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReviewServices.getReviewById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review retrieved successfully",
    data: result,
  });
});

export const ReviewControllers = {
  createReview,
  updateReview,
  deleteReview,
  getMyGivenReviews,
  getMyReceivedReviews,
  getUserReviews,
  getAllReviews,
  getReviewById,
};
