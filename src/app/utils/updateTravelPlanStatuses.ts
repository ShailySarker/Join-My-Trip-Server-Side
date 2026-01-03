import { TravelPlan } from "../modules/travelPlan/travelPlan.model";
import {
  ITrevelIsApproved,
  ITrevelStatus,
} from "../modules/travelPlan/travelPlan.interface";

/**
 * Update travel plan status based on current date
 * - ONGOING: from start date through end date (inclusive)
 * - COMPLETED: the day after end date
 * - UPCOMING: before start date (no change needed)
 */
export const updateTravelPlanStatuses = async () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

  try {
    // Update to ONGOING: plans where today is between start and end date (inclusive)
    await TravelPlan.updateMany(
      {
        status: ITrevelStatus.UPCOMING,
        isApproved: ITrevelIsApproved.APPROVED,
        $expr: {
          $and: [
            // { $lte: ["$startDate", now] },
            { $lt: ["$startDate", new Date(now.getTime() + 24 * 60 * 60 * 1000)] }, // Start date is before tomorrow (meaning it's today or past)
            { $gte: ["$endDate", now] }
          ]
        }
      },
      {
        $set: { status: ITrevelStatus.ONGOING },
      }
    );

    // Update to COMPLETED: plans where today is AFTER end date (next day of end date)
    await TravelPlan.updateMany(
      {
        status: { $in: [ITrevelStatus.UPCOMING, ITrevelStatus.ONGOING] },
        $expr: {
          $lt: ["$endDate", now]
        }
      },
      {
        $set: { status: ITrevelStatus.COMPLETED },
      }
    );

    console.log("✅ Travel plan statuses updated successfully");
  } catch (error) {
    console.error("❌ Error updating travel plan statuses:", error);
  }
};
