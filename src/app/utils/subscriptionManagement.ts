import cron from "node-cron";
import { User } from "../modules/user/user.model";
import { ISubscriptionPlanStatus } from "../modules/subscription/subscription.interface";
import { Payment } from "../modules/payment/payment.model";
import { IPaymentStatus } from "../modules/payment/payment.interface";

// Separate logic function for manual/endpoint execution
export const checkSubscriptionExpiry = async () => {
  try {
    console.log("🔄 Checking subscription expiry...", new Date().toISOString());

    const now = new Date();

    // Find users with active subscriptions that have expired
    const expiredUsers = await User.find({
      "subscriptionInfo.status": ISubscriptionPlanStatus.ACTIVE,
      "subscriptionInfo.expireDate": { $lt: now },
    });

    if (expiredUsers.length > 0) {
      // Optmized: Update all expired subscriptions in one go
      const expiredUserIds = expiredUsers.map((user) => user._id);

      await User.updateMany(
        { _id: { $in: expiredUserIds } },
        {
          $set: {
            "subscriptionInfo.status": ISubscriptionPlanStatus.EXPIRED,
            "subscriptionInfo.expireDate": null, 
          },
        }
      );

      console.log(
        `✅ ${expiredUsers.length} subscription(s) marked as expired.`
      );

      // Also update corresponding payments if needed
      await Payment.updateMany(
        {
          userId: { $in: expiredUserIds },
          status: IPaymentStatus.COMPLETED,
        },
        {
          $set: { status: IPaymentStatus.EXPIRED },
        }
      );
    } else {
      console.log("✅ No expired subscriptions found.");
    }

    return true;
  } catch (error) {
    console.error("❌ Error in subscription expiry check:", error);
    throw error;
  }
};

// Separate logic for subscription reminders
export const checkSubscriptionReminders = async () => {
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
    return true;
  } catch (error) {
    console.error("❌ Error in subscription reminder check:", error);
    throw error;
  }
};

export const startSubscriptionCronJob = () => {
  // Run every hour to check for expired subscriptions
  cron.schedule("0 * * * *", async () => {
    await checkSubscriptionExpiry();
  });

  // Additional cron: Check subscriptions expiring in next 24 hours (for reminders)
  cron.schedule("0 9 * * *", async () => {
    await checkSubscriptionReminders();
  });

  console.log("✅ Subscription management cron jobs started.");
};
