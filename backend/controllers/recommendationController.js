const recommendationClient = require('../utils/recommendationClient');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const Usage = require('../models/Usage');

// Get personalized plan recommendations for a user
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { includeChurnPrediction = false } = req.query;

    // Get recommendations from the recommendation service
    const recommendations = await recommendationClient.getPlanRecommendations(userId);

    let churnPrediction = null;
    if (includeChurnPrediction === 'true') {
      churnPrediction = await recommendationClient.getChurnPrediction(userId);
    }

    res.json({
      success: true,
      ...recommendations,
      churnPrediction
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting recommendations'
    });
  }
};

// Get churn prediction for a user
exports.getChurnPrediction = async (req, res) => {
  try {
    const userId = req.user.userId;

    const churnPrediction = await recommendationClient.getChurnPrediction(userId);

    res.json({
      success: true,
      churnPrediction
    });

  } catch (error) {
    console.error('Get churn prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting churn prediction'
    });
  }
};

// Get usage-based recommendations
exports.getUsageBasedRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { days = 30 } = req.query;

    // Get user's current subscription
    const currentSubscription = await Subscription.findOne({
      userId,
      status: 'active'
    }).populate('planId');

    if (!currentSubscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Get usage data for specified period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const usageData = await Usage.find({
      userId,
      date: { $gte: startDate }
    }).sort({ date: -1 });

    // Calculate usage patterns
    const usageStats = calculateUsagePatterns(usageData, currentSubscription.planId);

    // Get all available plans for comparison
    const allPlans = await Plan.find({ isActive: true }).sort({ price: 1 });

    // Generate usage-based recommendations
    const recommendations = generateUsageBasedRecommendations(
      usageStats,
      allPlans,
      currentSubscription
    );

    res.json({
      success: true,
      currentPlan: currentSubscription.planId,
      usageStats,
      recommendations,
      period: `${days} days`
    });

  } catch (error) {
    console.error('Get usage-based recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting usage-based recommendations'
    });
  }
};

// Get seasonal recommendations
exports.getSeasonalRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's current subscription
    const currentSubscription = await Subscription.findOne({
      userId,
      status: 'active'
    }).populate('planId');

    // Get all available plans
    const allPlans = await Plan.find({ isActive: true }).sort({ price: 1 });

    // Generate seasonal recommendations
    const seasonalRecommendations = generateSeasonalRecommendations(
      allPlans,
      currentSubscription
    );

    res.json({
      success: true,
      currentPlan: currentSubscription?.planId || null,
      seasonalRecommendations
    });

  } catch (error) {
    console.error('Get seasonal recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting seasonal recommendations'
    });
  }
};

// Get globally recommended plan based on total active subscriptions (popularity)
exports.getGlobalRecommendation = async (req, res) => {
  try {
    // Aggregate active subscriptions to find the most popular plan
    const topPlanAgg = await Subscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$planId', subscriptions: { $sum: 1 } } },
      { $sort: { subscriptions: -1 } },
      { $limit: 1 },
    ]);

    if (!topPlanAgg.length) {
      return res.json({ success: true, recommendation: null, reason: 'No subscriptions yet' });
    }

    const plan = await Plan.findById(topPlanAgg[0]._id);
    if (!plan || !plan.isActive) {
      return res.json({ success: true, recommendation: null, reason: 'Top plan not available' });
    }

    res.json({
      success: true,
      recommendation: {
        plan,
        rationale: 'Most popular among active subscribers',
        subscribers: topPlanAgg[0].subscriptions,
      },
    });
  } catch (error) {
    console.error('Get global recommendation error:', error);
    res.status(500).json({ success: false, message: 'Server error while getting global recommendation' });
  }
};

// Get plan comparison recommendations
exports.getPlanComparison = async (req, res) => {
  try {
    const { planIds } = req.body;

    if (!planIds || !Array.isArray(planIds) || planIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 plan IDs are required for comparison'
      });
    }

    const plans = await Plan.find({
      _id: { $in: planIds },
      isActive: true
    });

    if (plans.length !== planIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more plans not found'
      });
    }

    // Generate comparison insights
    const comparison = generatePlanComparison(plans);

    res.json({
      success: true,
      plans,
      comparison
    });

  } catch (error) {
    console.error('Get plan comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while comparing plans'
    });
  }
};

// Helper function to calculate usage patterns
function calculateUsagePatterns(usageData, currentPlan) {
  if (!usageData || usageData.length === 0) {
    return {
      averageDailyUsage: 0,
      peakUsage: 0,
      totalUsage: 0,
      usagePercentage: 0,
      averageSpeed: 0,
      peakSpeed: 0,
      daysWithUsage: 0,
      usagePattern: 'no_data'
    };
  }

  const totalUsage = usageData.reduce((sum, usage) => sum + usage.dataUsed, 0);
  const peakUsage = Math.max(...usageData.map(u => u.dataUsed));
  const averageDailyUsage = totalUsage / usageData.length;
  const usagePercentage = (totalUsage / (currentPlan.quota * usageData.length)) * 100;
  
  const averageSpeed = usageData.reduce((sum, usage) => sum + (usage.averageSpeed || 0), 0) / usageData.length;
  const peakSpeed = Math.max(...usageData.map(u => u.peakSpeed || 0));
  const daysWithUsage = usageData.filter(u => u.dataUsed > 0).length;

  // Determine usage pattern
  let usagePattern = 'moderate';
  if (usagePercentage > 80) usagePattern = 'heavy';
  else if (usagePercentage < 30) usagePattern = 'light';

  return {
    averageDailyUsage: Math.round(averageDailyUsage * 100) / 100,
    peakUsage: Math.round(peakUsage * 100) / 100,
    totalUsage: Math.round(totalUsage * 100) / 100,
    usagePercentage: Math.round(usagePercentage * 100) / 100,
    averageSpeed: Math.round(averageSpeed * 100) / 100,
    peakSpeed: Math.round(peakSpeed * 100) / 100,
    daysWithUsage,
    usagePattern
  };
}

// Helper function to generate usage-based recommendations
function generateUsageBasedRecommendations(usageStats, allPlans, currentSubscription) {
  const recommendations = [];

  // High usage recommendation (upgrade)
  if (usageStats.usagePercentage > 80) {
    const upgradePlans = allPlans.filter(plan => 
      plan.price > currentSubscription.planId.price && 
      plan.quota > currentSubscription.planId.quota
    );
    
    if (upgradePlans.length > 0) {
      const recommendedPlan = upgradePlans[0];
      recommendations.push({
        type: 'upgrade',
        plan: recommendedPlan,
        reason: 'High usage detected',
        description: `You're using ${usageStats.usagePercentage}% of your quota. Consider upgrading to avoid overage charges.`,
        priority: 'high',
        potentialSavings: null,
        additionalCost: recommendedPlan.price - currentSubscription.planId.price
      });
    }
  }

  // Low usage recommendation (downgrade)
  if (usageStats.usagePercentage < 30 && currentSubscription.planId.price > allPlans[0].price) {
    const downgradePlans = allPlans.filter(plan => 
      plan.price < currentSubscription.planId.price &&
      plan.quota >= usageStats.totalUsage * 1.2 // 20% buffer
    );
    
    if (downgradePlans.length > 0) {
      const recommendedPlan = downgradePlans[downgradePlans.length - 1];
      const monthlySavings = currentSubscription.planId.price - recommendedPlan.price;
      recommendations.push({
        type: 'downgrade',
        plan: recommendedPlan,
        reason: 'Low usage detected',
        description: `You're only using ${usageStats.usagePercentage}% of your quota. You could save money with a lower plan.`,
        priority: 'medium',
        potentialSavings: monthlySavings,
        additionalCost: null
      });
    }
  }

  // Speed-based recommendations
  if (usageStats.averageSpeed < currentSubscription.planId.downloadSpeed * 0.7) {
    const fasterPlans = allPlans.filter(plan => 
      plan.downloadSpeed > currentSubscription.planId.downloadSpeed
    );
    
    if (fasterPlans.length > 0) {
      const recommendedPlan = fasterPlans[0];
      recommendations.push({
        type: 'speed_upgrade',
        plan: recommendedPlan,
        reason: 'Speed optimization',
        description: `Your average speed is ${usageStats.averageSpeed} Mbps. Consider upgrading for better performance.`,
        priority: 'medium',
        potentialSavings: null,
        additionalCost: recommendedPlan.price - currentSubscription.planId.price
      });
    }
  }

  return recommendations;
}

// Helper function to generate seasonal recommendations
function generateSeasonalRecommendations(allPlans, currentSubscription) {
  const recommendations = [];
  const currentMonth = new Date().getMonth();

  // Summer promotion (June-August)
  if (currentMonth >= 5 && currentMonth <= 7) {
    const summerPlans = allPlans.filter(plan => 
      plan.productType === 'Fibernet' && 
      plan.downloadSpeed >= 100 // High-speed plans
    );
    
    if (summerPlans.length > 0) {
      recommendations.push({
        type: 'seasonal',
        plan: summerPlans[0],
        reason: 'Summer promotion',
        description: 'Special summer offer on high-speed fiber plans!',
        priority: 'low',
        discount: '10% off first 3 months'
      });
    }
  }

  // Holiday season (November-December)
  if (currentMonth >= 10 || currentMonth <= 1) {
    const budgetPlans = allPlans.filter(plan => 
      plan.price < 50 // Budget-friendly plans
    );
    
    if (budgetPlans.length > 0) {
      recommendations.push({
        type: 'seasonal',
        plan: budgetPlans[budgetPlans.length - 1],
        reason: 'Holiday savings',
        description: 'Holiday season special - save money with our budget-friendly plans!',
        priority: 'low',
        discount: '15% off first 6 months'
      });
    }
  }

  // Back to school (August-September)
  if (currentMonth >= 7 && currentMonth <= 8) {
    const studentPlans = allPlans.filter(plan => 
      plan.price < 30 && plan.quota >= 100 // Good value plans
    );
    
    if (studentPlans.length > 0) {
      recommendations.push({
        type: 'seasonal',
        plan: studentPlans[0],
        reason: 'Back to school',
        description: 'Special student pricing for the new academic year!',
        priority: 'low',
        discount: '20% off for students'
      });
    }
  }

  return recommendations;
}

// Helper function to generate plan comparison
function generatePlanComparison(plans) {
  const comparison = {
    priceRange: {
      min: Math.min(...plans.map(p => p.price)),
      max: Math.max(...plans.map(p => p.price)),
      average: plans.reduce((sum, p) => sum + p.price, 0) / plans.length
    },
    quotaRange: {
      min: Math.min(...plans.map(p => p.quota)),
      max: Math.max(...plans.map(p => p.quota)),
      average: plans.reduce((sum, p) => sum + p.quota, 0) / plans.length
    },
    speedRange: {
      min: Math.min(...plans.map(p => p.downloadSpeed)),
      max: Math.max(...plans.map(p => p.downloadSpeed)),
      average: plans.reduce((sum, p) => sum + p.downloadSpeed, 0) / plans.length
    },
    bestValue: null,
    fastest: null,
    cheapest: null
  };

  // Find best value (highest quota per dollar)
  comparison.bestValue = plans.reduce((best, current) => {
    const currentValue = current.quota / current.price;
    const bestValue = best.quota / best.price;
    return currentValue > bestValue ? current : best;
  });

  // Find fastest plan
  comparison.fastest = plans.reduce((fastest, current) => 
    current.downloadSpeed > fastest.downloadSpeed ? current : fastest
  );

  // Find cheapest plan
  comparison.cheapest = plans.reduce((cheapest, current) => 
    current.price < cheapest.price ? current : cheapest
  );

  return comparison;
}
