import { TravelPlan } from "../travelPlan/travelPlan.model";
import { Booking } from "../booking/booking.model";
import { Review } from "../review/review.model";
import { User } from "../user/user.model";
import { Payment } from "../payment/payment.model";
import { ITrevelStatus } from "../travelPlan/travelPlan.interface";
import { IBookingStatus } from "../booking/booking.interface";
import { IUserRole } from "../user/user.interface";

export const getAdminDashboardStats = async () => {
  // User stats
  const totalUsers = await User.countDocuments({ role: IUserRole.USER });
  const activeUsers = await User.countDocuments({
    role: IUserRole.USER,
    subscriptionInfo: { $exists: true },
  });

  // Travel plan stats
  const totalTravelPlans = await TravelPlan.countDocuments();
  const pendingApprovals = await TravelPlan.countDocuments({
    isApproved: "PENDING",
  });

  // Booking stats
  const totalBookings = await Booking.countDocuments();

  // Revenue stats (assuming payments exist)
  const payments = await Payment.find({ status: "COMPLETED" });
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Monthly revenue (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const monthlyPayments = await Payment.find({
    status: "COMPLETED",
    createdAt: { $gte: thirtyDaysAgo },
  });
  const monthlyRevenue = monthlyPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  // Review stats
  const totalReviews = await Review.countDocuments();
  const reviews = await Review.find();
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  // Monthly data for charts (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const users = await User.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      role: IUserRole.USER,
    });

    const travels = await TravelPlan.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const bookings = await Booking.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const monthPayments = await Payment.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      status: "COMPLETED",
    });
    const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    monthlyData.push({
      name: date.toLocaleString("default", { month: "short" }),
      users,
      travels,
      bookings,
      revenue,
    });
  }

  // Status distribution
  const statusData = [
    {
      name: "Upcoming",
      value: await TravelPlan.countDocuments({ status: ITrevelStatus.UPCOMING }),
    },
    {
      name: "Ongoing",
      value: await TravelPlan.countDocuments({ status: ITrevelStatus.ONGOING }),
    },
    {
      name: "Completed",
      value: await TravelPlan.countDocuments({ status: ITrevelStatus.COMPLETED }),
    },
    {
      name: "Cancelled",
      value: await TravelPlan.countDocuments({ status: ITrevelStatus.CANCELLED }),
    },
  ];

  return {
    data: {
      totalUsers,
      activeUsers,
      totalTravelPlans,
      pendingApprovals,
      totalBookings,
      totalRevenue,
      monthlyRevenue,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      monthlyData,
      statusData,
    },
  };
};
