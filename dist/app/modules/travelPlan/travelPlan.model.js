"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelPlan = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const travelPlan_interface_1 = require("./travelPlan.interface");
const travelPlanSchema = new mongoose_1.Schema({
    host: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: { type: String, required: true, trim: true },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: { type: String, required: true },
    images: { type: [String], default: [] },
    // budgetRange: {
    //   min: {
    //     type: Number,
    //     required: true,
    //     min: 0,
    //   },
    //   max: {
    //     type: Number,
    //     required: true,
    //     min: 0,
    //   },
    // },
    budget: { type: Number, required: true },
    destination: {
        city: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        },
    },
    departureLocation: { type: String },
    arrivalLocation: { type: String },
    included: { type: [String], default: [] },
    excluded: { type: [String], default: [] },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    travelType: {
        type: String,
        enum: Object.values(travelPlan_interface_1.ITravelType),
        required: true,
    },
    interests: {
        type: [String],
        enum: Object.values(travelPlan_interface_1.ITrevelInterest),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(travelPlan_interface_1.ITrevelStatus),
        default: travelPlan_interface_1.ITrevelStatus.UPCOMING,
    },
    maxGuest: {
        type: Number,
        required: true,
        min: 1,
    },
    minAge: {
        type: Number,
        default: 18,
        min: 5,
    },
    participants: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "User",
            default: [],
        },
    ],
}, {
    timestamps: true,
    versionKey: false,
});
exports.TravelPlan = mongoose_1.default.model("TravelPlan", travelPlanSchema);
