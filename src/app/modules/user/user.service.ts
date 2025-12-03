import status from "http-status";
import { envVars } from "../../config/env";
import { IUser } from "./user.interface";
import { User } from "./user.model";
import AppError from "../../errorHelpers/AppError";
import bcryptjs from "bcryptjs";

const createUser = async (payload: Partial<IUser>) => {
  const { fullname, email, password, ...rest } = payload;

  console.log(payload, "payload---------");
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
  console.log(user);

  return user;
};

export const UserServices = {
  createUser,
};
