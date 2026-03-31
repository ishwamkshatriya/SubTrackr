const Plan = require('../models/Plan');
const Usage = require('../models/Usage');
const Subscription = require('../models/Subscription');

class RecommendationService {
  constructor() {
    this.baseUrl = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:8000';
  }

  // Get plan recommendations based on usage patterns
  async getPlanRecommendations(userId, options = {}) {
    try {
      // Get user's current subscription and usage
      const currentSubscription = await Subscription.findOne({ 
        userId, 
        status: 'active' 
      }).populate('planId');

      if (!currentSubscription) {
        return this.getDefaultRecommendations();
      }

      // Get usage data for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const usageData = await Usage.find({
        userId,
        date: { $gte: thirtyDaysAgo }
      }).sort({ date: -1 });

      // Calculate usage statistics
      const stats = this.calculateUsageStats(usageData, currentSubscription.planId);

      // Get all available plans
      const plans = await Plan.find({ isActive: true }).sort({ price: 1 });

      // Generate recommendations
      const recommendations = this.generateRecommendations(stats, plans, currentSubscription);

      return {
        success: true,
        currentPlan: currentSubscription.planId,
        usageStats: stats,
        recommendations
      };

    } catch (error) {
      console.error('Error getting plan recommendations:', error);
      return this.getDefaultRecommendations();
    }
  }

  // Calculate usage statistics
  calculateUsageStats(usageData, currentPlan) {
    if (!usageData || usageData.length === 0) {
      return {
        averageDailyUsage: 0,
        peakUsage: 0,
        totalUsage: 0,
        usagePercentage: 0,
        averageSpeed: 0,
        peakSpeed: 0,
        daysWithUsage: 0
      };
    }

    const totalUsage = usageData.reduce((sum, usage) => sum + usage.dataUsed, 0);
    const peakUsage = Math.max(...usageData.map(u => u.dataUsed));
    const averageDailyUsage = totalUsage / usageData.length;
    const usagePercentage = (totalUsage / (currentPlan.quota * usageData.length)) * 100;
    
    const averageSpeed = usageData.reduce((sum, usage) => sum + (usage.averageSpeed || 0), 0) / usageData.length;
    const peakSpeed = Math.max(...usageData.map(u => u.peakSpeed || 0));
    const daysWithUsage = usageData.filter(u => u.dataUsed > 0).length;

    return {
      averageDailyUsage: Math.round(averageDailyUsage * 100) / 100,
      peakUsage: Math.round(peakUsage * 100) / 100,
      totalUsage: Math.round(totalUsage * 100) / 100,
      usagePercentage: Math.round(usagePercentage * 100) / 100,
      averageSpeed: Math.round(averageSpeed * 100) / 100,
      peakSpeed: Math.round(peakSpeed * 100) / 100,
      daysWithUsage
    };
  }

  // Generate recommendations based on usage patterns
  generateRecommendations(stats, plans, currentSubscription) {
    const recommendations = [];

    // Find current plan index
    const currentPlanIndex = plans.findIndex(plan => 
      plan._id.toString() === currentSubscription.planId._id.toString()
    );

    // High usage recommendation (upgrade)
    if (stats.usagePercentage > 80) {
      const upgradePlans = plans.slice(currentPlanIndex + 1);
      if (upgradePlans.length > 0) {
        const recommendedPlan = upgradePlans[0];
        recommendations.push({
          type: 'upgrade',
          plan: recommendedPlan,
          reason: 'High usage detected',
          description: `You're using ${stats.usagePercentage}% of your quota. Consider upgrading to avoid overage charges.`,
          priority: 'high',
          savings: null
        });
      }
    }

    // Low usage recommendation (downgrade)
    if (stats.usagePercentage < 30 && currentPlanIndex > 0) {
      const downgradePlans = plans.slice(0, currentPlanIndex);
      if (downgradePlans.length > 0) {
        const recommendedPlan = downgradePlans[downgradePlans.length - 1];
        const monthlySavings = currentSubscription.planId.price - recommendedPlan.price;
        recommendations.push({
          type: 'downgrade',
          plan: recommendedPlan,
          reason: 'Low usage detected',
          description: `You're only using ${stats.usagePercentage}% of your quota. You could save money with a lower plan.`,
          priority: 'medium',
          savings: monthlySavings
        });
      }
    }

    // Speed-based recommendations
    if (stats.averageSpeed < currentSubscription.planId.downloadSpeed * 0.7) {
      const fasterPlans = plans.filter(plan => 
        plan.downloadSpeed > currentSubscription.planId.downloadSpeed
      );
      if (fasterPlans.length > 0) {
        const recommendedPlan = fasterPlans[0];
        recommendations.push({
          type: 'speed_upgrade',
          plan: recommendedPlan,
          reason: 'Speed optimization',
          description: `Your average speed is ${stats.averageSpeed} Mbps. Consider upgrading for better performance.`,
          priority: 'medium',
          savings: null
        });
      }
    }

    // Seasonal recommendations
    const seasonalRecommendations = this.getSeasonalRecommendations(plans, currentSubscription);
    recommendations.push(...seasonalRecommendations);

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  // Get seasonal recommendations
  getSeasonalRecommendations(plans, currentSubscription) {
    const recommendations = [];
    const currentMonth = new Date().getMonth();

    // Summer promotion (June-August)
    if (currentMonth >= 5 && currentMonth <= 7) {
      const summerPlans = plans.filter(plan => 
        plan.productType === 'Fibernet' && plan.price > currentSubscription.planId.price
      );
      if (summerPlans.length > 0) {
        recommendations.push({
          type: 'seasonal',
          plan: summerPlans[0],
          reason: 'Summer promotion',
          description: 'Special summer offer on high-speed plans!',
          priority: 'low',
          savings: null
        });
      }
    }

    // Holiday season (November-December)
    if (currentMonth >= 10 || currentMonth <= 1) {
      const holidayPlans = plans.filter(plan => 
        plan.price < currentSubscription.planId.price
      );
      if (holidayPlans.length > 0) {
        const recommendedPlan = holidayPlans[holidayPlans.length - 1];
        const monthlySavings = currentSubscription.planId.price - recommendedPlan.price;
        recommendations.push({
          type: 'seasonal',
          plan: recommendedPlan,
          reason: 'Holiday savings',
          description: 'Holiday season special - save money with our budget-friendly plans!',
          priority: 'low',
          savings: monthlySavings
        });
      }
    }

    return recommendations;
  }

  // Get default recommendations when no usage data is available
  getDefaultRecommendations() {
    return {
      success: true,
      currentPlan: null,
      usageStats: null,
      recommendations: [
        {
          type: 'default',
          plan: null,
          reason: 'New user',
          description: 'Start with our basic plan and upgrade as needed based on your usage.',
          priority: 'low',
          savings: null
        }
      ]
    };
  }

  // Get churn prediction (simplified version)
  async getChurnPrediction(userId) {
    try {
      const subscription = await Subscription.findOne({ userId, status: 'active' });
      if (!subscription) {
        return { churnRisk: 'low', confidence: 0.5 };
      }

      // Simple churn prediction based on subscription age and usage
      const subscriptionAge = (Date.now() - subscription.startDate) / (1000 * 60 * 60 * 24 * 30); // months
      const usageData = await Usage.find({ userId }).sort({ date: -1 }).limit(30);
      
      let churnRisk = 'low';
      let confidence = 0.5;

      // Factors that increase churn risk
      if (subscriptionAge < 1) churnRisk = 'high'; // New customers more likely to churn
      if (usageData.length === 0) churnRisk = 'high'; // No usage data
      if (subscription.autoRenew === false) churnRisk = 'medium';

      // Adjust confidence based on data availability
      if (usageData.length > 10) confidence = 0.8;
      else if (usageData.length > 5) confidence = 0.6;

      return {
        churnRisk,
        confidence,
        factors: {
          subscriptionAge: Math.round(subscriptionAge * 10) / 10,
          hasUsageData: usageData.length > 0,
          autoRenew: subscription.autoRenew
        }
      };

    } catch (error) {
      console.error('Error getting churn prediction:', error);
      return { churnRisk: 'unknown', confidence: 0 };
    }
  }

  // Call external Python recommendation service (if available)
  async callExternalService(userId, usageData) {
    try {
      const response = await fetch(`${this.baseUrl}/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          usage_data: usageData
        })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`External service returned ${response.status}`);
      }
    } catch (error) {
      console.error('External recommendation service error:', error);
      return null;
    }
  }
}

// Create singleton instance
const recommendationClient = new RecommendationService();

module.exports = recommendationClient;
module.exports.RecommendationService = RecommendationService;
