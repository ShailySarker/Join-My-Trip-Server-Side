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
exports.Payment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const payment_interface_1 = require("./payment.interface");
/**
 
const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    travelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TravelPlan",
      // required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      // required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPeople: {
      type: Number,
      // required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: Object.values(IPaymentStatus),
      default: IPaymentStatus.PENDING,
    },
    paymentGatewayData: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

 */
const paymentSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // travelId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "TravelPlan",
    // },
    // bookingId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Booking",
    // },
    subscriptionId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Subscription",
        required: true,
    },
    stripePaymentIntentId: {
        type: String,
        required: true,
        unique: true,
    },
    stripeCustomerId: {
        type: String,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: "usd",
    },
    // totalPeople: {
    //   type: Number,
    //   min: 1,
    // },
    status: {
        type: String,
        enum: Object.values(payment_interface_1.IPaymentStatus),
        default: payment_interface_1.IPaymentStatus.PENDING,
    },
    transactionDate: {
        type: Date,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.Payment = mongoose_1.default.model("Payment", paymentSchema);
