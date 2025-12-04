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

const getSingleUser = async (id: string) => {
  const user = await User.findOne({ _id: id, isDeleted: false }).select(
    "-password"
  );

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
};
