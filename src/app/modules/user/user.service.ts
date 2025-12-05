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
    Number(envVars.BCRYPT.BCRYPT_SALT_ROUND)
  );

  const user = await User.create({
    fullname,
    email,
    password: hashedPassword,
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

    // Check if viewer has an active paid subscription
    const hasSubscription =
      viewer.subscriptionInfo?.plan &&
      (viewer.subscriptionInfo.plan === ISubscriptionPlan.MONTHLY || viewer.subscriptionInfo.plan === ISubscriptionPlan.YEARLY) &&
      viewer.subscriptionInfo.status === "ACTIVE";

    if (!hasSubscription) {
      throw new AppError(
        status.FORBIDDEN,
        "You need an active subscription to view user profiles"
      );
    }
  }

  // Increment totalProfileViews by 1 atomically
  const user = await User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $inc: { totalProfileViews: 1 } },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  return {
    data: user,
  };
};

const deleteSingleUser = async (id: string) => {
  const user = await User.findOneAndUpdate(
    { _id: id, isDeleted: false }, // find only active user
    { isDeleted: true }, // mark as deleted
    { new: true } // return updated user
  );

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  return { data: user };
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  return {
    data: user,
  };
};

const getMyFollowers = async (userId: string) => {
  const user = await User.findById(userId).select("myFollowers");

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // Populate follower details
  const followers = await User.find({
    _id: { $in: user.myFollowers },
    isDeleted: false,
  }).select("-password");

  return {
    data: followers,
  };
};

const getMyFollowings = async (userId: string) => {
  const user = await User.findById(userId).select("myFollowings");

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // Populate following details
  const followings = await User.find({
    _id: { $in: user.myFollowings },
    isDeleted: false,
  }).select("-password");

  return {
    data: followings,
  };
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
    throw new AppError(status.NOT_FOUND, "Target user not found");
  }

  // Check if current user exists
  const currentUser = await User.findOne({
    _id: currentUserId,
    isDeleted: false,
    isVerified: true,
  });

  if (!currentUser) {
    throw new AppError(status.NOT_FOUND, "Current user not found");
  }

  // Check if both users have active paid subscriptions
  const currentUserHasSubscription =
    currentUser.subscriptionInfo?.plan &&
    (currentUser.subscriptionInfo.plan === ISubscriptionPlan.MONTHLY || currentUser.subscriptionInfo.plan === ISubscriptionPlan.YEARLY) &&
    currentUser.subscriptionInfo.status === "ACTIVE";

  const targetUserHasSubscription =
    targetUser.subscriptionInfo?.plan &&
    (targetUser.subscriptionInfo.plan === ISubscriptionPlan.MONTHLY || targetUser.subscriptionInfo.plan === ISubscriptionPlan.YEARLY) &&
    targetUser.subscriptionInfo.status === "ACTIVE";

  if (!currentUserHasSubscription) {
    throw new AppError(
      status.FORBIDDEN,
      "You need an active subscription to follow users"
    );
  }

  if (!targetUserHasSubscription) {
    throw new AppError(
      status.FORBIDDEN,
      "This user does not have an active subscription and cannot be followed"
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
    }
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
      "-password"
    ) as any,
    query
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
};
