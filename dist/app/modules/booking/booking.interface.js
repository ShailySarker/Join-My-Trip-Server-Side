"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IBookingStatus = void 0;
var IBookingStatus;
(function (IBookingStatus) {
    IBookingStatus["BOOKED"] = "BOOKED";
    IBookingStatus["CANCELLED"] = "CANCELLED";
})(IBookingStatus || (exports.IBookingStatus = IBookingStatus = {}));
/**
 * Booking Workflow:
 * 1. When creating a booking, user must provide participants array with details
 * 2. System validates each participant (age, phone format, etc.)
 * 3. System checks if total participants don't exceed available seats
 * 4. All participants are added to both booking and travel plan
 * 5. Users can add/remove participants after booking (within limits)
 */ 
