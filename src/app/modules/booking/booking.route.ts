import express from "express";
import { BookingControllers } from "./booking.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { IUserRole } from "../user/user.interface";
import { validatedRequest } from "../../middlewares/validateRequest";
import { BookingValidations } from "./booking.validation";

const router = express.Router();

router.post(
  "/",
  checkAuth(IUserRole.USER),
  validatedRequest(BookingValidations.createBookingValidationSchema),
  BookingControllers.createBooking
);

router.get(
  "/",
  checkAuth(IUserRole.ADMIN, IUserRole.SUPER_ADMIN),
  BookingControllers.getAllBookings
);

router.get(
  "/my-bookings",
  checkAuth(IUserRole.USER),
  BookingControllers.getMyBookings
);

router.get(
  "/:id",
  checkAuth(...Object.values(IUserRole)),
  BookingControllers.getBookingById
);

router.patch(
  "/:id/cancel",
  checkAuth(IUserRole.USER),
  BookingControllers.cancelBooking
);

// Add participants to an existing booking
router.patch(
  "/:id/participants",
  checkAuth(IUserRole.USER),
  validatedRequest(BookingValidations.addParticipantsValidationSchema),
  BookingControllers.addParticipantsToBooking
);

// Remove participant from booking
router.delete(
  "/:id/participants/:phone",
  checkAuth(IUserRole.USER),
  BookingControllers.removeParticipantFromBooking
);

export const BookingRoutes = router;
