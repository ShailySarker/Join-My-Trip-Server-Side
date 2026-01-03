import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { TravelPlanServices } from "./travelPlan.service";
import { sendResponse } from "../../utils/sendResponse";
import status from "http-status";
import { JwtPayload } from "jsonwebtoken";

const createTravelPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const hostId = decodedToken.userId;

    const file = req.file as any;

    const payload = { ...req.body };

    if (file && file.path) {
      payload.image = file.path; // Cloudinary URL
    }

    const result = await TravelPlanServices.createTravelPlan(hostId, payload);

    sendResponse(res, {
      success: true,
      statusCode: status.CREATED,
      message: "Travel plan created successfully",
      data: result,
    });
  }
);

const getMyTravelPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    // console.log(decodedToken);
    const result = await TravelPlanServices.getMyTravelPlan(
      decodedToken.userId as string,
      req.query
    );

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "My travel plan retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);

const getTravelPlanById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // const decodedToken = req.user as JwtPayload;
    // console.log(id, decodedToken);
    const result = await TravelPlanServices.getTravelPlanById(
      id
      // decodedToken.userId as string
    );

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Travel plan retrieved successfully",
      data: result.data,
    });
  }
);

const getAllTravelPlansPublic = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await TravelPlanServices.getAllTravelPlansPublic(req.query);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Travel plans retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);
const getAllTravelPlansAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const result = await TravelPlanServices.getAllTravelPlansAdmin(
      req.query
      // decodedToken.userId as string
    );

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Travel plans retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);

const approveTravelPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { isApproved } = req.body;
    const result = await TravelPlanServices.approveTravelPlan(id, isApproved);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Travel plan approved successfully",
      data: result,
    });
  }
);

const cancelTravelPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const decodedToken = req.user as JwtPayload;
    const userId = decodedToken.userId;

    const result = await TravelPlanServices.cancelTravelPlan(id, userId);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Travel plan cancelled successfully",
      data: result.data,
    });
  }
);

const updateTravelPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const decodedToken = req.user as JwtPayload;
    const userId = decodedToken.userId;

    const file = req.file as any;

    const payload = { ...req.body };

    if (file && file.path) {
      payload.image = file.path; // Cloudinary URL
    }

    const result = await TravelPlanServices.updateTravelPlan(
      id,
      userId,
      payload
    );

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Travel plan updated successfully",
      data: result.data,
    });
  }
);

const addParticipant = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; // travel plan id
    const decodedToken = req.user as JwtPayload;
    const userId = decodedToken.userId;

    const result = await TravelPlanServices.addParticipantToTravelPlan(
      id,
      userId,
      req.body
    );

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Participant added successfully",
      data: result.data,
    });
  }
);

const removeParticipant = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, phone } = req.params; // travel plan id and participant phone
    const decodedToken = req.user as JwtPayload;
    const userId = decodedToken.userId;

    const result = await TravelPlanServices.removeParticipantFromTravelPlan(
      id,
      phone,
      userId
    );

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Participant removed successfully",
      data: result.data,
    });
  }
);

export const TravelPlanControllers = {
  createTravelPlan,
  getMyTravelPlan,
  getTravelPlanById,
  getAllTravelPlansPublic,
  getAllTravelPlansAdmin,
  approveTravelPlan,
  cancelTravelPlan,
  updateTravelPlan,
  addParticipant,
  removeParticipant,
};
