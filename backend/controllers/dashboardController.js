const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const User = require('../models/User');
const Usage = require('../models/Usage');

// Get user dashboard data
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's active subscription
    const activeSubscription = await Subscription.findOne({ 
      userId, 
      status: 'active' 
    }).populate('planId');

    // Get user's subscription history
    const subscriptionHistory = await Subscription.find({ userId })
      .populate('planId')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent usage data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsage = await Usage.find({
      userId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 });

    // Calculate usage statistics
    const totalUsage = recentUsage.reduce((sum, usage) => sum + usage.dataUsed, 0);
    const averageDailyUsage = recentUsage.length > 0 ? totalUsage / recentUsage.length : 0;
    const peakUsage = recentUsage.length > 0 ? Math.max(...recentUsage.map(u => u.dataUsed)) : 0;

    // Calculate usage percentage if user has active subscription
    let usagePercentage = 0;
    if (activeSubscription && activeSubscription.planId) {
      const quota = activeSubscription.planId.quota;
      usagePercentage = quota > 0 ? (totalUsage / quota) * 100 : 0;
    }

    // Get upcoming billing information
    let upcomingBilling = null;
    if (activeSubscription) {
      upcomingBilling = {
        nextBillingDate: activeSubscription.nextBillingDate,
        amount: activeSubscription.nextPaymentAmount,
        autoRenew: activeSubscription.autoRenew
      };
    }

    // Get notifications count
    const notifier = require('../utils/notifier');
    const unreadNotifications = notifier.getUnreadCount(userId);

    res.json({
      success: true,
      dashboard: {
        activeSubscription,
        subscriptionHistory,
        usageStats: {
          totalUsage: Math.round(totalUsage * 100) / 100,
          averageDailyUsage: Math.round(averageDailyUsage * 100) / 100,
          peakUsage: Math.round(peakUsage * 100) / 100,
          usagePercentage: Math.round(usagePercentage * 100) / 100,
          daysWithData: recentUsage.length
        },
        upcomingBilling,
        unreadNotifications,
        recentUsage: recentUsage.slice(0, 7) // Last 7 days
      }
    });

  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get admin dashboard data
exports.getAdminDashboard = async (req, res) => {
  try {
    // Get total counts
    const totalUsers = await User.countDocuments();
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const totalPlans = await Plan.countDocuments();

    // Get subscription status breakdown
    const subscriptionStatusBreakdown = await Subscription.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top plans by subscription count
    const topPlans = await Subscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$planId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'plans',
          localField: '_id',
          foreignField: '_id',
          as: 'plan'
        }
      },
      { $unwind: '$plan' },
      {
        $project: {
          planName: '$plan.name',
          planPrice: '$plan.price',
          planType: '$plan.productType',
          subscriptionCount: '$count'
        }
      }
    ]);

    // Get monthly subscription trends (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyTrends = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$nextPaymentAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get recent user registrations
    const recentUsers = await User.find()
      .select('username email role createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent subscriptions
    const recentSubscriptions = await Subscription.find()
      .populate('userId', 'username email')
      .populate('planId', 'name price')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get revenue statistics
    const revenueStats = await Subscription.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          totalMonthlyRevenue: { $sum: '$nextPaymentAmount' },
          averageSubscriptionValue: { $avg: '$nextPaymentAmount' }
        }
      }
    ]);

    // Get churn rate (cancelled subscriptions in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const churnData = await Subscription.aggregate([
      {
        $match: {
          status: 'cancelled',
          cancelledAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          churnedSubscriptions: { $sum: 1 }
        }
      }
    ]);

    const churnRate = activeSubscriptions > 0 ? 
      (churnData[0]?.churnedSubscriptions || 0) / activeSubscriptions * 100 : 0;

    res.json({
      success: true,
      dashboard: {
        overview: {
          totalUsers,
          totalSubscriptions,
          activeSubscriptions,
          totalPlans,
          churnRate: Math.round(churnRate * 100) / 100
        },
        subscriptionStatusBreakdown,
        topPlans,
        monthlyTrends,
        revenueStats: revenueStats[0] || {
          totalMonthlyRevenue: 0,
          averageSubscriptionValue: 0
        },
        recentUsers,
        recentSubscriptions
      }
    });

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get analytics data for charts
exports.getAnalyticsData = async (req, res) => {
  try {
    const { period = '30d', type = 'subscriptions' } = req.query;

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    let analyticsData = {};

    switch (type) {
      case 'subscriptions':
        analyticsData = await getSubscriptionAnalytics(startDate, endDate);
        break;
      case 'revenue':
        analyticsData = await getRevenueAnalytics(startDate, endDate);
        break;
      case 'usage':
        analyticsData = await getUsageAnalytics(startDate, endDate);
        break;
      default:
        analyticsData = await getSubscriptionAnalytics(startDate, endDate);
    }

    res.json({
      success: true,
      period,
      type,
      data: analyticsData
    });

  } catch (error) {
    console.error('Get analytics data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper function for subscription analytics
async function getSubscriptionAnalytics(startDate, endDate) {
  const dailySubscriptions = await Subscription.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  return {
    dailySubscriptions,
    total: dailySubscriptions.reduce((sum, item) => sum + item.count, 0)
  };
}

// Helper function for revenue analytics
async function getRevenueAnalytics(startDate, endDate) {
  const dailyRevenue = await Subscription.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        revenue: { $sum: '$nextPaymentAmount' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  return {
    dailyRevenue,
    total: dailyRevenue.reduce((sum, item) => sum + item.revenue, 0)
  };
}

// Helper function for usage analytics
async function getUsageAnalytics(startDate, endDate) {
  const dailyUsage = await Usage.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        },
        totalUsage: { $sum: '$dataUsed' },
        averageSpeed: { $avg: '$averageSpeed' },
        userCount: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        totalUsage: { $round: ['$totalUsage', 2] },
        averageSpeed: { $round: ['$averageSpeed', 2] },
        userCount: { $size: '$userCount' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  return {
    dailyUsage,
    totalUsage: dailyUsage.reduce((sum, item) => sum + item.totalUsage, 0)
  };
}
