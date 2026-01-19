import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import {
  IParticipantDetails,
  ITravelPlan,
  ITrevelIsApproved,
  ITrevelStatus,
} from "./travelPlan.interface";
import { TravelPlan } from "./travelPlan.model";
import QueryBuilder from "../../utils/QueryBuilder";
import {
  filterableFields,
  searchableFields,
  sortableFields,
} from "./travelPlan.constant";
import { generateSlug } from "../../utils/generateSlug";
import { deleteImageFromCloudinary } from "../../config/cloudinary.config";
import { User } from "../user/user.model";
import { IUserRole } from "../user/user.interface";
import { Booking } from "../booking/booking.model";
import { IBookingStatus } from "../booking/booking.interface";

const createTravelPlan = async (
  hostId: string,
  payload: Partial<ITravelPlan>
) => {
  const slug: string = generateSlug(payload.title!);

  const existingPlan = await TravelPlan.findOne({ slug });
  if (existingPlan) {
    throw new AppError(
      status.CONFLICT,
      "A travel plan with this title already exists"
    );
  }

  // Get host user details to create default participant
  const hostUser = await User.findById(hostId);
  if (!hostUser) {
    throw new AppError(status.NOT_FOUND, "Host user not found");
  }

  // Validate host has required information for participant
  if (!hostUser.phone || !hostUser.gender || !hostUser.age) {
    throw new AppError(
      status.BAD_REQUEST,
      "Please complete your profile setup (age, phone and gender required) before creating a travel plan"
    );
  }

  if (!hostUser.age) {
    throw new AppError(
      status.BAD_REQUEST,
      "Please complete your profile (age required) before creating a travel plan"
    );
  }

  if (hostUser.age === null) {
    new AppError(
      status.BAD_REQUEST,
      "Your need to update your profile age info to create a travel plan"
    );
  }

  if (hostUser.age < 18) {
    throw new AppError(
      status.BAD_REQUEST,
      "You must be at least 18 years old to create a travel plan"
    );
  }

  if (hostUser.age < (payload.minAge as number)) {
    throw new AppError(
      status.BAD_REQUEST,
      `${hostUser.fullname} must be at least ${payload.minAge} years old to book this travel plan.`
    );
  }

  // Check for overlapping non-cancelled travel plans where user is HOST
  // Validate dates: Start date must be at least 7 days from today
  const minStartDate = new Date();
  minStartDate.setDate(minStartDate.getDate() + 7);
  minStartDate.setHours(0, 0, 0, 0);

  const providedStartDate = new Date(payload.startDate!);
  if (providedStartDate < minStartDate) {
    throw new AppError(
      status.BAD_REQUEST,
      "Start date must be at least 7 days from today"
    );
  }

  // Validate dates: End date must be after Start date
  const providedEndDate = new Date(payload.endDate!);
  if (providedEndDate < providedStartDate) {
    throw new AppError(status.BAD_REQUEST, "End date must be after start date");
  }

  // Check for overlapping non-cancelled travel plans where user is HOST
  // Logic mirrored from booking service as requested
  const newStart = providedStartDate.getTime();
  const newEnd = providedEndDate.getTime();

  const overlappingHostedPlans = await TravelPlan.find({
    host: hostId,
    status: { $ne: ITrevelStatus.CANCELLED },
  });

  for (const plan of overlappingHostedPlans) {
    const existingStart = new Date(plan.startDate).getTime();
    const existingEnd = new Date(plan.endDate).getTime();

    // Check for overlap: (StartA <= EndB) and (EndA >= StartB)
    if (newStart <= existingEnd && newEnd >= existingStart) {
      throw new AppError(
        status.BAD_REQUEST,
        `You are already hosting a travel plan during this time range: ${plan.title}`
      );
    }
  }

  const hostParticipant: IParticipantDetails = {
    userId: hostUser._id as any, // Cast to ObjectId
    name: hostUser.fullname,
    phone: hostUser.phone,
    gender: hostUser.gender,
    age: hostUser.age,
  };

  // Check for overlapping bookings where user is PARTICIPANT
  const userBookings = await Booking.find({
    userId: hostId,
    bookingStatus: { $ne: "CANCELLED" },
  }).populate("travelId");

  for (const booking of userBookings) {
    const existingPlan = booking.travelId as any;
    if (existingPlan && existingPlan.startDate && existingPlan.endDate) {
      const existingStart = new Date(existingPlan.startDate).getTime();
      const existingEnd = new Date(existingPlan.endDate).getTime();

      // Check for overlap
      if (newStart <= existingEnd && newEnd >= existingStart) {
        throw new AppError(
          status.BAD_REQUEST,
          `You already have a travel plan booked for this time range: ${existingPlan.title}`
        );
      }
    }
  }

  const travelPlan = await TravelPlan.create({
    ...payload,
    host: hostId,
    slug,
    participants: [hostParticipant], // Add host as default participant
  });

  return await travelPlan.populate("host", "fullname email profilePhoto");
};

const getMyTravelPlan = async (
  hostId: string,
  query: Record<string, unknown>
) => {
  const host = await User.findById(hostId);
  if (!host) {
    throw new AppError(status.NOT_FOUND, "Host user not found");
  }

  const travelPlanQuery = new QueryBuilder(
    TravelPlan.find({
      host: hostId,
      // isApproved: ITrevelIsApproved.APPROVED,
      // status: ITrevelStatus.UPCOMING,
    }).populate("host", "fullname email profilePhoto") as any,
    query
  );

  const result = await travelPlanQuery
    .search(searchableFields)
    .filter(filterableFields)
    .filterByRange() // Filter by budget and date ranges
    .sort(sortableFields)
    .paginate()
    .fields()
    .execute();

  if (!result) {
    throw new AppError(status.NOT_FOUND, "No travel plan found");
  }
  return result;
};

const getTravelPlanById = async (id: string) => {
  const travelPlan = await TravelPlan.findById(id).populate(
    "host",
    "fullname email profilePhoto"
  );

  if (!travelPlan) {
    throw new AppError(status.NOT_FOUND, "Travel plan not found");
  }
  // if (travelPlan.isApproved !== ITrevelIsApproved.APPROVED) {
  //   throw new AppError(status.NOT_FOUND, "Travel plan is not approved");
  // }

  return {
    data: travelPlan,
  };
};

// const getTravelPlanById = async (id: string, hostId: string) => {
//   console.log(hostId);
//   const travelPlan = await TravelPlan.findById(id).populate(
//     "host",
//     "fullname email profilePhoto"
//   );

//   if (!travelPlan) {
//     throw new AppError(status.NOT_FOUND, "Travel plan not found");
//   }
//   if (travelPlan.isApproved !== ITrevelIsApproved.APPROVED) {
//     if (travelPlan.host.toString() !== hostId) {
//       console.log(travelPlan.host.toString() !== hostId);
//       throw new AppError(status.NOT_FOUND, "Travel plan is not approved");
//     }
//   }

//   return {
//     data: travelPlan,
//   };
// };

const getAllTravelPlansPublic = async (query: Record<string, unknown>) => {
  const travelPlanQuery = new QueryBuilder(
    TravelPlan.find({
      isApproved: ITrevelIsApproved.APPROVED,
      status: ITrevelStatus.UPCOMING,
    }).populate("host", "fullname email profilePhoto") as any,
    query
  );

  const result = await travelPlanQuery
    .search(searchableFields)
    .filter(filterableFields)
    .filterByRange() // Filter by budget and date ranges
    .sort(sortableFields)
    .paginate()
    .fields()
    .execute();

  return result;
};

const getAllTravelPlansAdmin = async (query: Record<string, unknown>) => {
  // const admin = await User.findById(adminId);

  // if (!admin || admin.role !== IUserRole.ADMIN || IUserRole.SUPER_ADMIN) {
  //   throw new AppError(
  //     status.FORBIDDEN,
  //     "You are not authorized to access this route"
  //   );
  // }
  const travelPlanQuery = new QueryBuilder(
    TravelPlan.find({
      // status: ITrevelStatus.UPCOMING,
    }).populate("host", "fullname email profilePhoto") as any,
    query
  );

  const result = await travelPlanQuery
    .search(searchableFields)
    .filter(filterableFields)
    .filterByRange() // Filter by budget and date ranges
    .sort(sortableFields)
    .paginate()
    .fields()
    .execute();

  return result;
};

const approveTravelPlan = async (id: string, isApproved: ITrevelIsApproved) => {
  const travelPlan = await TravelPlan.findById(id);

  if (!travelPlan) {
    throw new AppError(status.NOT_FOUND, "Travel plan not found");
  }

  if (isApproved === ITrevelIsApproved.REJECTED) {
    const updatedPlan = await TravelPlan.findByIdAndUpdate(
      id,
      { isApproved, status: ITrevelStatus.CANCELLED },
      { new: true }
    ).populate("host", "fullname email profilePhoto");

    return { data: updatedPlan };
  } else if (isApproved === ITrevelIsApproved.APPROVED) {
    const updatedPlan = await TravelPlan.findByIdAndUpdate(
      id,
      // { isApproved },
      { isApproved, status: ITrevelStatus.UPCOMING },
      { new: true }
    ).populate("host", "fullname email profilePhoto");
    return { data: updatedPlan };
  }
};

const cancelTravelPlan = async (id: string, userId: string) => {
  const travelPlan = await TravelPlan.findById(id);

  if (!travelPlan) {
    throw new AppError(status.NOT_FOUND, "Travel plan not found");
  }

  const booking = await Booking.findById({ travelId: id });
  // Check authorization: only host or admin can cancel
  const isHost = travelPlan.host.toString() === userId;

  if (!isHost) {
    throw new AppError(
      status.FORBIDDEN,
      "Only the host can cancel this travel plan"
    );
  }

  if (travelPlan.isApproved == ITrevelIsApproved.APPROVED) {
    throw new AppError(
      status.BAD_REQUEST,
      "An approved travel plan cannot be cancelled"
    );
  }

  if (travelPlan.status === ITrevelStatus.CANCELLED) {
    throw new AppError(status.BAD_REQUEST, "Travel plan is already cancelled");
  }

  if (travelPlan.status === ITrevelStatus.ONGOING) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot cancel an ongoing travel plan"
    );
  }

  if (travelPlan.status === ITrevelStatus.COMPLETED) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot cancel a completed travel plan"
    );
  }

  const updatedPlan = await TravelPlan.findByIdAndUpdate(
    id,
    { status: ITrevelStatus.CANCELLED, isApproved: ITrevelIsApproved.REJECTED },
    { new: true }
  ).populate("host", "fullname email profilePhoto");

  // Cancel all bookings associated with this travel plan
  await Booking.updateMany(
    { travelId: id },
    { bookingStatus: IBookingStatus.CANCELLED }
  );

  return { data: updatedPlan };
};

const updateTravelPlan = async (
  id: string,
  userId: string,
  payload: Partial<ITravelPlan>
) => {
  const travelPlan = await TravelPlan.findById(id);

  if (!travelPlan) {
    throw new AppError(status.NOT_FOUND, "Travel plan not found");
  }

  // Check authorization: only host can update
  const isHost = travelPlan.host.toString() === userId;
  if (!isHost) {
    throw new AppError(
      status.FORBIDDEN,
      "Only the host can update this travel plan"
    );
  }

  if (
    travelPlan.status === ITrevelStatus.CANCELLED ||
    travelPlan.status === ITrevelStatus.ONGOING ||
    travelPlan.status === ITrevelStatus.COMPLETED
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      `${travelPlan.status} - Travel plan cannot be updated`
    );
  }

  if (
    travelPlan.isApproved === ITrevelIsApproved.APPROVED ||
    travelPlan.isApproved === ITrevelIsApproved.REJECTED
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      `${travelPlan.isApproved} - Travel plan cannot be updated`
    );
  }

  if (payload.title) {
    const newSlug: string = generateSlug(payload.title);

    const existingPlan = await TravelPlan.findOne({
      slug: newSlug,
      _id: { $ne: id },
    });

    if (existingPlan) {
      throw new AppError(
        status.CONFLICT,
        "A travel plan with this title already exists"
      );
    }

    payload.slug = newSlug;
  }

  if (payload.image && travelPlan.image) {
    await deleteImageFromCloudinary(travelPlan.image);
  }

  // Date Validation for Updates
  let newStart = travelPlan.startDate.getTime();
  let newEnd = travelPlan.endDate.getTime();

  if (payload.startDate) {
    newStart = new Date(payload.startDate).getTime();
  }

  if (payload.endDate) {
    newEnd = new Date(payload.endDate).getTime();
  }

  // Validate start date is at least 7 days from today (only if being updated)
  if (payload.startDate) {
    const minStartDate = new Date();
    minStartDate.setDate(minStartDate.getDate() + 7);
    minStartDate.setHours(0, 0, 0, 0);

    const providedStartDate = new Date(payload.startDate);
    providedStartDate.setHours(0, 0, 0, 0);

    if (providedStartDate < minStartDate) {
      throw new AppError(
        status.BAD_REQUEST,
        "Start date must be at least 7 days from today"
      );
    }
  }

  // Ensure End Date >= Start Date
  if (newEnd < newStart) {
    throw new AppError(
      status.BAD_REQUEST,
      "End date must be after or equal to start date"
    );
  }

  // Check for conflicts with existing hosted plans (excluding current plan)
  if (payload.startDate || payload.endDate) {
    const activeHostedPlans = await TravelPlan.find({
      host: userId,
      _id: { $ne: id },
      status: { $ne: ITrevelStatus.CANCELLED },
    });

    for (const plan of activeHostedPlans) {
      const existingStart = new Date(plan.startDate).getTime();
      const existingEnd = new Date(plan.endDate).getTime();

      // Overlap condition: (StartA <= EndB) and (EndA >= StartB)
      if (newStart <= existingEnd && newEnd >= existingStart) {
        throw new AppError(
          status.BAD_REQUEST,
          `Rescheduling conflict: You have another travel plan '${plan.title}' during this period.`
        );
      }
    }
  }

  const updatedPlan = await TravelPlan.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  ).populate("host", "fullname email profilePhoto");

  return { data: updatedPlan };
};

// Add participant to travel plan (before booking)
const addParticipantToTravelPlan = async (
  travelPlanId: string,
  userId: string,
  participantData: IParticipantDetails
) => {
  const travelPlan = await TravelPlan.findById(travelPlanId);

  if (!travelPlan) {
    throw new AppError(status.NOT_FOUND, "Travel plan not found");
  }

  // Only host can add participants before booking
  if (travelPlan.host.toString() !== userId) {
    throw new AppError(
      status.FORBIDDEN,
      "Only the host can add participants to their travel plan"
    );
  }

  // Validate travel plan is in valid state
  if (travelPlan.status !== ITrevelStatus.UPCOMING) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot add participants to a non-upcoming travel plan"
    );
  }

  // Check if participant already exists (by phone number)
  const existingParticipant = travelPlan.participants.find(
    (p) => p.phone === participantData.phone
  );

  if (existingParticipant) {
    throw new AppError(
      status.BAD_REQUEST,
      "A participant with this phone number already exists"
    );
  }

  // Check max guest limit
  if (travelPlan.participants.length >= travelPlan.maxGuest) {
    throw new AppError(
      status.BAD_REQUEST,
      `Maximum guest limit (${travelPlan.maxGuest}) reached`
    );
  }

  // Validate participant age against travel plan requirements
  if (participantData.age < travelPlan.minAge) {
    throw new AppError(
      status.BAD_REQUEST,
      `Participant age must be at least ${travelPlan.minAge} years`
    );
  }

  // Add participant
  const updatedPlan = await TravelPlan.findByIdAndUpdate(
    travelPlanId,
    { $push: { participants: participantData } },
    { new: true, runValidators: true }
  ).populate("host", "fullname email profilePhoto");

  return { data: updatedPlan };
};

// Remove participant from travel plan (before booking)
const removeParticipantFromTravelPlan = async (
  travelPlanId: string,
  participantPhone: string,
  userId: string
) => {
  const travelPlan = await TravelPlan.findById(travelPlanId);

  if (!travelPlan) {
    throw new AppError(status.NOT_FOUND, "Travel plan not found");
  }

  // Only host can remove participants
  if (travelPlan.host.toString() !== userId) {
    throw new AppError(
      status.FORBIDDEN,
      "Only the host can remove participants from their travel plan"
    );
  }

  // Find participant
  const participant = travelPlan.participants.find(
    (p) => p.phone === participantPhone
  );

  if (!participant) {
    throw new AppError(status.NOT_FOUND, "Participant not found");
  }

  // Cannot remove participant if they have a booking
  if (participant.bookingId) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot remove participant with an active booking. They must cancel their booking first."
    );
  }

  // Cannot remove the host from the participant list
  if (
    participant.userId &&
    participant.userId.toString() === travelPlan.host.toString()
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot remove the host from the participant list"
    );
  }

  // Remove participant
  const updatedPlan = await TravelPlan.findByIdAndUpdate(
    travelPlanId,
    { $pull: { participants: { phone: participantPhone } } },
    { new: true }
  ).populate("host", "fullname email profilePhoto");

  return { data: updatedPlan };
};

const getPopularDestinations = async () => {
  const result = await TravelPlan.aggregate([
    {
      $group: {
        _id: { city: "$destination.city", country: "$destination.country" },
        count: { $sum: 1 },
        image: { $first: "$image" },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 6,
    },
    {
      $project: {
        _id: 0,
        city: "$_id.city",
        country: "$_id.country",
        count: "$count",
        image: "$image",
      },
    },
  ]);
  return { data: result };
};

export const TravelPlanServices = {
  createTravelPlan,
  getMyTravelPlan,
  getTravelPlanById,
  getAllTravelPlansPublic,
  getAllTravelPlansAdmin,
  approveTravelPlan,
  cancelTravelPlan,
  updateTravelPlan,
  addParticipantToTravelPlan,
  removeParticipantFromTravelPlan,
  getPopularDestinations,
};
