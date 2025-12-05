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
  if (!hostUser.phone || !hostUser.gender) {
    throw new AppError(
      status.BAD_REQUEST,
      "Please complete your profile (phone and gender required) before creating a travel plan"
    );
  }

  // Calculate age from user profile (assuming you might have a birthdate or age field)
  // For now, we'll require age to be sent in the payload or use a default
  const hostParticipant: IParticipantDetails = {
    userId: hostUser._id as any, // Cast to ObjectId
    name: hostUser.fullname,
    phone: hostUser.phone,
    gender: hostUser.gender,
    age: 25, // TODO: Calculate from user's birthdate or get from profile
  };

  const travelPlan = await TravelPlan.create({
    ...payload,
    host: hostId,
    slug,
    participants: [hostParticipant], // Add host as default participant
  });

  return await travelPlan.populate("host", "fullname email profilePhoto");
};

const getTravelPlanById = async (id: string) => {
  const travelPlan = await TravelPlan.findById(id)
    .populate("host", "fullname email profilePhoto");

  if (!travelPlan) {
    throw new AppError(status.NOT_FOUND, "Travel plan not found");
  }
  if (travelPlan.isApproved !== ITrevelIsApproved.APPROVED) {
    throw new AppError(status.NOT_FOUND, "Travel plan isnot approved");
  }

  return {
    data: travelPlan,
  };
};

const getAllTravelPlansPublic = async (query: Record<string, unknown>) => {
  const travelPlanQuery = new QueryBuilder(
    TravelPlan.find({
      isApproved: ITrevelIsApproved.APPROVED,
      status: ITrevelStatus.UPCOMING,
    })
      .populate("host", "fullname email profilePhoto") as any,
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
  const travelPlanQuery = new QueryBuilder(
    TravelPlan.find({
      status: ITrevelStatus.UPCOMING,
    })
      .populate("host", "fullname email profilePhoto") as any,
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
    )
      .populate("host", "fullname email profilePhoto");

    return { data: updatedPlan };
  } else if (isApproved === ITrevelIsApproved.APPROVED) {
    const updatedPlan = await TravelPlan.findByIdAndUpdate(
      id,
      { isApproved, status: ITrevelStatus.UPCOMING },
      { new: true }
    )
      .populate("host", "fullname email profilePhoto");
    return { data: updatedPlan };
  }
};

const cancelTravelPlan = async (id: string, userId: string) => {
  const travelPlan = await TravelPlan.findById(id);

  if (!travelPlan) {
    throw new AppError(status.NOT_FOUND, "Travel plan not found");
  }

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
    { status: ITrevelStatus.CANCELLED },
    { new: true }
  )
    .populate("host", "fullname email profilePhoto");

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

  const updatedPlan = await TravelPlan.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  )
    .populate("host", "fullname email profilePhoto");

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

  // Remove participant
  const updatedPlan = await TravelPlan.findByIdAndUpdate(
    travelPlanId,
    { $pull: { participants: { phone: participantPhone } } },
    { new: true }
  ).populate("host", "fullname email profilePhoto");

  return { data: updatedPlan };
};

export const TravelPlanServices = {
  createTravelPlan,
  getTravelPlanById,
  getAllTravelPlansPublic,
  getAllTravelPlansAdmin,
  approveTravelPlan,
  cancelTravelPlan,
  updateTravelPlan,
  addParticipantToTravelPlan,
  removeParticipantFromTravelPlan,
};
