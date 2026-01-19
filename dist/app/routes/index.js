"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const user_route_1 = require("../modules/user/user.route");
const auth_route_1 = require("../modules/auth/auth.route");
const otp_route_1 = require("../modules/otp/otp.route");
const travelPlan_route_1 = require("../modules/travelPlan/travelPlan.route");
const subscription_route_1 = require("../modules/subscription/subscription.route");
const payment_route_1 = require("../modules/payment/payment.route");
const booking_route_1 = require("../modules/booking/booking.route");
const review_route_1 = require("../modules/review/review.route");
const contact_route_1 = require("../modules/contact/contact.route");
exports.router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/user",
        route: user_route_1.UserRouters,
    },
    {
        path: "/auth",
        route: auth_route_1.AuthRoutes,
    },
    {
        path: "/otp",
        route: otp_route_1.OtpRoutes,
    },
    {
        path: "/travel-plan",
        route: travelPlan_route_1.TravelPlanRouters,
    },
    {
        path: "/subscription",
        route: subscription_route_1.SubscriptionRouters,
    },
    {
        path: "/payment",
        route: payment_route_1.PaymentRouters,
    },
    {
        path: "/bookings",
        route: booking_route_1.BookingRoutes,
    },
    {
        path: "/reviews",
        route: review_route_1.ReviewRoutes,
    },
    {
        path: "/contact",
        route: contact_route_1.ContactRoutes,
    },
];
moduleRoutes.forEach((route) => {
    exports.router.use(route.path, route.route);
});
