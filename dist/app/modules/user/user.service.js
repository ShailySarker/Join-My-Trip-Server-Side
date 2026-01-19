"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const env_1 = require("../../config/env");
const user_interface_1 = require("./user.interface");
const user_model_1 = require("./user.model");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const cloudinary_config_1 = require("../../config/cloudinary.config");
const QueryBuilder_1 = __importDefault(require("../../utils/QueryBuilder"));
const user_constant_1 = require("./user.constant");
const subscription_interface_1 = require("../subscription/subscription.interface");
const travelPlan_model_1 = require("../travelPlan/travelPlan.model");
const travelPlan_interface_1 = require("../travelPlan/travelPlan.interface");
const booking_model_1 = require("../booking/booking.model");
const booking_interface_1 = require("../booking/booking.interface");
const createUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { fullname, email, password } = payload, rest = __rest(payload, ["fullname", "email", "password"]);
    if (!email || !fullname || !password) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Missing required fields");
    }
    const isUserExist = yield user_model_1.User.findOne({ email });
    if (isUserExist) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User Already Exist");
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password, Number(env_1.envVars.BCRYPT.BCRYPT_SALT_ROUND));
    const user = yield user_model_1.User.create(Object.assign({ fullname,
        email, password: hashedPassword, auths: [
            {
                provider: user_interface_1.IProvider.CREDENTIAL,
                providerId: email,
            },
        ] }, rest));
    return user;
});
const getSingleUser = (id, viewerId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Check if viewer has subscription (only subscribed users can view profiles)
    if (viewerId) {
        const viewer = yield user_model_1.User.findById(viewerId);
        if (!viewer) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Viewer not found");
        }
        if (viewer.role === user_interface_1.IUserRole.USER) {
            // Check if viewer has an active paid subscription
            const hasSubscription = ((_a = viewer.subscriptionInfo) === null || _a === void 0 ? void 0 : _a.plan) &&
                (viewer.subscriptionInfo.plan === subscription_interface_1.ISubscriptionPlan.MONTHLY ||
                    viewer.subscriptionInfo.plan === subscription_interface_1.ISubscriptionPlan.YEARLY) &&
                viewer.subscriptionInfo.status === "ACTIVE";
            if (!hasSubscription) {
                throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You need an active subscription to view user profiles");
            }
        }
    }
    // Increment totalProfileViews by 1 atomically
    const user = yield user_model_1.User.findOneAndUpdate({ _id: id, isDeleted: false }, { $inc: { totalProfileViews: 1 } }, { new: true }).select("-password");
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    return {
        data: user,
    };
});
const deleteSingleUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield user_model_1.User.findById(id);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // 1. Check if user has active subscription
    if (((_a = user.subscriptionInfo) === null || _a === void 0 ? void 0 : _a.plan) &&
        user.subscriptionInfo.status === "ACTIVE" &&
        user.subscriptionInfo.expireDate &&
        new Date(user.subscriptionInfo.expireDate) > new Date()) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Cannot delete user with an active subscription.");
    }
    // 2. Check if user is hosting any ONGOING travel plan
    const ongoingHostedPlans = yield travelPlan_model_1.TravelPlan.findOne({
        host: id,
        status: travelPlan_interface_1.ITrevelStatus.ONGOING,
    });
    if (ongoingHostedPlans) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Cannot delete user who is hosting an ongoing travel plan.");
    }
    // 3. Check if user is a participant in any ONGOING travel plan (via Bookings or direct participant check)
    // Usually, being a participant implies having a booking.
    // We check bookings that are BOOKED for plans that are ONGOING.
    // Or check TravelPlans where participants.userId == id AND status == ONGOING.
    const ongoingParticipation = yield travelPlan_model_1.TravelPlan.findOne({
        "participants.userId": id,
        status: travelPlan_interface_1.ITrevelStatus.ONGOING,
    });
    if (ongoingParticipation) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Cannot delete user who is participating in an ongoing travel plan.");
    }
    // --- Deletion Process ---
    // 4. Cancel all UPCOMING travel plans created by this user
    const hostedPlans = yield travelPlan_model_1.TravelPlan.find({
        host: id,
        status: travelPlan_interface_1.ITrevelStatus.UPCOMING,
    });
    for (const plan of hostedPlans) {
        // Mark plan as CANCELLED
        yield travelPlan_model_1.TravelPlan.findByIdAndUpdate(plan._id, {
            status: travelPlan_interface_1.ITrevelStatus.CANCELLED,
        });
        // Cancel all bookings for this plan
        yield booking_model_1.Booking.updateMany({ travelId: plan._id }, { bookingStatus: booking_interface_1.IBookingStatus.CANCELLED });
    }
    // 5. Cancel all bookings made BY this user for other plans
    // And remove them from the participants list of those plans
    const userBookings = yield booking_model_1.Booking.find({
        userId: id,
        bookingStatus: booking_interface_1.IBookingStatus.BOOKED,
    });
    for (const booking of userBookings) {
        // Cancel the booking
        yield booking_model_1.Booking.findByIdAndUpdate(booking._id, {
            bookingStatus: booking_interface_1.IBookingStatus.CANCELLED,
        });
        // Remove from TravelPlan participants
        yield travelPlan_model_1.TravelPlan.findByIdAndUpdate(booking.travelId, {
            $pull: { participants: { userId: id } },
        });
    }
    // 6. Finally, soft delete the user
    const deletedUser = yield user_model_1.User.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true }, { new: true });
    return { data: deletedUser };
});
const getMe = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select("-password");
    return {
        data: user,
    };
});
const getMyFollowers = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select("myFollowers");
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // Populate follower details with QueryBuilder
    const followersQuery = new QueryBuilder_1.default(user_model_1.User.find({
        _id: { $in: user.myFollowers },
        isDeleted: false,
    }).select("-password"), query)
        .search(user_constant_1.searchableFields)
        .filter(user_constant_1.filterableFields)
        .sort(user_constant_1.sortableFields)
        .paginate()
        .fields();
    const result = yield followersQuery.execute();
    return result;
});
const getMyFollowings = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select("myFollowings");
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // Populate following details with QueryBuilder
    const followingsQuery = new QueryBuilder_1.default(user_model_1.User.find({
        _id: { $in: user.myFollowings },
        isDeleted: false,
    }).select("-password"), query)
        .search(user_constant_1.searchableFields)
        .filter(user_constant_1.filterableFields)
        .sort(user_constant_1.sortableFields)
        .paginate()
        .fields();
    const result = yield followingsQuery.execute();
    return result;
});
const toggleFollow = (currentUserId, targetUserId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // Prevent users from following themselves
    if (currentUserId === targetUserId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You cannot follow yourself");
    }
    // Check if target user exists
    const targetUser = yield user_model_1.User.findOne({
        _id: targetUserId,
        isDeleted: false,
        isVerified: true,
    });
    if (!targetUser) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Target user is unverified or deactivated");
    }
    // Check if current user exists
    const currentUser = yield user_model_1.User.findOne({
        _id: currentUserId,
        isDeleted: false,
        isVerified: true,
    });
    if (!currentUser) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Current user is unverified or deactivated");
    }
    // Check if both users have active paid subscriptions
    const currentUserHasSubscription = ((_a = currentUser.subscriptionInfo) === null || _a === void 0 ? void 0 : _a.plan) &&
        (currentUser.subscriptionInfo.plan === subscription_interface_1.ISubscriptionPlan.MONTHLY ||
            currentUser.subscriptionInfo.plan === subscription_interface_1.ISubscriptionPlan.YEARLY) &&
        currentUser.subscriptionInfo.status === "ACTIVE";
    const targetUserHasSubscription = ((_b = targetUser.subscriptionInfo) === null || _b === void 0 ? void 0 : _b.plan) &&
        (targetUser.subscriptionInfo.plan === subscription_interface_1.ISubscriptionPlan.MONTHLY ||
            targetUser.subscriptionInfo.plan === subscription_interface_1.ISubscriptionPlan.YEARLY) &&
        targetUser.subscriptionInfo.status === "ACTIVE";
    if (!currentUserHasSubscription) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You need an active subscription to follow users");
    }
    if (!targetUserHasSubscription) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "This user does not have an active subscription and cannot be followed");
    }
    // Check if already following
    const isFollowing = (_c = currentUser.myFollowings) === null || _c === void 0 ? void 0 : _c.includes(targetUserId);
    if (isFollowing) {
        // Unfollow: Remove from both arrays
        yield user_model_1.User.findByIdAndUpdate(currentUserId, {
            $pull: { myFollowings: targetUserId },
        });
        yield user_model_1.User.findByIdAndUpdate(targetUserId, {
            $pull: { myFollowers: currentUserId },
        });
        return {
            message: "User unfollowed successfully",
            isFollowing: false,
        };
    }
    else {
        // Follow: Add to both arrays
        yield user_model_1.User.findByIdAndUpdate(currentUserId, {
            $addToSet: { myFollowings: targetUserId },
        });
        yield user_model_1.User.findByIdAndUpdate(targetUserId, {
            $addToSet: { myFollowers: currentUserId },
        });
        return {
            message: "User followed successfully",
            isFollowing: true,
        };
    }
});
const updateUserProfile = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ _id: userId, isDeleted: false });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const updatedUser = yield user_model_1.User.findByIdAndUpdate(userId, { $set: payload }, {
        new: true,
        runValidators: true,
    }).select("-password");
    if (payload.profilePhoto && user.profilePhoto) {
        yield (0, cloudinary_config_1.deleteImageFromCloudinary)(user.profilePhoto);
    }
    if (!updatedUser) {
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to update user");
    }
    return {
        data: updatedUser,
    };
});
const getAllUsers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const userQuery = new QueryBuilder_1.default(user_model_1.User.find({ isDeleted: false, role: user_interface_1.IUserRole.USER }).select("-password"), query);
    const result = yield userQuery
        .search(user_constant_1.searchableFields)
        .filter(user_constant_1.filterableFields)
        .sort(user_constant_1.sortableFields)
        // .sortBy()
        .paginate()
        .fields()
        .execute();
    return result;
});
const getUserDashboardStats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const user = yield user_model_1.User.findById(userId).select("-password");
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // Import models (if not already imported at top)
    const { TravelPlan } = yield Promise.resolve().then(() => __importStar(require("../travelPlan/travelPlan.model")));
    const { Booking } = yield Promise.resolve().then(() => __importStar(require("../booking/booking.model")));
    const { Review } = yield Promise.resolve().then(() => __importStar(require("../review/review.model")));
    const { ITrevelStatus } = yield Promise.resolve().then(() => __importStar(require("../travelPlan/travelPlan.interface")));
    const { IBookingStatus } = yield Promise.resolve().then(() => __importStar(require("../booking/booking.interface")));
    // Get travel plan stats
    const totalTravelPlans = yield TravelPlan.countDocuments({ host: userId });
    const upcomingTravels = yield TravelPlan.countDocuments({
        host: userId,
        status: ITrevelStatus.UPCOMING,
    });
    const ongoingTravels = yield TravelPlan.countDocuments({
        host: userId,
        status: ITrevelStatus.ONGOING,
    });
    const completedTravels = yield TravelPlan.countDocuments({
        host: userId,
        status: ITrevelStatus.COMPLETED,
    });
    // Get booking stats
    const totalBookings = yield Booking.countDocuments({ userId });
    const activeBookings = yield Booking.countDocuments({
        userId,
        bookingStatus: { $in: [IBookingStatus.BOOKED, IBookingStatus.CANCELLED] },
    });
    // Get review stats
    const givenReviews = yield Review.countDocuments({ reviewerId: userId });
    const receivedReviews = yield Review.countDocuments({ revieweeId: userId });
    // Get recent activity (last 10 items)
    const recentBookings = yield Booking.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("travelId", "title destination");
    const recentReviews = yield Review.find({ revieweeId: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("reviewerId", "fullname profilePhoto");
    const recentTravelPlans = yield TravelPlan.find({ host: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title status isApproved createdAt");
    // Combine and sort recent activity
    const recentActivity = [
        ...recentBookings.map((booking) => {
            var _a;
            return ({
                type: "booking",
                title: "New Booking Created",
                description: ((_a = booking.travelId) === null || _a === void 0 ? void 0 : _a.title) || "Travel Plan",
                date: booking.createdAt,
                status: booking.bookingStatus.toLowerCase(),
            });
        }),
        ...recentReviews.map((review) => {
            var _a;
            return ({
                type: "review",
                title: "Received a Review",
                description: `${review.rating} stars from ${((_a = review.reviewerId) === null || _a === void 0 ? void 0 : _a.fullname) || "User"}`,
                date: review.createdAt,
            });
        }),
        ...recentTravelPlans.map((plan) => ({
            type: "travel",
            title: "Travel Plan Update",
            description: plan.title,
            date: plan.createdAt,
            status: plan.isApproved.toLowerCase(),
        })),
    ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    return {
        data: {
            totalTravelPlans,
            upcomingTravels,
            ongoingTravels,
            completedTravels,
            totalBookings,
            activeBookings,
            averageRating: user.averageRating || 0,
            totalReviews: user.reviewCount || 0,
            givenReviews,
            receivedReviews,
            followers: ((_a = user.myFollowers) === null || _a === void 0 ? void 0 : _a.length) || 0,
            following: ((_b = user.myFollowings) === null || _b === void 0 ? void 0 : _b.length) || 0,
            recentActivity,
        },
    };
});
const getPublicStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const { TravelPlan } = yield Promise.resolve().then(() => __importStar(require("../travelPlan/travelPlan.model")));
    const { Booking } = yield Promise.resolve().then(() => __importStar(require("../booking/booking.model")));
    const { Review } = yield Promise.resolve().then(() => __importStar(require("../review/review.model")));
    const { ITrevelStatus } = yield Promise.resolve().then(() => __importStar(require("../travelPlan/travelPlan.interface")));
    const totalUsers = yield user_model_1.User.countDocuments({
        isDeleted: false,
        role: user_interface_1.IUserRole.USER,
    });
    const totalTravelPlans = yield TravelPlan.countDocuments();
    const totalBookings = yield Booking.countDocuments();
    const totalReviews = yield Review.countDocuments();
    // Status distribution for basic graph
    const statusData = [
        {
            name: "Upcoming",
            value: yield TravelPlan.countDocuments({
                status: ITrevelStatus.UPCOMING,
            }),
        },
        {
            name: "Ongoing",
            value: yield TravelPlan.countDocuments({ status: ITrevelStatus.ONGOING }),
        },
        {
            name: "Completed",
            value: yield TravelPlan.countDocuments({
                status: ITrevelStatus.COMPLETED,
            }),
        },
    ];
    // Calculate average rating across all reviews
    const reviews = yield Review.find().select("rating");
    const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;
    return {
        data: {
            totalUsers,
            totalTravelPlans,
            totalBookings,
            totalReviews,
            averageRating,
            statusData,
        },
    };
});
exports.UserServices = {
    createUser,
    getSingleUser,
    getMe,
    deleteSingleUser,
    updateUserProfile,
    getAllUsers,
    getMyFollowers,
    getMyFollowings,
    toggleFollow,
    getUserDashboardStats,
    getPublicStats,
};
