import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import status from "http-status";
import { BookingServices } from "./booking.service";
import { JwtPayload } from "jsonwebtoken";

const createBooking = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const result = await BookingServices.createBooking(
      decodedToken.userId,
      req.body
    );
    sendResponse(res, {
      success: true,
      statusCode: status.CREATED,
      message: "Booking created successfully",
      data: result,
    });
  }
);

const getAllBookings = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await BookingServices.getAllBookings(req.query);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Bookings retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);

const getMyBookings = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const result = await BookingServices.getMyBookings(
      decodedToken.userId,
      req.query
    );

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "My bookings retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);

const getBookingById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const decodedToken = req.user as JwtPayload;
    const userId = decodedToken.userId;
    const userRole = decodedToken.role;

    const result = await BookingServices.getBookingById(id, userId, userRole);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Booking retrieved successfully",
      data: result.data,
    });
  }
);

const cancelBooking = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const decodedToken = req.user as JwtPayload;
    const userId = decodedToken.userId;

    const result = await BookingServices.cancelBooking(id, userId);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Booking cancelled successfully",
      data: result.data,
    });
  }
);

const addParticipantsToBooking = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; // booking id
    const decodedToken = req.user as JwtPayload;
    const userId = decodedToken.userId;

    const result = await BookingServices.addParticipantsToBooking(
      id,
      userId,
      req.body.participants
    );

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Participants added to booking successfully",
      data: result.data,
    });
  }
);

const removeParticipantFromBooking = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, phone } = req.params; // booking id and participant phone
    const decodedToken = req.user as JwtPayload;
    const userId = decodedToken.userId;

    const result = await BookingServices.removeParticipantFromBooking(
      id,
      phone,
      userId
    );

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Participant removed from booking successfully",
      data: result.data,
    });
  }
);

export const BookingControllers = {
  createBooking,
  getAllBookings,
  getMyBookings,
  getBookingById,
  cancelBooking,
  addParticipantsToBooking,
  removeParticipantFromBooking,
};
