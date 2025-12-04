import { TravelPlan } from "../modules/travelPlan/travelPlan.model";
import {
  ITrevelIsApproved,
  ITrevelStatus,
} from "../modules/travelPlan/travelPlan.interface";

/**
 * Update travel plan status based on current date
 * - ONGOING: if current date is between startDate and endDate
 * - COMPLETED: if current date is after endDate
 * - UPCOMING: if current date is before startDate (no change needed)
 */
export const updateTravelPlanStatuses = async () => {
  const now = new Date();

  try {
    // Update to ONGOING: plans that have started but not ended
    await TravelPlan.updateMany(
      {
        status: ITrevelStatus.UPCOMING,
        isApproved: ITrevelIsApproved.APPROVED,
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
      {
        $set: { status: ITrevelStatus.ONGOING },
      }
    );

    // Update to COMPLETED: plans that have ended
    await TravelPlan.updateMany(
      {
        status: { $in: [ITrevelStatus.UPCOMING, ITrevelStatus.ONGOING] },
        endDate: { $lt: now },
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
