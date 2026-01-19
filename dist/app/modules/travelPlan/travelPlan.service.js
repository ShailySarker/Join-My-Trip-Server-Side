"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelPlanServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const travelPlan_interface_1 = require("./travelPlan.interface");
const travelPlan_model_1 = require("./travelPlan.model");
const QueryBuilder_1 = __importDefault(require("../../utils/QueryBuilder"));
const travelPlan_constant_1 = require("./travelPlan.constant");
const generateSlug_1 = require("../../utils/generateSlug");
const cloudinary_config_1 = require("../../config/cloudinary.config");
const user_model_1 = require("../user/user.model");
const booking_model_1 = require("../booking/booking.model");
const booking_interface_1 = require("../booking/booking.interface");
const createTravelPlan = (hostId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const slug = (0, generateSlug_1.generateSlug)(payload.title);
    const existingPlan = yield travelPlan_model_1.TravelPlan.findOne({ slug });
    if (existingPlan) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "A travel plan with this title already exists");
    }
    // Get host user details to create default participant
    const hostUser = yield user_model_1.User.findById(hostId);
    if (!hostUser) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Host user not found");
    }
    // Validate host has required information for participant
    if (!hostUser.phone || !hostUser.gender || !hostUser.age) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Please complete your profile setup (age, phone and gender required) before creating a travel plan");
    }
    if (!hostUser.age) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Please complete your profile (age required) before creating a travel plan");
    }
    if (hostUser.age === null) {
        new AppError_1.default(http_status_1.default.BAD_REQUEST, "Your need to update your profile age info to create a travel plan");
    }
    if (hostUser.age < 18) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You must be at least 18 years old to create a travel plan");
    }
    if (hostUser.age < payload.minAge) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `${hostUser.fullname} must be at least ${payload.minAge} years old to book this travel plan.`);
    }
    // Check for overlapping non-cancelled travel plans where user is HOST
    // Validate dates: Start date must be at least 7 days from today
    const minStartDate = new Date();
    minStartDate.setDate(minStartDate.getDate() + 7);
    minStartDate.setHours(0, 0, 0, 0);
    const providedStartDate = new Date(payload.startDate);
    if (providedStartDate < minStartDate) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Start date must be at least 7 days from today");
    }
    // Validate dates: End date must be after Start date
    const providedEndDate = new Date(payload.endDate);
    if (providedEndDate < providedStartDate) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "End date must be after start date");
    }
    // Check for overlapping non-cancelled travel plans where user is HOST
    // Logic mirrored from booking service as requested
    const newStart = providedStartDate.getTime();
    const newEnd = providedEndDate.getTime();
    const overlappingHostedPlans = yield travelPlan_model_1.TravelPlan.find({
        host: hostId,
        status: { $ne: travelPlan_interface_1.ITrevelStatus.CANCELLED },
    });
    for (const plan of overlappingHostedPlans) {
        const existingStart = new Date(plan.startDate).getTime();
        const existingEnd = new Date(plan.endDate).getTime();
        // Check for overlap: (StartA <= EndB) and (EndA >= StartB)
        if (newStart <= existingEnd && newEnd >= existingStart) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `You are already hosting a travel plan during this time range: ${plan.title}`);
        }
    }
    const hostParticipant = {
        userId: hostUser._id, // Cast to ObjectId
        name: hostUser.fullname,
        phone: hostUser.phone,
        gender: hostUser.gender,
        age: hostUser.age,
    };
    // Check for overlapping bookings where user is PARTICIPANT
    const userBookings = yield booking_model_1.Booking.find({
        userId: hostId,
        bookingStatus: { $ne: "CANCELLED" },
    }).populate("travelId");
    for (const booking of userBookings) {
        const existingPlan = booking.travelId;
        if (existingPlan && existingPlan.startDate && existingPlan.endDate) {
            const existingStart = new Date(existingPlan.startDate).getTime();
            const existingEnd = new Date(existingPlan.endDate).getTime();
            // Check for overlap
            if (newStart <= existingEnd && newEnd >= existingStart) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `You already have a travel plan booked for this time range: ${existingPlan.title}`);
            }
        }
    }
    const travelPlan = yield travelPlan_model_1.TravelPlan.create(Object.assign(Object.assign({}, payload), { host: hostId, slug, participants: [hostParticipant] }));
    return yield travelPlan.populate("host", "fullname email profilePhoto");
});
const getMyTravelPlan = (hostId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const host = yield user_model_1.User.findById(hostId);
    if (!host) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Host user not found");
    }
    const travelPlanQuery = new QueryBuilder_1.default(travelPlan_model_1.TravelPlan.find({
        host: hostId,
        // isApproved: ITrevelIsApproved.APPROVED,
        // status: ITrevelStatus.UPCOMING,
    }).populate("host", "fullname email profilePhoto"), query);
    const result = yield travelPlanQuery
        .search(travelPlan_constant_1.searchableFields)
        .filter(travelPlan_constant_1.filterableFields)
        .filterByRange() // Filter by budget and date ranges
        .sort(travelPlan_constant_1.sortableFields)
        .paginate()
        .fields()
        .execute();
    if (!result) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "No travel plan found");
    }
    return result;
});
const getTravelPlanById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const travelPlan = yield travelPlan_model_1.TravelPlan.findById(id).populate("host", "fullname email profilePhoto");
    if (!travelPlan) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Travel plan not found");
    }
    // if (travelPlan.isApproved !== ITrevelIsApproved.APPROVED) {
    //   throw new AppError(status.NOT_FOUND, "Travel plan is not approved");
    // }
    return {
        data: travelPlan,
    };
});
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
const getAllTravelPlansPublic = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const travelPlanQuery = new QueryBuilder_1.default(travelPlan_model_1.TravelPlan.find({
        isApproved: travelPlan_interface_1.ITrevelIsApproved.APPROVED,
        status: travelPlan_interface_1.ITrevelStatus.UPCOMING,
    }).populate("host", "fullname email profilePhoto"), query);
    const result = yield travelPlanQuery
        .search(travelPlan_constant_1.searchableFields)
        .filter(travelPlan_constant_1.filterableFields)
        .filterByRange() // Filter by budget and date ranges
        .sort(travelPlan_constant_1.sortableFields)
        .paginate()
        .fields()
        .execute();
    return result;
});
const getAllTravelPlansAdmin = (query) => __awaiter(void 0, void 0, void 0, function* () {
    // const admin = await User.findById(adminId);
    // if (!admin || admin.role !== IUserRole.ADMIN || IUserRole.SUPER_ADMIN) {
    //   throw new AppError(
    //     status.FORBIDDEN,
    //     "You are not authorized to access this route"
    //   );
    // }
    const travelPlanQuery = new QueryBuilder_1.default(travelPlan_model_1.TravelPlan.find({
    // status: ITrevelStatus.UPCOMING,
    }).populate("host", "fullname email profilePhoto"), query);
    const result = yield travelPlanQuery
        .search(travelPlan_constant_1.searchableFields)
        .filter(travelPlan_constant_1.filterableFields)
        .filterByRange() // Filter by budget and date ranges
        .sort(travelPlan_constant_1.sortableFields)
        .paginate()
        .fields()
        .execute();
    return result;
});
const approveTravelPlan = (id, isApproved) => __awaiter(void 0, void 0, void 0, function* () {
    const travelPlan = yield travelPlan_model_1.TravelPlan.findById(id);
    if (!travelPlan) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Travel plan not found");
    }
    if (isApproved === travelPlan_interface_1.ITrevelIsApproved.REJECTED) {
        const updatedPlan = yield travelPlan_model_1.TravelPlan.findByIdAndUpdate(id, { isApproved, status: travelPlan_interface_1.ITrevelStatus.CANCELLED }, { new: true }).populate("host", "fullname email profilePhoto");
        return { data: updatedPlan };
    }
    else if (isApproved === travelPlan_interface_1.ITrevelIsApproved.APPROVED) {
        const updatedPlan = yield travelPlan_model_1.TravelPlan.findByIdAndUpdate(id, 
        // { isApproved },
        { isApproved, status: travelPlan_interface_1.ITrevelStatus.UPCOMING }, { new: true }).populate("host", "fullname email profilePhoto");
        return { data: updatedPlan };
    }
});
const cancelTravelPlan = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const travelPlan = yield travelPlan_model_1.TravelPlan.findById(id);
    if (!travelPlan) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Travel plan not found");
    }
    const booking = yield booking_model_1.Booking.findById({ travelId: id });
    // Check authorization: only host or admin can cancel
    const isHost = travelPlan.host.toString() === userId;
    if (!isHost) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Only the host can cancel this travel plan");
    }
    if (travelPlan.isApproved == travelPlan_interface_1.ITrevelIsApproved.APPROVED) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "An approved travel plan cannot be cancelled");
    }
    if (travelPlan.status === travelPlan_interface_1.ITrevelStatus.CANCELLED) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Travel plan is already cancelled");
    }
    if (travelPlan.status === travelPlan_interface_1.ITrevelStatus.ONGOING) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Cannot cancel an ongoing travel plan");
    }
    if (travelPlan.status === travelPlan_interface_1.ITrevelStatus.COMPLETED) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Cannot cancel a completed travel plan");
    }
    const updatedPlan = yield travelPlan_model_1.TravelPlan.findByIdAndUpdate(id, { status: travelPlan_interface_1.ITrevelStatus.CANCELLED, isApproved: travelPlan_interface_1.ITrevelIsApproved.REJECTED }, { new: true }).populate("host", "fullname email profilePhoto");
    // Cancel all bookings associated with this travel plan
    yield booking_model_1.Booking.updateMany({ travelId: id }, { bookingStatus: booking_interface_1.IBookingStatus.CANCELLED });
    return { data: updatedPlan };
});
const updateTravelPlan = (id, userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const travelPlan = yield travelPlan_model_1.TravelPlan.findById(id);
    if (!travelPlan) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Travel plan not found");
    }
    // Check authorization: only host can update
    const isHost = travelPlan.host.toString() === userId;
    if (!isHost) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Only the host can update this travel plan");
    }
    if (travelPlan.status === travelPlan_interface_1.ITrevelStatus.CANCELLED ||
        travelPlan.status === travelPlan_interface_1.ITrevelStatus.ONGOING ||
        travelPlan.status === travelPlan_interface_1.ITrevelStatus.COMPLETED) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `${travelPlan.status} - Travel plan cannot be updated`);
    }
    if (travelPlan.isApproved === travelPlan_interface_1.ITrevelIsApproved.APPROVED ||
        travelPlan.isApproved === travelPlan_interface_1.ITrevelIsApproved.REJECTED) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `${travelPlan.isApproved} - Travel plan cannot be updated`);
    }
    if (payload.title) {
        const newSlug = (0, generateSlug_1.generateSlug)(payload.title);
        const existingPlan = yield travelPlan_model_1.TravelPlan.findOne({
            slug: newSlug,
            _id: { $ne: id },
        });
        if (existingPlan) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "A travel plan with this title already exists");
        }
        payload.slug = newSlug;
    }
    if (payload.image && travelPlan.image) {
        yield (0, cloudinary_config_1.deleteImageFromCloudinary)(travelPlan.image);
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
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Start date must be at least 7 days from today");
        }
    }
    // Ensure End Date >= Start Date
    if (newEnd < newStart) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "End date must be after or equal to start date");
    }
    // Check for conflicts with existing hosted plans (excluding current plan)
    if (payload.startDate || payload.endDate) {
        const activeHostedPlans = yield travelPlan_model_1.TravelPlan.find({
            host: userId,
            _id: { $ne: id },
            status: { $ne: travelPlan_interface_1.ITrevelStatus.CANCELLED },
        });
        for (const plan of activeHostedPlans) {
            const existingStart = new Date(plan.startDate).getTime();
            const existingEnd = new Date(plan.endDate).getTime();
            // Overlap condition: (StartA <= EndB) and (EndA >= StartB)
            if (newStart <= existingEnd && newEnd >= existingStart) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Rescheduling conflict: You have another travel plan '${plan.title}' during this period.`);
            }
        }
    }
    const updatedPlan = yield travelPlan_model_1.TravelPlan.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true }).populate("host", "fullname email profilePhoto");
    return { data: updatedPlan };
});
// Add participant to travel plan (before booking)
const addParticipantToTravelPlan = (travelPlanId, userId, participantData) => __awaiter(void 0, void 0, void 0, function* () {
    const travelPlan = yield travelPlan_model_1.TravelPlan.findById(travelPlanId);
    if (!travelPlan) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Travel plan not found");
    }
    // Only host can add participants before booking
    if (travelPlan.host.toString() !== userId) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Only the host can add participants to their travel plan");
    }
    // Validate travel plan is in valid state
    if (travelPlan.status !== travelPlan_interface_1.ITrevelStatus.UPCOMING) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Cannot add participants to a non-upcoming travel plan");
    }
    // Check if participant already exists (by phone number)
    const existingParticipant = travelPlan.participants.find((p) => p.phone === participantData.phone);
    if (existingParticipant) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "A participant with this phone number already exists");
    }
    // Check max guest limit
    if (travelPlan.participants.length >= travelPlan.maxGuest) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Maximum guest limit (${travelPlan.maxGuest}) reached`);
    }
    // Validate participant age against travel plan requirements
    if (participantData.age < travelPlan.minAge) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Participant age must be at least ${travelPlan.minAge} years`);
    }
    // Add participant
    const updatedPlan = yield travelPlan_model_1.TravelPlan.findByIdAndUpdate(travelPlanId, { $push: { participants: participantData } }, { new: true, runValidators: true }).populate("host", "fullname email profilePhoto");
    return { data: updatedPlan };
});
// Remove participant from travel plan (before booking)
const removeParticipantFromTravelPlan = (travelPlanId, participantPhone, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const travelPlan = yield travelPlan_model_1.TravelPlan.findById(travelPlanId);
    if (!travelPlan) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Travel plan not found");
    }
    // Only host can remove participants
    if (travelPlan.host.toString() !== userId) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Only the host can remove participants from their travel plan");
    }
    // Find participant
    const participant = travelPlan.participants.find((p) => p.phone === participantPhone);
    if (!participant) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Participant not found");
    }
    // Cannot remove participant if they have a booking
    if (participant.bookingId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Cannot remove participant with an active booking. They must cancel their booking first.");
    }
    // Cannot remove the host from the participant list
    if (participant.userId &&
        participant.userId.toString() === travelPlan.host.toString()) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Cannot remove the host from the participant list");
    }
    // Remove participant
    const updatedPlan = yield travelPlan_model_1.TravelPlan.findByIdAndUpdate(travelPlanId, { $pull: { participants: { phone: participantPhone } } }, { new: true }).populate("host", "fullname email profilePhoto");
    return { data: updatedPlan };
});
const getPopularDestinations = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield travelPlan_model_1.TravelPlan.aggregate([
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
});
exports.TravelPlanServices = {
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
