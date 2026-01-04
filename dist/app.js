"use strict";
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
const app = (0, express_1.default)();
app.post("/webhook", body_parser_1.default.raw({ type: "application/json" }), payment_controller_1.PaymentControllers.handleWebhook);
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json()); //for json data parse
app.set("trust proxy", 1); //all external live links's proxy will trust
app.use(express_1.default.urlencoded({ extended: true })); //for form data
app.use((0, cors_1.default)({
    origin: env_1.envVars.FRONTEND.FRONTEND_URL,
    credentials: true,
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
