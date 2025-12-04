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
exports.TravelPlanServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const travelPlan_model_1 = require("./travelPlan.model");
const QueryBuilder_1 = __importDefault(require("../../utils/QueryBuilder"));
const travelPlan_constant_1 = require("./travelPlan.constant");
/**
 * Generate URL-friendly slug from title
 */
const generateSlug = (title) => {
    const baseSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/--+/g, "-")
        .replace(/^-+|-+$/g, "");
    const timestamp = Date.now().toString(36);
    return `${baseSlug}-${timestamp}`;
};
const createTravelPlan = (hostId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const slug = generateSlug(payload.title);
    const existingPlan = yield travelPlan_model_1.TravelPlan.findOne({ slug });
    if (existingPlan) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "A travel plan with this title already exists");
    }
    const travelPlan = yield travelPlan_model_1.TravelPlan.create(Object.assign(Object.assign({}, payload), { host: hostId, slug }));
    return travelPlan;
});
const getTravelPlanById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const travelPlan = yield travelPlan_model_1.TravelPlan.findById(id)
        .populate("host", "fullname email profilePhoto")
        .populate("participants", "fullname email profilePhoto");
    if (!travelPlan) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Travel plan not found");
    }
    return {
        data: travelPlan,
    };
});
const getAllTravelPlansPublic = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const travelPlanQuery = new QueryBuilder_1.default(travelPlan_model_1.TravelPlan.find()
        .populate("host", "fullname email profilePhoto")
        .populate("participants", "fullname email profilePhoto"), query);
    const result = yield travelPlanQuery
        .search(travelPlan_constant_1.searchableFields)
        .filter(travelPlan_constant_1.filterableFields)
        .sort(travelPlan_constant_1.sortableFields)
        .paginate()
        .fields()
        .execute();
    return result;
});
exports.TravelPlanServices = {
    createTravelPlan,
    getTravelPlanById,
    getAllTravelPlansPublic,
};
