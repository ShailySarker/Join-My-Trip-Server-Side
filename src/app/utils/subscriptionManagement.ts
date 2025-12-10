import cron from "node-cron";
import { User } from "../modules/user/user.model";
import { ISubscriptionPlanStatus } from "../modules/subscription/subscription.interface";
import { Payment } from "../modules/payment/payment.model";
import { IPaymentStatus } from "../modules/payment/payment.interface";

/**
 * Check for expired subscriptions and update their status
 * Runs daily at midnight
 */
// export const startSubscriptionCronJob = () => {
//   // Run every day at midnight (00:00)
//   cron.schedule("0 0 * * *", async () => {
//     try {
//       console.log("🔄 Running subscription expiry check...");

//       const now = new Date();

//       // Update all active subscriptions that have expired
//       const result = await User.updateMany(
//         {
//           "subscriptionInfo.status": ISubscriptionPlanStatus.ACTIVE,
//           "subscriptionInfo.expireDate": { $lt: now },
//         },
//         {
//           $set: { "subscriptionInfo.status": ISubscriptionPlanStatus.EXPIRED },
//         }
//       );

//       console.log(
//         `✅ Subscription expiry check complete. ${result.modifiedCount} subscriptions expired.`
//       );
//     } catch (error) {
//       console.error("❌ Error in subscription expiry cron job:", error);
//     }
//   });

//   console.log("✅ Subscription expiry cron job started (runs daily at midnight)");
// };

export const startSubscriptionCronJob = () => {
  // Run every hour to check for expired subscriptions
  cron.schedule("0 * * * *", async () => {
    try {
      console.log(
        "🔄 Running subscription expiry check...",
        new Date().toISOString()
      );

      const now = new Date();

      // Find users with active subscriptions that have expired
      const expiredUsers = await User.find({
        "subscriptionInfo.status": ISubscriptionPlanStatus.ACTIVE,
        "subscriptionInfo.expireDate": { $lt: now },
      });

      if (expiredUsers.length > 0) {
        // Update all expired subscriptions
        const updatePromises = expiredUsers.map(async (user) => {
          return await User.findByIdAndUpdate(user._id, {
            $set: {
              "subscriptionInfo.status": ISubscriptionPlanStatus.EXPIRED,
              "subscriptionInfo.expireDate": null, // Clear expire date since it's expired
            },
          });
        });

        await Promise.all(updatePromises);

        console.log(
          `✅ ${expiredUsers.length} subscription(s) marked as expired.`
        );

        // Also update corresponding payments if needed
        await Payment.updateMany(
          {
            userId: { $in: expiredUsers.map((u) => u._id) },
            status: IPaymentStatus.COMPLETED,
          },
          {
            $set: { status: IPaymentStatus.EXPIRED },
          }
        );
      } else {
        console.log("✅ No expired subscriptions found.");
      }
    } catch (error) {
      console.error("❌ Error in subscription expiry cron job:", error);
    }
  });

  // Additional cron: Check subscriptions expiring in next 24 hours (for reminders)
  cron.schedule("0 9 * * *", async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const expiringSoonUsers = await User.find({
        "subscriptionInfo.status": ISubscriptionPlanStatus.ACTIVE,
        "subscriptionInfo.expireDate": {
          $gt: new Date(),
          $lt: tomorrow,
        },
      });

      // Send email notifications for expiring subscriptions
      // You can implement email sending logic here
      console.log(
        `${expiringSoonUsers.length} subscription(s) expiring in next 24 hours.`
      );
    } catch (error) {
      console.error("❌ Error in subscription reminder cron job:", error);
    }
  });

  console.log("✅ Subscription management cron jobs started.");
};
