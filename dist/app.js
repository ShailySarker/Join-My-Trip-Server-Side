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
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_status_1 = __importDefault(require("http-status"));
const globalErrorHandler_1 = require("./app/middlewares/globalErrorHandler");
const notFound_1 = __importDefault(require("./app/middlewares/notFound"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./app/config/env");
const routes_1 = require("./app/routes");
const payment_controller_1 = require("./app/modules/payment/payment.controller");
const body_parser_1 = __importDefault(require("body-parser"));
const subscriptionManagement_1 = require("./app/utils/subscriptionManagement");
const updateTravelPlanStatuses_1 = require("./app/utils/updateTravelPlanStatuses");
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
require("./app/config/passport");
const app = (0, express_1.default)();
// stripe payment
app.post("/webhook", body_parser_1.default.raw({ type: "application/json" }), payment_controller_1.PaymentControllers.handleWebhook);
// passport
app.use((0, express_session_1.default)({
    secret: env_1.envVars.GOOGLE.GOOGLE_CLIENT_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// middlewares
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json()); //for json data parse
app.set("trust proxy", 1); //all external live links's proxy will trust
app.use(express_1.default.urlencoded({ extended: true })); //for form data
app.use((0, cors_1.default)({
    origin: env_1.envVars.FRONTEND.FRONTEND_URL,
    credentials: true,
}));
// 1. Daily Travel Plan Status Update (Schedule: 0 0 * * *)
app.get("/api/v1/cron/travel-status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("CRON: Updating travel plan statuses...", new Date().toISOString());
        yield (0, updateTravelPlanStatuses_1.updateTravelPlanStatuses)();
        // Also check for subscription reminders daily
        console.log("CRON: Checking subscription reminders...");
        try {
            yield (0, subscriptionManagement_1.checkSubscriptionReminders)();
        }
        catch (reminderError) {
            console.error("CRON Reminder Error:", reminderError);
        }
        // Return JSON response to avoid "Response data too big" error from HTML 504s
        return res.status(200).json({
            success: true,
            message: "Travel statuses updated and reminders checked",
        });
    }
    catch (e) {
        console.error("CRON Error:", e);
        // Return 200 even on error to stop cron retries (which cause 429s), but indicate failure in body
        return res
            .status(200)
            .json({ success: false, error: e.message || "Internal Server Error" });
    }
}));
// 2. Hourly Subscription Expiry Check (Schedule: 0 * * * *)
app.get("/api/v1/cron/subscription-check", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("CRON: Checking subscription expiry...", new Date().toISOString());
        yield (0, subscriptionManagement_1.checkSubscriptionExpiry)();
        // Return JSON response
        return res
            .status(200)
            .json({ success: true, message: "Subscription expiry checked" });
    }
    catch (e) {
        console.error("CRON Error:", e);
        // Return 200 even on error to stop cron retries
        return res
            .status(200)
            .json({ success: false, error: e.message || "Internal Server Error" });
    }
}));
app.use("/api/v1/", routes_1.router);
app.get("/", (req, res) => {
    res.status(http_status_1.default.OK).json({
        message: "Welcome to Join My Trip Server!",
    });
});
// global error handler
app.use(globalErrorHandler_1.globalErrorHandler);
// not found route
app.use(notFound_1.default);
exports.default = app;
