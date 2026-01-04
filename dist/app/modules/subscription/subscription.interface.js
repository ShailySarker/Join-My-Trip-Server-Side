"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ISubscriptionPlanStatus = exports.ISubscriptionPlan = void 0;
var ISubscriptionPlan;
(function (ISubscriptionPlan) {
    ISubscriptionPlan["MONTHLY"] = "MONTHLY";
    ISubscriptionPlan["YEARLY"] = "YEARLY";
})(ISubscriptionPlan || (exports.ISubscriptionPlan = ISubscriptionPlan = {}));
var ISubscriptionPlanStatus;
(function (ISubscriptionPlanStatus) {
    ISubscriptionPlanStatus["ACTIVE"] = "ACTIVE";
    ISubscriptionPlanStatus["CANCELLED"] = "CANCELLED";
    ISubscriptionPlanStatus["EXPIRED"] = "EXPIRED";
})(ISubscriptionPlanStatus || (exports.ISubscriptionPlanStatus = ISubscriptionPlanStatus = {}));
