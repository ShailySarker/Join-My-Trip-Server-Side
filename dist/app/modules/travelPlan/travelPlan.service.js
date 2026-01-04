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
    const hostParticipant = {
        userId: hostUser._id, // Cast to ObjectId
        name: hostUser.fullname,
        phone: hostUser.phone,
        gender: hostUser.gender,
        age: hostUser.age,
    };
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
    console.log(result, "----------result--------------");
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
};
