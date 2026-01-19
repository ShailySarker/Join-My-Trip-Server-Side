import status from "http-status";
import { envVars } from "../../config/env";
import { IUser, IUserRole } from "./user.interface";
import { User } from "./user.model";
import AppError from "../../errorHelpers/AppError";
import bcryptjs from "bcryptjs";
import { JwtPayload } from "jsonwebtoken";
import { deleteImageFromCloudinary } from "../../config/cloudinary.config";
import QueryBuilder from "../../utils/QueryBuilder";
import {
  filterableFields,
  searchableFields,
  sortableFields,
} from "./user.constant";
import { ISubscriptionPlan } from "../subscription/subscription.interface";
import { TravelPlan } from "../travelPlan/travelPlan.model";
import { ITrevelStatus } from "../travelPlan/travelPlan.interface";
import { Booking } from "../booking/booking.model";
import { IBookingStatus } from "../booking/booking.interface";

const createUser = async (payload: Partial<IUser>) => {
  const { fullname, email, password, ...rest } = payload;

  if (!email || !fullname || !password) {
    throw new AppError(status.BAD_REQUEST, "Missing required fields");
  }

  const isUserExist = await User.findOne({ email });

  if (isUserExist) {
    throw new AppError(status.BAD_REQUEST, "User Already Exist");
  }

  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(envVars.BCRYPT.BCRYPT_SALT_ROUND),
  );

  const user = await User.create({
    fullname,
    email,
    password: hashedPassword,
    auths: [
      {
        provider: "Credential",
        providerId: email,
      },
    ],
    ...rest,
  });

  return user;
};

const getSingleUser = async (id: string, viewerId?: string) => {
  // Check if viewer has subscription (only subscribed users can view profiles)
  if (viewerId) {
    const viewer = await User.findById(viewerId);
    if (!viewer) {
      throw new AppError(status.NOT_FOUND, "Viewer not found");
    }

    if (viewer.role === IUserRole.USER) {
      // Check if viewer has an active paid subscription
      const hasSubscription =
        viewer.subscriptionInfo?.plan &&
        (viewer.subscriptionInfo.plan === ISubscriptionPlan.MONTHLY ||
          viewer.subscriptionInfo.plan === ISubscriptionPlan.YEARLY) &&
        viewer.subscriptionInfo.status === "ACTIVE";

      if (!hasSubscription) {
        throw new AppError(
          status.FORBIDDEN,
          "You need an active subscription to view user profiles",
        );
      }
    }
  }

  // Increment totalProfileViews by 1 atomically
  const user = await User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $inc: { totalProfileViews: 1 } },
    { new: true },
  ).select("-password");

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  return {
    data: user,
  };
};

const deleteSingleUser = async (id: string) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // 1. Check if user has active subscription
  if (
    user.subscriptionInfo?.plan &&
    user.subscriptionInfo.status === "ACTIVE" &&
    user.subscriptionInfo.expireDate &&
    new Date(user.subscriptionInfo.expireDate) > new Date()
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot delete user with an active subscription.",
    );
  }

  // 2. Check if user is hosting any ONGOING travel plan
  const ongoingHostedPlans = await TravelPlan.findOne({
    host: id,
    status: ITrevelStatus.ONGOING,
  });

  if (ongoingHostedPlans) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot delete user who is hosting an ongoing travel plan.",
    );
  }

  // 3. Check if user is a participant in any ONGOING travel plan (via Bookings or direct participant check)
  // Usually, being a participant implies having a booking.
  // We check bookings that are BOOKED for plans that are ONGOING.
  // Or check TravelPlans where participants.userId == id AND status == ONGOING.

  const ongoingParticipation = await TravelPlan.findOne({
    "participants.userId": id,
    status: ITrevelStatus.ONGOING,
  });

  if (ongoingParticipation) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot delete user who is participating in an ongoing travel plan.",
    );
  }

  // --- Deletion Process ---

  // 4. Cancel all UPCOMING travel plans created by this user
  const hostedPlans = await TravelPlan.find({
    host: id,
    status: ITrevelStatus.UPCOMING,
  });

  for (const plan of hostedPlans) {
    // Mark plan as CANCELLED
    await TravelPlan.findByIdAndUpdate(plan._id, {
      status: ITrevelStatus.CANCELLED,
    });

    // Cancel all bookings for this plan
    await Booking.updateMany(
      { travelId: plan._id },
      { bookingStatus: IBookingStatus.CANCELLED },
    );
  }

  // 5. Cancel all bookings made BY this user for other plans
  // And remove them from the participants list of those plans
  const userBookings = await Booking.find({
    userId: id,
    bookingStatus: IBookingStatus.BOOKED,
  });

  for (const booking of userBookings) {
    // Cancel the booking
    await Booking.findByIdAndUpdate(booking._id, {
      bookingStatus: IBookingStatus.CANCELLED,
    });

    // Remove from TravelPlan participants
    await TravelPlan.findByIdAndUpdate(booking.travelId, {
      $pull: { participants: { userId: id } },
    });
  }

  // 6. Finally, soft delete the user
  const deletedUser = await User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );

  return { data: deletedUser };
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  return {
    data: user,
  };
};

const getMyFollowers = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  const user = await User.findById(userId).select("myFollowers");

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // Populate follower details with QueryBuilder
  const followersQuery = new QueryBuilder(
    User.find({
      _id: { $in: user.myFollowers },
      isDeleted: false,
    }).select("-password") as any,
    query,
  )
    .search(searchableFields)
    .filter(filterableFields)
    .sort(sortableFields)
    .paginate()
    .fields();

  const result = await followersQuery.execute();
  return result;
};

const getMyFollowings = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  const user = await User.findById(userId).select("myFollowings");

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // Populate following details with QueryBuilder
  const followingsQuery = new QueryBuilder(
    User.find({
      _id: { $in: user.myFollowings },
      isDeleted: false,
    }).select("-password") as any,
    query,
  )
    .search(searchableFields)
    .filter(filterableFields)
    .sort(sortableFields)
    .paginate()
    .fields();

  const result = await followingsQuery.execute();
  return result;
};

const toggleFollow = async (currentUserId: string, targetUserId: string) => {
  // Prevent users from following themselves
  if (currentUserId === targetUserId) {
    throw new AppError(status.BAD_REQUEST, "You cannot follow yourself");
  }

  // Check if target user exists
  const targetUser = await User.findOne({
    _id: targetUserId,
    isDeleted: false,
    isVerified: true,
  });

  if (!targetUser) {
    throw new AppError(
      status.NOT_FOUND,
      "Target user is unverified or deactivated",
    );
  }

  // Check if current user exists
  const currentUser = await User.findOne({
    _id: currentUserId,
    isDeleted: false,
    isVerified: true,
  });

  if (!currentUser) {
    throw new AppError(
      status.NOT_FOUND,
      "Current user is unverified or deactivated",
    );
  }

  // Check if both users have active paid subscriptions
  const currentUserHasSubscription =
    currentUser.subscriptionInfo?.plan &&
    (currentUser.subscriptionInfo.plan === ISubscriptionPlan.MONTHLY ||
      currentUser.subscriptionInfo.plan === ISubscriptionPlan.YEARLY) &&
    currentUser.subscriptionInfo.status === "ACTIVE";

  const targetUserHasSubscription =
    targetUser.subscriptionInfo?.plan &&
    (targetUser.subscriptionInfo.plan === ISubscriptionPlan.MONTHLY ||
      targetUser.subscriptionInfo.plan === ISubscriptionPlan.YEARLY) &&
    targetUser.subscriptionInfo.status === "ACTIVE";

  if (!currentUserHasSubscription) {
    throw new AppError(
      status.FORBIDDEN,
      "You need an active subscription to follow users",
    );
  }

  if (!targetUserHasSubscription) {
    throw new AppError(
      status.FORBIDDEN,
      "This user does not have an active subscription and cannot be followed",
    );
  }

  // Check if already following
  const isFollowing = currentUser.myFollowings?.includes(targetUserId);

  if (isFollowing) {
    // Unfollow: Remove from both arrays
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { myFollowings: targetUserId },
    });

    await User.findByIdAndUpdate(targetUserId, {
      $pull: { myFollowers: currentUserId },
    });

    return {
      message: "User unfollowed successfully",
      isFollowing: false,
    };
  } else {
    // Follow: Add to both arrays
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { myFollowings: targetUserId },
    });

    await User.findByIdAndUpdate(targetUserId, {
      $addToSet: { myFollowers: currentUserId },
    });

    return {
      message: "User followed successfully",
      isFollowing: true,
    };
  }
};

const updateUserProfile = async (userId: string, payload: Partial<IUser>) => {
  const user = await User.findOne({ _id: userId, isDeleted: false });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  ).select("-password");

  if (payload.profilePhoto && user.profilePhoto) {
    await deleteImageFromCloudinary(user.profilePhoto);
  }

  if (!updatedUser) {
    throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to update user");
  }

  return {
    data: updatedUser,
  };
};

const getAllUsers = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(
    User.find({ isDeleted: false, role: IUserRole.USER }).select(
      "-password",
    ) as any,
    query,
  );

  const result = await userQuery
    .search(searchableFields)
    .filter(filterableFields)
    .sort(sortableFields)
    // .sortBy()
    .paginate()
    .fields()
    .execute();

  return result;
};

const getUserDashboardStats = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // Import models (if not already imported at top)
  const { TravelPlan } = await import("../travelPlan/travelPlan.model");
  const { Booking } = await import("../booking/booking.model");
  const { Review } = await import("../review/review.model");
  const { ITrevelStatus } = await import("../travelPlan/travelPlan.interface");
  const { IBookingStatus } = await import("../booking/booking.interface");

  // Get travel plan stats
  const totalTravelPlans = await TravelPlan.countDocuments({ host: userId });
  const upcomingTravels = await TravelPlan.countDocuments({
    host: userId,
    status: ITrevelStatus.UPCOMING,
  });
  const ongoingTravels = await TravelPlan.countDocuments({
    host: userId,
    status: ITrevelStatus.ONGOING,
  });
  const completedTravels = await TravelPlan.countDocuments({
    host: userId,
    status: ITrevelStatus.COMPLETED,
  });

  // Get booking stats
  const totalBookings = await Booking.countDocuments({ userId });
  const activeBookings = await Booking.countDocuments({
    userId,
    bookingStatus: { $in: [IBookingStatus.BOOKED, IBookingStatus.CANCELLED] },
  });

  // Get review stats
  const givenReviews = await Review.countDocuments({ reviewerId: userId });
  const receivedReviews = await Review.countDocuments({ revieweeId: userId });

  // Get recent activity (last 10 items)
  const recentBookings = await Booking.find({ userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("travelId", "title destination");

  const recentReviews = await Review.find({ revieweeId: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("reviewerId", "fullname profilePhoto");

  const recentTravelPlans = await TravelPlan.find({ host: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("title status isApproved createdAt");

  // Combine and sort recent activity
  const recentActivity = [
    ...recentBookings.map((booking: any) => ({
      type: "booking",
      title: "New Booking Created",
      description: booking.travelId?.title || "Travel Plan",
      date: booking.createdAt,
      status: booking.bookingStatus.toLowerCase(),
    })),
    ...recentReviews.map((review: any) => ({
      type: "review",
      title: "Received a Review",
      description: `${review.rating} stars from ${review.reviewerId?.fullname || "User"}`,
      date: review.createdAt,
    })),
    ...recentTravelPlans.map((plan: any) => ({
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
      followers: user.myFollowers?.length || 0,
      following: user.myFollowings?.length || 0,
      recentActivity,
    },
  };
};

const getPublicStats = async () => {
  const { TravelPlan } = await import("../travelPlan/travelPlan.model");
  const { Booking } = await import("../booking/booking.model");
  const { Review } = await import("../review/review.model");
  const { ITrevelStatus } = await import("../travelPlan/travelPlan.interface");

  const totalUsers = await User.countDocuments({
    isDeleted: false,
    role: IUserRole.USER,
  });
  const totalTravelPlans = await TravelPlan.countDocuments();
  const totalBookings = await Booking.countDocuments();
  const totalReviews = await Review.countDocuments();

  // Status distribution for basic graph
  const statusData = [
    {
      name: "Upcoming",
      value: await TravelPlan.countDocuments({
        status: ITrevelStatus.UPCOMING,
      }),
    },
    {
      name: "Ongoing",
      value: await TravelPlan.countDocuments({ status: ITrevelStatus.ONGOING }),
    },
    {
      name: "Completed",
      value: await TravelPlan.countDocuments({
        status: ITrevelStatus.COMPLETED,
      }),
    },
  ];

  // Calculate average rating across all reviews
  const reviews = await Review.find().select("rating");
  const averageRating =
    reviews.length > 0
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
};

export const UserServices = {
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
