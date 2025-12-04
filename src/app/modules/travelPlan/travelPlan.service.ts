import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import {
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

  const travelPlan = await TravelPlan.create({
    ...payload,
    host: hostId,
    slug,
  });

  return travelPlan;
};

const getTravelPlanById = async (id: string) => {
  const travelPlan = await TravelPlan.findById(id)
    .populate("host", "fullname email profilePhoto")
    .populate("participants", "fullname email profilePhoto");

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
      .populate("host", "fullname email profilePhoto")
      .populate("participants", "fullname email profilePhoto") as any,
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
      .populate("host", "fullname email profilePhoto")
      .populate("participants", "fullname email profilePhoto") as any,
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
      .populate("host", "fullname email profilePhoto")
      .populate("participants", "fullname email profilePhoto");

    return { data: updatedPlan };
  } else if (isApproved === ITrevelIsApproved.APPROVED) {
    const updatedPlan = await TravelPlan.findByIdAndUpdate(
      id,
      { isApproved, status: ITrevelStatus.UPCOMING },
      { new: true }
    )
      .populate("host", "fullname email profilePhoto")
      .populate("participants", "fullname email profilePhoto");
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
    .populate("host", "fullname email profilePhoto")
    .populate("participants", "fullname email profilePhoto");

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
    .populate("host", "fullname email profilePhoto")
    .populate("participants", "fullname email profilePhoto");

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
};
