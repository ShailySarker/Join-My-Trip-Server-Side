import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { IBooking } from "./booking.interface";
import { Booking } from "./booking.model";
import { TravelPlan } from "../travelPlan/travelPlan.model";
import QueryBuilder from "../../utils/QueryBuilder";
import {
  bookingSearchableFields,
  bookingFilterableFields,
  bookingSortableFields,
} from "./booking.constant";
import { IUserRole } from "../user/user.interface";
import { User } from "../user/user.model";
import { ISubscriptionPlan } from "../subscription/subscription.interface";

const createBooking = async (userId: string, payload: Partial<IBooking>) => {
  const { travelId, amount, totalPeople, participants } = payload;

  // Validate participants array exists
  if (!participants || participants.length === 0) {
    throw new AppError(
      status.BAD_REQUEST,
      "At least one participant is required"
    );
  }

  // Check if user has an active subscription
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const hasSubscription =
    user.subscriptionInfo?.plan &&
    (user.subscriptionInfo.plan === ISubscriptionPlan.MONTHLY ||
      user.subscriptionInfo.plan === ISubscriptionPlan.YEARLY) &&
    user.subscriptionInfo.status === "ACTIVE";

  if (!hasSubscription) {
    throw new AppError(
      status.FORBIDDEN,
      "You need an active subscription to create bookings"
    );
  }

  // Check if travel plan exists
  const travelPlan = await TravelPlan.findById(travelId);
  if (!travelPlan) {
    throw new AppError(status.NOT_FOUND, "Travel plan not found");
  }

  // Validate all participants meet age requirement
  const invalidAgeParticipants = participants.filter(
    (p) => p.age < travelPlan.minAge
  );
  if (invalidAgeParticipants.length > 0) {
    throw new AppError(
      status.BAD_REQUEST,
      `All participants must be at least ${travelPlan.minAge} years old`
    );
  }

  // Check available seats (using current participant count from travel plan)
  const availableSeats = travelPlan.maxGuest - travelPlan.participants.length;
  
  if (participants.length > availableSeats) {
    throw new AppError(
      status.BAD_REQUEST,
      `Not enough seats available. Only ${availableSeats} seats remaining.`
    );
  }

  // Check for duplicate phone numbers in the request
  const phoneNumbers = participants.map((p) => p.phone);
  const uniquePhones = new Set(phoneNumbers);
  if (phoneNumbers.length !== uniquePhones.size) {
    throw new AppError(
      status.BAD_REQUEST,
      "Duplicate phone numbers in participants list"
    );
  }

  // Check if any participant already exists in travel plan
  const existingPhones = travelPlan.participants.map((p) => p.phone);
  const duplicateParticipants = participants.filter((p) =>
    existingPhones.includes(p.phone)
  );
  
  if (duplicateParticipants.length > 0) {
    throw new AppError(
      status.BAD_REQUEST,
      `Participant(s) with phone ${duplicateParticipants.map(p => p.phone).join(", ")} already registered for this travel plan`
    );
  }

  // Create booking first (without bookingId in participants)
  const booking = await Booking.create({
    userId,
    travelId,
    amount,
    totalPeople,
    participants: participants.map((p) => ({
      ...p,
      userId: p.userId || undefined, // Link to user if provided
    })),
  });

  // Now update participants with bookingId and add them to travel plan
  const participantsWithBookingId = participants.map((p) => ({
    ...p,
    userId: p.userId || undefined,
    bookingId: booking._id,
  }));

  // Add all participants to travel plan
  await TravelPlan.findByIdAndUpdate(
    travelId,
    { $push: { participants: { $each: participantsWithBookingId } } },
    { new: true }
  );

  // Update booking with bookingId in participants
  await Booking.findByIdAndUpdate(
    booking._id,
    { participants: participantsWithBookingId },
    { new: true }
  );

  return {
    data: await Booking.findById(booking._id).populate([
      { path: "userId", select: "fullname email" },
      { path: "travelId", select: "title destination startDate endDate" },
    ]),
  };
};



const getAllBookings = async (query: Record<string, unknown>) => {
  const bookingQuery = new QueryBuilder(
    Booking.find()
      .populate("userId", "fullname email")
      .populate("travelId", "title destination startDate endDate"),
    query
  )
    .search(bookingSearchableFields)
    .filter(bookingFilterableFields)
    .sort(bookingSortableFields)
    .paginate();

  const result = await bookingQuery.execute();

  return result;
};

const getMyBookings = async (
  userId: string,
  query: Record<string, unknown>
) => {
  const bookingQuery = new QueryBuilder(
    Booking.find({ userId })
      .populate("userId", "fullname email")
      .populate("travelId", "title destination startDate endDate"),
    query
  )
    .search(bookingSearchableFields)
    .filter(bookingFilterableFields)
    .sort(bookingSortableFields)
    .paginate();

  const result = await bookingQuery.execute();

  return result;
};

/**
 * Get booking by ID
 * - User can only view their own booking
 * - Admin can view any booking
 */
const getBookingById = async (
  id: string,
  userId: string,
  userRole: string
) => {
  const booking = await Booking.findById(id)
    .populate("userId", "fullname email")
    .populate("travelId", "title destination startDate endDate");

  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Booking not found");
  }

  // Check authorization: user can only view their own booking, admin can view all
  if (
    userRole !== IUserRole.ADMIN &&
    booking.userId._id.toString() !== userId
  ) {
    throw new AppError(
      status.FORBIDDEN,
      "You are not authorized to view this booking"
    );
  }

  return {
    data: booking,
  };
};

const cancelBooking = async (bookingId: string, userId: string) => {
  // Find the booking
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Booking not found");
  }

  // Check if user owns the booking
  if (booking.userId.toString() !== userId) {
    throw new AppError(
      status.FORBIDDEN,
      "You are not authorized to cancel this booking"
    );
  }

  // Check if booking is already cancelled
  if (booking.bookingStatus === "CANCELLED") {
    throw new AppError(status.BAD_REQUEST, "Booking is already cancelled");
  }

  // Remove all participants associated with this booking from travel plan
  const participantPhones = booking.participants.map((p) => p.phone);
  
  await TravelPlan.findByIdAndUpdate(booking.travelId, {
    $pull: { participants: { bookingId: booking._id } },
  });

  // Update booking status to CANCELLED
  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    { bookingStatus: "CANCELLED" },
    { new: true }
  )
    .populate("userId", "fullname email")
    .populate("travelId", "title destination startDate endDate");

  return {
    data: updatedBooking,
  };
};

// Add participants to an existing booking
const addParticipantsToBooking = async (
  bookingId: string,
  userId: string,
  newParticipants: any[]
) => {
  // Find the booking
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Booking not found");
  }

  // Check if user owns the booking
  if (booking.userId.toString() !== userId) {
    throw new AppError(
      status.FORBIDDEN,
      "You are not authorized to modify this booking"
    );
  }

  // Check if booking is cancelled
  if (booking.bookingStatus === "CANCELLED") {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot add participants to a cancelled booking"
    );
  }

  // Get travel plan
  const travelPlan = await TravelPlan.findById(booking.travelId);
  if (!travelPlan) {
    throw new AppError(status.NOT_FOUND, "Travel plan not found");
  }

  // Validate all new participants meet age requirement
  const invalidAgeParticipants = newParticipants.filter(
    (p) => p.age < travelPlan.minAge
  );
  if (invalidAgeParticipants.length > 0) {
    throw new AppError(
      status.BAD_REQUEST,
      `All participants must be at least ${travelPlan.minAge} years old`
    );
  }

  // Check available seats
  const availableSeats = travelPlan.maxGuest - travelPlan.participants.length;
  
  if (newParticipants.length > availableSeats) {
    throw new AppError(
      status.BAD_REQUEST,
      `Not enough seats available. Only ${availableSeats} seats remaining.`
    );
  }

  // Check for duplicates within new participants
  const newPhones = newParticipants.map((p) => p.phone);
  const uniqueNewPhones = new Set(newPhones);
  if (newPhones.length !== uniqueNewPhones.size) {
    throw new AppError(
      status.BAD_REQUEST,
      "Duplicate phone numbers in new participants list"
    );
  }

  // Check if any new participant already exists in travel plan
  const existingPhones = travelPlan.participants.map((p) => p.phone);
  const duplicates = newParticipants.filter((p) =>
    existingPhones.includes(p.phone)
  );
  
  if (duplicates.length > 0) {
    throw new AppError(
      status.BAD_REQUEST,
      `Participant(s) with phone ${duplicates.map(p => p.phone).join(", ")} already registered for this travel plan`
    );
  }

  // Add participants with bookingId
  const participantsWithBookingId = newParticipants.map((p) => ({
    ...p,
    userId: p.userId || undefined,
    bookingId: booking._id,
  }));

  // Update booking
  await Booking.findByIdAndUpdate(
    bookingId,
    {
      $push: { participants: { $each: participantsWithBookingId } },
      $inc: { totalPeople: newParticipants.length },
    },
    { new: true }
  );

  // Add to travel plan
  await TravelPlan.findByIdAndUpdate(
    booking.travelId,
    { $push: { participants: { $each: participantsWithBookingId } } },
    { new: true }
  );

  return {
    data: await Booking.findById(bookingId).populate([
      { path: "userId", select: "fullname email" },
      { path: "travelId", select: "title destination startDate endDate" },
    ]),
  };
};

// Remove participant from booking
const removeParticipantFromBooking = async (
  bookingId: string,
  participantPhone: string,
  userId: string
) => {
  // Find the booking
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Booking not found");
  }

  // Check if user owns the booking
  if (booking.userId.toString() !== userId) {
    throw new AppError(
      status.FORBIDDEN,
      "You are not authorized to modify this booking"
    );
  }

  // Check if booking is cancelled
  if (booking.bookingStatus === "CANCELLED") {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot remove participants from a cancelled booking"
    );
  }

  // Check if participant exists in booking
  const participant = booking.participants.find(
    (p) => p.phone === participantPhone
  );

  if (!participant) {
    throw new AppError(
      status.NOT_FOUND,
      "Participant not found in this booking"
    );
  }

  // Ensure at least one participant remains
  if (booking.participants.length <= 1) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot remove the last participant. Cancel the booking instead."
    );
  }

  // Remove from booking
  await Booking.findByIdAndUpdate(
    bookingId,
    {
      $pull: { participants: { phone: participantPhone } },
      $inc: { totalPeople: -1 },
    },
    { new: true }
  );

  // Remove from travel plan
  await TravelPlan.findByIdAndUpdate(
    booking.travelId,
    { $pull: { participants: { phone: participantPhone, bookingId: booking._id } } },
    { new: true }
  );

  return {
    data: await Booking.findById(bookingId).populate([
      { path: "userId", select: "fullname email" },
      { path: "travelId", select: "title destination startDate endDate" },
    ]),
  };
};

export const BookingServices = {
  createBooking,
  getAllBookings,
  getMyBookings,
  getBookingById,
  cancelBooking,
  addParticipantsToBooking,
  removeParticipantFromBooking,
};
