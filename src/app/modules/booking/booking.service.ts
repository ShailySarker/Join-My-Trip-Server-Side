import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { IBooking } from "./booking.interface";
import { Booking } from "./booking.model";
import { TravelPlan } from "../travelPlan/travelPlan.model";
import { ITrevelStatus } from "../travelPlan/travelPlan.interface";
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

  if (user.age === null) {
    new AppError(
      status.BAD_REQUEST,
      "Your need to update your profile age info to create a booking"
    );
  }

  // if ((user.age as number) < travelPlan.minAge) {
  //   await TravelPlan.findByIdAndUpdate(
  //     travelId,
  //     { status: ITrevelStatus.CANCELLED },
  //     { new: true }
  //   );

  //   throw new AppError(
  //     status.BAD_REQUEST,
  //     `${user.fullname} must be at least ${travelPlan.minAge} years old to book this travel plan.`
  //   );
  // }

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
  const existingName = travelPlan.participants
    .filter((p) => p.name !== user.fullname) // exclude self
    .map((p) => p.name);

  const duplicateParticipants = participants.filter((p) =>
    existingName.includes(p.name)
  );

  if (duplicateParticipants.length > 0) {
    throw new AppError(
      status.BAD_REQUEST,
      `Participant(s) with name - ${duplicateParticipants
        .map((p) => p.name)
        .join(", ")} already registered for this travel plan`
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

  const newBooking = await Booking.findById(booking._id).populate([
    { path: "userId", select: "fullname email" },
    { path: "travelId", select: "title destination startDate endDate" },
  ]);
  return newBooking;
};

const getAllBookings = async (query: Record<string, unknown>) => {
  const modelQuery = Booking.find()
    .populate("userId", "fullname email")
    .populate("travelId", "title destination startDate endDate");

  // Handle search by travel plan title/city
  if (query.search) {
    const searchTerm = query.search as string;
    // Find travel plans matching title or city
    const travelPlans = await TravelPlan.find({
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { "destination.city": { $regex: searchTerm, $options: "i" } },
        { "destination.country": { $regex: searchTerm, $options: "i" } },
      ],
    }).select("_id");

    const travelIds = travelPlans.map((tp) => tp._id);

    // If query already has travelId filter (unlikely for search, but possible), merge valid IDs
    // For now, simpler to just force filter by these IDs
    // We need to cast as specific FilterQuery or any because 'travelId' might not be in the Schema definition if strict
    (modelQuery as any).find({ travelId: { $in: travelIds } });

    // Remove search from query so QueryBuilder doesn't attempt to search Booking fields
    delete query.search;
  }

  const bookingQuery = new QueryBuilder(modelQuery, query)
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
  const modelQuery = Booking.find({ userId })
    .populate("userId", "fullname email")
    .populate({
      path: "travelId",
      select:
        "title destination isApproved startDate endDate host status participants",
      populate: [
        {
          path: "host",
          select: "fullname profilePhoto email",
        },
        {
          path: "participants.userId",
          select: "fullname profilePhoto email",
        },
      ],
    });

  // Handle search by travel plan title/city
  if (query.search) {
    const searchTerm = query.search as string;
    const travelPlans = await TravelPlan.find({
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { "destination.city": { $regex: searchTerm, $options: "i" } },
        { "destination.country": { $regex: searchTerm, $options: "i" } },
      ],
    }).select("_id");

    const travelIds = travelPlans.map((tp) => tp._id);
    (modelQuery as any).find({ travelId: { $in: travelIds } });

    delete query.search;
  }

  const bookingQuery = new QueryBuilder(modelQuery, query)
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
const getBookingById = async (id: string, userId: string, userRole: string) => {
  const booking = await Booking.findById(id)
    .populate("userId", "fullname email")
    .populate(
      "travelId",
      "title description destination status startDate endDate minAge maxGuest participants"
    );

  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Booking not found");
  }

  // Check authorization: user can only view their own booking, admin can view all
  if (
    userRole !== IUserRole.ADMIN &&
    userRole !== IUserRole.SUPER_ADMIN &&
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

  // Find the associated travel plan
  const travelPlan = await TravelPlan.findById(booking.travelId);
  if (!travelPlan) {
    throw new AppError(
      status.NOT_FOUND,
      "Travel plan associated with this booking not found"
    );
  }

  const isHost = travelPlan.host.toString() === userId;

  if (isHost) {
    // HOST CANCELLATION LOGIC:
    // 1. Cancel the travel plan
    // 2. Cancel ALL bookings for this plan

    // Update Travel Plan status
    await TravelPlan.findByIdAndUpdate(
      booking.travelId,
      {
        status: ITrevelStatus.CANCELLED,
        // optionally set isApproved to REJECTED if desired, but CANCELLED status is explicit enough
      },
      { new: true }
    );

    // Cancel ALL bookings for this travel plan (including the host's)
    await Booking.updateMany(
      { travelId: booking.travelId },
      { bookingStatus: "CANCELLED" }
    );

    // Return the updated host booking
    const updatedBooking = await Booking.findById(bookingId)
      .populate("userId", "fullname email")
      .populate("travelId", "title destination startDate endDate");

    return { data: updatedBooking };
  } else {
    // REGULAR USER CANCELLATION LOGIC:
    // 1. Remove participants from travel plan
    // 2. Cancel only this booking

    // Remove all participants associated with this booking from travel plan
    // We filter by bookingId to be precise
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
  }
};

// Add participants to an existing booking
const addParticipantsToBooking = async (
  bookingId: string,
  userId: string,
  newParticipants: any[]
) => {
  // Find the booking
  const booking = await Booking.findById(bookingId);
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }
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
      `Participant(s) with phone ${duplicates
        .map((p) => p.phone)
        .join(", ")} already registered for this travel plan`
    );
  }

  //   const names = booking.participants
  //   .filter((p) => p.name !== user.fullname) // exclude self
  //   .map((p) => p.name.trim().toLowerCase());

  // const nameCount = new Map<string, number>();

  // for (const name of names) {
  //   nameCount.set(name, (nameCount.get(name) || 0) + 1);
  // }

  // const duplicateNames = [...nameCount.entries()]
  //   .filter(([_, count]) => count > 1)
  //   .map(([name]) => name);

  // if (duplicateNames.length > 0) {
  //   throw new AppError(
  //     status.BAD_REQUEST,
  //     `Participant(s) with name - ${duplicateNames.join(
  //       ", "
  //     )} already registered for this travel plan`
  //   );
  // }

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
      {
        path: "travelId",
        select: "title destination startDate endDate minAge maxGuest",
      },
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
    {
      $pull: {
        participants: { phone: participantPhone, bookingId: booking._id },
      },
    },
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

// 1) For public-
// a) can see all travelPlan(card - with proper searching, filtering, sorting with proper pagination), single travelplan details(for booking he have to login and take subscription)

// 2) for User-
// a) travelPlan: only a login and subscription based user can create travelPlan, update own travelPlan before admin approve, can cancel before/ after approving, can see all travelPlan(in table- with proper searching, filtering, sorting with proper pagination), single travelplan details, own created travelPlan(in card- with proper searching, filtering, sorting with proper pagination), add participate, remove participate
// b) Booking: only a login and subscription based user can create booking, can see own booking(in table- with proper searching, filtering, sorting with proper pagination) with single booking details, cancel own booking, add and remove participate for his any particular booking
// c) review:  only a login and subscription based user after completed traveling with another subscription based user, can give each other review, update and delete his given review. he can see his given and recieved both reviews also. i any user profile , his recieved review will show and according to overall recieved rating , average rating will update in his profile

// 3) for admin an superAdmin-
// a) review--can see all review(card)
// b) booking--can see all booking(in table), single one also
// c) travelPlan- see all tour and approve(in table- with proper searching, filtering, sorting with proper pagination),
