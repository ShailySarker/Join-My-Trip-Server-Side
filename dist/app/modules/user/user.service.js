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
        email, password: hashedPassword }, rest));
    return user;
});
const getSingleUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ _id: id, isDeleted: false }).select("-password");
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    return {
        data: user,
    };
});
const deleteSingleUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOneAndUpdate({ _id: id, isDeleted: false }, // find only active user
    { isDeleted: true }, // mark as deleted
    { new: true } // return updated user
    );
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    return { data: user };
});
const getMe = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select("-password");
    return {
        data: user,
    };
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
exports.UserServices = {
    createUser,
    getSingleUser,
    getMe,
    deleteSingleUser,
    updateUserProfile,
    getAllUsers,
};
