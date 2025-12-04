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
exports.checkAuth = void 0;
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const http_status_1 = __importDefault(require("http-status"));
const user_model_1 = require("../modules/user/user.model");
const checkAuth = (...authRoles) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessToken = req.headers.authorization || req.cookies.accessToken;
        if (!accessToken) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Not token received");
        }
        const verifiedToken = jsonwebtoken_1.default.verify(accessToken, env_1.envVars.JWT.JWT_ACCESS_SECRET);
        const isUserExist = yield user_model_1.User.findOne({ email: verifiedToken.email });
        if (!isUserExist) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User does not exist");
        }
        if (!isUserExist.isVerified) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User is not verified");
        }
        if (isUserExist.isDeleted) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User is deleted");
        }
        // authRoles = ["ADMIN", "SUPER_ADMIN" ]
        if (!authRoles.includes(verifiedToken.role)) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You are not permitted to view this route!");
        }
        req.user = verifiedToken;
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.checkAuth = checkAuth;
