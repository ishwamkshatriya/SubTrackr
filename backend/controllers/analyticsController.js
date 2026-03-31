const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Usage = require('../models/Usage');

// Get comprehensive analytics data
exports.getAnalytics = async (req, res) => {
  try {
    const { period = '30d', type = 'overview' } = req.query;

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
      case 'overview':
        analyticsData = await getOverviewAnalytics(startDate, endDate);
        break;
      case 'subscriptions':
        analyticsData = await getSubscriptionAnalytics(startDate, endDate);
        break;
      case 'revenue':
        analyticsData = await getRevenueAnalytics(startDate, endDate);
        break;
      case 'usage':
        analyticsData = await getUsageAnalytics(startDate, endDate);
        break;
      case 'users':
        analyticsData = await getUserAnalytics(startDate, endDate);
        break;
      default:
        analyticsData = await getOverviewAnalytics(startDate, endDate);
    }

    res.json({
      success: true,
      period,
      type,
      dateRange: { startDate, endDate },
      data: analyticsData
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get subscription analytics
exports.getSubscriptionAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

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

    const analyticsData = await getSubscriptionAnalytics(startDate, endDate);

    res.json({
      success: true,
      period,
      dateRange: { startDate, endDate },
      data: analyticsData
    });

  } catch (error) {
    console.error('Get subscription analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get revenue analytics
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

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

    const analyticsData = await getRevenueAnalytics(startDate, endDate);

    res.json({
      success: true,
      period,
      dateRange: { startDate, endDate },
      data: analyticsData
    });

  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get usage analytics
exports.getUsageAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

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

    const analyticsData = await getUsageAnalytics(startDate, endDate);

    res.json({
      success: true,
      period,
      dateRange: { startDate, endDate },
      data: analyticsData
    });

  } catch (error) {
    console.error('Get usage analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get top performing plans
exports.getTopPlans = async (req, res) => {
  try {
    const { limit = 10, period = '30d' } = req.query;

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

    const topPlans = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$planId',
          subscriptionCount: { $sum: 1 },
          totalRevenue: { $sum: '$nextPaymentAmount' },
          activeSubscriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          }
        }
      },
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
          subscriptionCount: 1,
          totalRevenue: 1,
          activeSubscriptions: 1,
          averageRevenuePerSubscription: {
            $divide: ['$totalRevenue', '$subscriptionCount']
          }
        }
      },
      { $sort: { subscriptionCount: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      period,
      dateRange: { startDate, endDate },
      topPlans
    });

  } catch (error) {
    console.error('Get top plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get top plans grouped by year
exports.getTopPlansByYear = async (req, res) => {
  try {
    const { limit = 5, startYear, endYear } = req.query;

    // Optional year filtering
    const matchStage = {};
    if (startYear || endYear) {
      const start = startYear ? new Date(`${startYear}-01-01T00:00:00.000Z`) : new Date('1970-01-01T00:00:00.000Z');
      const end = endYear ? new Date(`${endYear}-12-31T23:59:59.999Z`) : new Date();
      matchStage.createdAt = { $gte: start, $lte: end };
    }

    const agg = await Subscription.aggregate([
      Object.keys(matchStage).length ? { $match: matchStage } : { $match: {} },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, planId: '$planId' },
          subscriptionCount: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      { $sort: { '_id.year': 1, subscriptionCount: -1 } },
      {
        $lookup: {
          from: 'plans',
          localField: '_id.planId',
          foreignField: '_id',
          as: 'plan'
        }
      },
      { $unwind: '$plan' },
      {
        $project: {
          year: '$_id.year',
          planId: '$_id.planId',
          subscriptionCount: 1,
          uniqueSubscribers: { $size: '$uniqueUsers' },
          planName: '$plan.name',
          planPrice: '$plan.price',
          planType: '$plan.productType'
        }
      }
    ]);

    // Group in JS and cap to 'limit' per year
    const byYear = {};
    for (const row of agg) {
      const y = row.year;
      if (!byYear[y]) byYear[y] = [];
      if (byYear[y].length < parseInt(limit)) {
        byYear[y].push(row);
      }
    }

    const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

    res.json({
      success: true,
      years,
      byYear
    });
  } catch (error) {
    console.error('Get top plans by year error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get popular plans for current month and current year
exports.getTopPlansCurrent = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    // Helper to aggregate within a range
    const aggregateRange = async (start, end) => {
      const rows = await Subscription.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: '$planId',
            subscriptionCount: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' }
          }
        },
        { $sort: { subscriptionCount: -1 } },
        { $limit: parseInt(limit) },
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
            planId: '$_id',
            subscriptionCount: 1,
            uniqueSubscribers: { $size: '$uniqueUsers' },
            planName: '$plan.name',
            planPrice: '$plan.price',
            planType: '$plan.productType'
          }
        }
      ]);
      return rows;
    };

    const [month, year] = await Promise.all([
      aggregateRange(monthStart, monthEnd),
      aggregateRange(yearStart, yearEnd)
    ]);

    res.json({ success: true, month, year });
  } catch (error) {
    console.error('Get top plans current error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get churn analytics
exports.getChurnAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

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

    // Get churn data
    const churnData = await Subscription.aggregate([
      {
        $match: {
          status: 'cancelled',
          cancelledAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$cancelledAt' },
            month: { $month: '$cancelledAt' },
            day: { $dayOfMonth: '$cancelledAt' }
          },
          churnedSubscriptions: { $sum: 1 },
          lostRevenue: { $sum: '$nextPaymentAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get total active subscriptions for churn rate calculation
    const totalActiveSubscriptions = await Subscription.countDocuments({
      status: 'active'
    });

    // Get cancellation reasons
    const cancellationReasons = await Subscription.aggregate([
      {
        $match: {
          status: 'cancelled',
          cancelledAt: { $gte: startDate, $lte: endDate },
          cancellationReason: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$cancellationReason',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalChurned = churnData.reduce((sum, item) => sum + item.churnedSubscriptions, 0);
    const churnRate = totalActiveSubscriptions > 0 ? (totalChurned / totalActiveSubscriptions) * 100 : 0;

    res.json({
      success: true,
      period,
      dateRange: { startDate, endDate },
      data: {
        churnData,
        totalChurned,
        churnRate: Math.round(churnRate * 100) / 100,
        cancellationReasons
      }
    });

  } catch (error) {
    console.error('Get churn analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper function for overview analytics
async function getOverviewAnalytics(startDate, endDate) {
  const [
    totalUsers,
    totalSubscriptions,
    activeSubscriptions,
    totalRevenue,
    monthlyTrends,
    topPlans
  ] = await Promise.all([
    User.countDocuments(),
    Subscription.countDocuments(),
    Subscription.countDocuments({ status: 'active' }),
    Subscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$nextPaymentAmount' } } }
    ]),
    Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
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
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),
    Subscription.aggregate([
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
      { $unwind: '$plan' }
    ])
  ]);

  return {
    overview: {
      totalUsers,
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue: totalRevenue[0]?.total || 0
    },
    monthlyTrends,
    topPlans
  };
}

// Helper function for subscription analytics
async function getSubscriptionAnalytics(startDate, endDate) {
  const [
    dailySubscriptions,
    statusBreakdown,
    planBreakdown
  ] = await Promise.all([
    Subscription.aggregate([
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
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]),
    Subscription.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
    Subscription.aggregate([
      {
        $group: {
          _id: '$planId',
          count: { $sum: 1 }
        }
      },
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
          planType: '$plan.productType',
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ])
  ]);

  return {
    dailySubscriptions,
    statusBreakdown,
    planBreakdown,
    total: dailySubscriptions.reduce((sum, item) => sum + item.count, 0)
  };
}

// Helper function for revenue analytics
async function getRevenueAnalytics(startDate, endDate) {
  const [
    dailyRevenue,
    revenueByPlan,
    averageRevenue
  ] = await Promise.all([
    Subscription.aggregate([
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
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]),
    Subscription.aggregate([
      {
        $group: {
          _id: '$planId',
          totalRevenue: { $sum: '$nextPaymentAmount' },
          subscriptionCount: { $sum: 1 }
        }
      },
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
          planType: '$plan.productType',
          totalRevenue: 1,
          subscriptionCount: 1,
          averageRevenue: { $divide: ['$totalRevenue', '$subscriptionCount'] }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]),
    Subscription.aggregate([
      {
        $group: {
          _id: null,
          averageRevenue: { $avg: '$nextPaymentAmount' },
          totalRevenue: { $sum: '$nextPaymentAmount' }
        }
      }
    ])
  ]);

  return {
    dailyRevenue,
    revenueByPlan,
    averageRevenue: averageRevenue[0] || { averageRevenue: 0, totalRevenue: 0 },
    total: dailyRevenue.reduce((sum, item) => sum + item.revenue, 0)
  };
}

// Helper function for usage analytics
async function getUsageAnalytics(startDate, endDate) {
  const [
    dailyUsage,
    usageByPlan,
    averageUsage
  ] = await Promise.all([
    Usage.aggregate([
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
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]),
    Usage.aggregate([
      {
        $lookup: {
          from: 'subscriptions',
          localField: 'subscriptionId',
          foreignField: '_id',
          as: 'subscription'
        }
      },
      { $unwind: '$subscription' },
      {
        $lookup: {
          from: 'plans',
          localField: 'subscription.planId',
          foreignField: '_id',
          as: 'plan'
        }
      },
      { $unwind: '$plan' },
      {
        $group: {
          _id: '$plan._id',
          planName: { $first: '$plan.name' },
          planType: { $first: '$plan.productType' },
          totalUsage: { $sum: '$dataUsed' },
          averageUsage: { $avg: '$dataUsed' },
          userCount: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          planName: 1,
          planType: 1,
          totalUsage: { $round: ['$totalUsage', 2] },
          averageUsage: { $round: ['$averageUsage', 2] },
          userCount: { $size: '$userCount' }
        }
      },
      { $sort: { totalUsage: -1 } }
    ]),
    Usage.aggregate([
      {
        $group: {
          _id: null,
          averageDailyUsage: { $avg: '$dataUsed' },
          totalUsage: { $sum: '$dataUsed' }
        }
      }
    ])
  ]);

  return {
    dailyUsage,
    usageByPlan,
    averageUsage: averageUsage[0] || { averageDailyUsage: 0, totalUsage: 0 },
    total: dailyUsage.reduce((sum, item) => sum + item.totalUsage, 0)
  };
}

// Helper function for user analytics
async function getUserAnalytics(startDate, endDate) {
  const [
    dailyRegistrations,
    userRoleBreakdown,
    userActivity
  ] = await Promise.all([
    User.aggregate([
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
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]),
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]),
    User.aggregate([
      {
        $group: {
          _id: {
            isActive: '$isActive',
            hasSubscription: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ['$subscriptions', []] } }, 0] },
                true,
                false
              ]
            }
          },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    dailyRegistrations,
    userRoleBreakdown,
    userActivity,
    total: dailyRegistrations.reduce((sum, item) => sum + item.count, 0)
  };
}
