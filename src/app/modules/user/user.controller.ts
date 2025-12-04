import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { UserServices } from "./user.service";
import { sendResponse } from "../../utils/sendResponse";
import status from "http-status";
import { JwtPayload } from "jsonwebtoken";

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserServices.createUser(req.body);

    sendResponse(res, {
      success: true,
      statusCode: status.CREATED,
      message: "User created successfully",
      data: user,
    });
  }
);

const getSingleUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await UserServices.getSingleUser(id);
    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "User Retrieved Successfully",
      data: result.data,
    });
  }
);

const deleteSingleUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await UserServices.deleteSingleUser(id);
    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "User deleted Successfully",
      data: result.data,
    });
  }
);

const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const result = await UserServices.getMe(decodedToken.userId);
    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Your profile Retrieved Successfully",
      data: result.data,
    });
  }
);

const updateUserProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const userId = decodedToken.userId;

    const file = req.file as any;
    
const payload = { ...req.body };
    
    if (file && file.path) {
      payload.profilePhoto = file.path; // Cloudinary URL
    }

    const result = await UserServices.updateUserProfile(userId, payload);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Profile updated successfully",
      data: result.data,
    });
  }
);

const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserServices.getAllUsers(req.query);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Users retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);

export const UserControllers = {
  createUser,
  getSingleUser,
  getMe,
  deleteSingleUser,
  updateUserProfile,
  getAllUsers,
};
