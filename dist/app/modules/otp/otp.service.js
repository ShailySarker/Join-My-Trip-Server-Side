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
exports.OTPService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const redis_config_1 = require("../../config/redis.config");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const user_model_1 = require("../user/user.model");
const sendEmail_1 = require("../../utils/sendEmail");
const OTP_EXPIRATION = 2 * 60; // 2min time
const generateOTP = (length = 6) => {
    // 6 digits otp
    const otp = crypto_1.default.randomInt(10 ** (length - 1), 10 ** length).toString(); // 100000-999999
    return otp;
};
const sendOTP = (email, fullname) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ email });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    if (user === null || user === void 0 ? void 0 : user.isVerified) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are already verified");
    }
    const otp = generateOTP();
    const redisKey = `otp: ${email}`;
    yield redis_config_1.redisClient.set(redisKey, otp, {
        expiration: {
            type: "EX",
            value: OTP_EXPIRATION,
        },
    });
    yield (0, sendEmail_1.sendEmail)({
        to: email,
        subject: "Your OTP Code",
        templateName: "otp",
        templateData: {
            fullname: fullname,
            otp: otp,
        },
    });
});
const verifyOTP = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    // const user = await User.findOne({ email, isVerified: false });
    const user = yield user_model_1.User.findOne({ email });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    if (user === null || user === void 0 ? void 0 : user.isVerified) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are already verified");
    }
    const redisKey = `otp: ${email}`;
    const savedOTP = yield redis_config_1.redisClient.get(redisKey);
    if (!savedOTP) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Invalid OTP");
    }
    if (savedOTP !== otp) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Invalid OTP");
    }
    yield Promise.all([
        user_model_1.User.updateOne({ email }, { isVerified: true }, { runValidators: true }),
        redis_config_1.redisClient.del([redisKey]),
    ]);
});
exports.OTPService = {
    sendOTP,
    verifyOTP,
};
