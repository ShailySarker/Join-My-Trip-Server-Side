import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { SubscriptionServices } from "./subscription.service";
import { sendResponse } from "../../utils/sendResponse";
import status from "http-status";

const createSubscription = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await SubscriptionServices.createSubscription(req.body);

    sendResponse(res, {
      success: true,
      statusCode: status.CREATED,
      message: "Subscription created successfully",
      data: result,
    });
  }
);

const getSubscriptionById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await SubscriptionServices.getSubscriptionById(id);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Subscription retrieved successfully",
      data: result.data,
    });
  }
);

const getAllSubscriptions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await SubscriptionServices.getAllSubscriptions();

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Subscriptions retrieved successfully",
      data: result.data,
    });
  }
);

const deleteSubscription = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await SubscriptionServices.deleteSubscription(id);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Subscription deleted successfully",
      data: result.data,
    });
  }
);

export const SubscriptionControllers = {
  createSubscription,
  getSubscriptionById,
  getAllSubscriptions,
  deleteSubscription,
};
