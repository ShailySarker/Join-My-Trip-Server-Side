import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IProvider, IUser } from "../user/user.interface";
import { User } from "../user/user.model";
import {
  createNewAccessTokenWithRefreshToken,
  createUserTokens,
} from "../../utils/userTokens";
import bcryptjs from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import { sendEmail } from "../../utils/sendEmail";

const credentialsLogin = async (payload: Partial<IUser>) => {
  const { email, password } = payload;

  const isUserExist = await User.findOne({ email });

  if (!isUserExist) {
    throw new AppError(status.BAD_REQUEST, "User does not exist");
  }

  if (isUserExist.isDeleted) {
    throw new AppError(status.BAD_REQUEST, `${isUserExist.role} is deleted`);
  }

  if (!isUserExist.isVerified) {
    throw new AppError(
      status.BAD_REQUEST,
      `${isUserExist.role} is not verified`,
    );
  }

  const isPasswordMatched = await bcryptjs.compare(
    password as string,
    isUserExist.password as string,
  );
  if (!isPasswordMatched) {
    throw new AppError(status.BAD_REQUEST, "Incorrect Password");
  }

  const userTokens = await createUserTokens(isUserExist);

  const { password: pass, ...rest } = isUserExist.toObject();

  return {
    accessToken: userTokens.accessToken,
    refreshToken: userTokens.refreshToken,
    user: rest,
  };
};

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken =
    await createNewAccessTokenWithRefreshToken(refreshToken);

  return {
    accessToken: newAccessToken,
  };
};

const changePassword = async (
  oldPassword: string,
  newPassword: string,
  decodedToken: JwtPayload,
) => {
  const user = await User.findById(decodedToken.userId);

  const isOldPasswordMatch = await bcryptjs.compare(
    oldPassword,
    user!.password as string,
  );

  if (!isOldPasswordMatch) {
    throw new AppError(status.UNAUTHORIZED, "Old password does not match");
  }

  user!.password = await bcryptjs.hash(
    newPassword,
    Number(envVars.BCRYPT.BCRYPT_SALT_ROUND),
  );

  user!.save();
};

const resetPassword = async (
  payload: Record<string, any>,
  decodedToken: JwtPayload,
) => {
  if (payload.id !== decodedToken.userId) {
    throw new AppError(status.UNAUTHORIZED, "You can not reset your password");
  }

  const isUserExist = await User.findById(decodedToken.userId);

  if (!isUserExist) {
    throw new AppError(status.UNAUTHORIZED, "User does not exist");
  }

  const hashedPassword = await bcryptjs.hash(
    payload.newPassword,
    Number(envVars.BCRYPT.BCRYPT_SALT_ROUND),
  );

  isUserExist.password = hashedPassword;

  await isUserExist.save();
};

const setPassword = async (userId: string, plainPassword: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (
    user.password &&
    user.auths.some(
      (providerObject) => providerObject.provider === IProvider.GOOGLE,
    )
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      "You have already set you password. Now you can change the password from your profile password update",
    );
  }

  const hashedPassword = await bcryptjs.hash(
    plainPassword,
    Number(envVars.BCRYPT.BCRYPT_SALT_ROUND),
  );

  const credentialProvider: IAuthProvider = {
    provider: IProvider.CREDENTIAL,
    providerId: user.email,
  };

  const auths: IAuthProvider[] = [...user.auths, credentialProvider];

  user.password = hashedPassword;
  user.auths = auths;

  await user.save();
};

const forgotPassword = async (email: string) => {
  const isUserExist = await User.findOne({ email });

  if (!isUserExist) {
    throw new AppError(status.BAD_REQUEST, "User does not exist");
  }
  if (!isUserExist.isVerified) {
    throw new AppError(status.BAD_REQUEST, "User is not verified");
  }

  if (isUserExist.isDeleted) {
    throw new AppError(status.BAD_REQUEST, "User is deleted");
  }

  const jwtPayload = {
    userId: isUserExist._id,
    email: isUserExist.email,
    role: isUserExist.role,
  };

  const resetToken = jwt.sign(jwtPayload, envVars.JWT.JWT_ACCESS_SECRET, {
    expiresIn: "30m",
  });

  const resetUILink = `${envVars.FRONTEND.FRONTEND_URL}/reset-password?id=${isUserExist._id}&token=${resetToken}`;

  await sendEmail({
    to: isUserExist.email,
    subject: "Password Reset",
    templateName: "forgetPassword",
    templateData: {
      name: isUserExist.fullname,
      resetUILink,
    },
  });
};

export const AuthServices = {
  credentialsLogin,
  getNewAccessToken,
  changePassword,
  resetPassword,
  setPassword,
  forgotPassword,
};
