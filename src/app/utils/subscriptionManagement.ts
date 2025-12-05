import cron from "node-cron";
import { User } from "../modules/user/user.model";
import { ISubscriptionPlanStatus } from "../modules/subscription/subscription.interface";

/**
 * Check for expired subscriptions and update their status
 * Runs daily at midnight
 */
export const startSubscriptionCronJob = () => {
  // Run every day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("🔄 Running subscription expiry check...");

      const now = new Date();

      // Update all active subscriptions that have expired
      const result = await User.updateMany(
        {
          "subscriptionInfo.status": ISubscriptionPlanStatus.ACTIVE,
          "subscriptionInfo.expireDate": { $lt: now },
        },
        {
          $set: { "subscriptionInfo.status": ISubscriptionPlanStatus.EXPIRED },
        }
      );

      console.log(
        `✅ Subscription expiry check complete. ${result.modifiedCount} subscriptions expired.`
      );
    } catch (error) {
      console.error("❌ Error in subscription expiry cron job:", error);
    }
  });

  console.log("✅ Subscription expiry cron job started (runs daily at midnight)");
};
