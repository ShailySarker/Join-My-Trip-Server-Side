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
exports.TravelPlanControllers = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const travelPlan_service_1 = require("./travelPlan.service");
const sendResponse_1 = require("../../utils/sendResponse");
const http_status_1 = __importDefault(require("http-status"));
const createTravelPlan = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const hostId = decodedToken.userId;
    const file = req.file;
    const payload = Object.assign({}, req.body);
    if (file && file.path) {
        payload.image = file.path; // Cloudinary URL
    }
    const result = yield travelPlan_service_1.TravelPlanServices.createTravelPlan(hostId, payload);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Travel plan created successfully",
        data: result,
    });
}));
const getMyTravelPlan = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    // console.log(decodedToken);
    const result = yield travelPlan_service_1.TravelPlanServices.getMyTravelPlan(decodedToken.userId, req.query);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "My travel plan retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
}));
const getTravelPlanById = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // const decodedToken = req.user as JwtPayload;
    // console.log(id, decodedToken);
    const result = yield travelPlan_service_1.TravelPlanServices.getTravelPlanById(id
    // decodedToken.userId as string
    );
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Travel plan retrieved successfully",
        data: result.data,
    });
}));
const getAllTravelPlansPublic = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield travelPlan_service_1.TravelPlanServices.getAllTravelPlansPublic(req.query);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Travel plans retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
}));
const getAllTravelPlansAdmin = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const result = yield travelPlan_service_1.TravelPlanServices.getAllTravelPlansAdmin(req.query
    // decodedToken.userId as string
    );
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Travel plans retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
}));
const approveTravelPlan = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { isApproved } = req.body;
    const result = yield travelPlan_service_1.TravelPlanServices.approveTravelPlan(id, isApproved);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Travel plan approved successfully",
        data: result,
    });
}));
const cancelTravelPlan = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const decodedToken = req.user;
    const userId = decodedToken.userId;
    const result = yield travelPlan_service_1.TravelPlanServices.cancelTravelPlan(id, userId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Travel plan cancelled successfully",
        data: result.data,
    });
}));
const updateTravelPlan = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const decodedToken = req.user;
    const userId = decodedToken.userId;
    const file = req.file;
    const payload = Object.assign({}, req.body);
    if (file && file.path) {
        payload.image = file.path; // Cloudinary URL
    }
    const result = yield travelPlan_service_1.TravelPlanServices.updateTravelPlan(id, userId, payload);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Travel plan updated successfully",
        data: result.data,
    });
}));
const addParticipant = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // travel plan id
    const decodedToken = req.user;
    const userId = decodedToken.userId;
    const result = yield travelPlan_service_1.TravelPlanServices.addParticipantToTravelPlan(id, userId, req.body);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Participant added successfully",
        data: result.data,
    });
}));
const removeParticipant = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, phone } = req.params; // travel plan id and participant phone
    const decodedToken = req.user;
    const userId = decodedToken.userId;
    const result = yield travelPlan_service_1.TravelPlanServices.removeParticipantFromTravelPlan(id, phone, userId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Participant removed successfully",
        data: result.data,
    });
}));
const getPopularDestinations = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield travelPlan_service_1.TravelPlanServices.getPopularDestinations();
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Popular destinations retrieved successfully",
        data: result.data,
    });
}));
exports.TravelPlanControllers = {
    createTravelPlan,
    getMyTravelPlan,
    getTravelPlanById,
    getAllTravelPlansPublic,
    getAllTravelPlansAdmin,
    approveTravelPlan,
    cancelTravelPlan,
    updateTravelPlan,
    addParticipant,
    removeParticipant,
    getPopularDestinations,
};
