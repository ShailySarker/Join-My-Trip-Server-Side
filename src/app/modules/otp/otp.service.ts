import crypto from "crypto";
import { redisClient } from "../../config/redis.config";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { User } from "../user/user.model";
import { sendEmail } from "../../utils/sendEmail";

const OTP_EXPIRATION = 2 * 60; // 2min time

const generateOTP = (length = 6) => {
  // 6 digits otp
  const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString(); // 100000-999999
  return otp;
};

const sendOTP = async (email: string, name: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }
  if (user?.isVerified) {
    throw new AppError(status.UNAUTHORIZED, "You are already verified");
  }

  const otp = generateOTP();
  const redisKey = `otp: ${email}`;

  await redisClient.set(redisKey, otp, {
    expiration: {
      type: "EX",
      value: OTP_EXPIRATION,
    },
  });

  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    templateName: "otp",
    templateData: {
      name: name,
      otp: otp,
    },
  });
};

const verifyOTP = async (email: string, otp: string) => {
  // const user = await User.findOne({ email, isVerified: false });
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }
  if (user?.isVerified) {
    throw new AppError(status.UNAUTHORIZED, "You are already verified");
  }

  const redisKey = `otp: ${email}`;
  const savedOTP = await redisClient.get(redisKey);

  if (!savedOTP) {
    throw new AppError(status.UNAUTHORIZED, "Invalid OTP");
  }

  if (savedOTP !== otp) {
    throw new AppError(status.UNAUTHORIZED, "Invalid OTP");
  }

  await Promise.all([
    User.updateOne({ email }, { isVerified: true }, { runValidators: true }),
    redisClient.del([redisKey]),
  ]);
};

export const OTPService = {
  sendOTP,
  verifyOTP,
};
