const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const User = require('../models/User');
const Discount = require('../models/Discount');
const DiscountUsage = require('../models/DiscountUsage');
const AuditLog = require('../models/AuditLog');
const notifier = require('../utils/notifier');

// Create a new subscription
exports.subscribe = async (req, res) => {
  try {
    const { planId, autoRenew = true, billingAddress, paymentMethod, discountCode } = req.body;
    const userId = req.user.userId;

    // Validate plan exists and is active
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    if (!plan.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Plan is not available for subscription'
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      userId,
      status: 'active'
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription. Please cancel it first or upgrade/downgrade instead.'
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (plan.contractLength || 1));

    const nextBillingDate = new Date(endDate);
    
    // Validate dates
    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract length'
      });
    }

    // Create subscription (price may be adjusted below if discount applied)
    const subscription = new Subscription({
      userId,
      planId,
      startDate,
      endDate,
      nextBillingDate,
      autoRenew,
      billingAddress,
      paymentMethod: paymentMethod || 'credit_card',
      nextPaymentAmount: plan.price
    });

    // Optional: apply discount code
    if (discountCode) {
      const code = String(discountCode).trim().toUpperCase();
      const now = new Date();
      const discount = await Discount.findOne({ code });
      if (!discount || !discount.isActive || discount.startDate > now || discount.endDate < now) {
        return res.status(400).json({ success: false, message: 'Invalid or expired discount code' });
      }

      // Check usage limit
      if (discount.usageLimit !== null && discount.usedCount >= discount.usageLimit) {
        return res.status(400).json({ success: false, message: 'Discount code usage limit reached' });
      }

      // Check applicability (plan or product type)
      const planApplicable = (discount.applicablePlans && discount.applicablePlans.length > 0)
        ? discount.applicablePlans.map(id => id.toString()).includes(plan._id.toString())
        : true;
      const typeApplicable = (discount.applicableProductTypes && discount.applicableProductTypes.length > 0)
        ? discount.applicableProductTypes.includes(plan.productType)
        : true;
      if (!planApplicable || !typeApplicable) {
        return res.status(400).json({ success: false, message: 'Discount not applicable to this plan' });
      }

      // Check minimum order amount
      if (discount.minOrderAmount && plan.price < discount.minOrderAmount) {
        return res.status(400).json({ success: false, message: `Minimum order amount for this discount is $${discount.minOrderAmount}` });
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (discount.type === 'percentage') {
        discountAmount = (plan.price * (discount.value / 100));
        if (discount.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
        }
      } else if (discount.type === 'fixed_amount') {
        discountAmount = discount.value;
      }
      discountAmount = Math.max(0, Math.min(discountAmount, plan.price));
      const amountAfter = Math.max(0, Math.round((plan.price - discountAmount) * 100) / 100);

      subscription.nextPaymentAmount = amountAfter;
      subscription.discountApplied = discount._id;

      // Reserve usage: increment usedCount and record usage after subscription saved
      // We'll create DiscountUsage after subscription.save() succeeds
      // Increment usedCount optimistically
      await Discount.updateOne({ _id: discount._id }, { $inc: { usedCount: 1 } });

      // After save, create DiscountUsage record
      subscription.__discountMeta = { code, discountId: discount._id, amountBefore: plan.price, discountAmount, amountAfter };
    }

    await subscription.save();

    // Populate plan details
    await subscription.populate('planId');

    // Create discount usage record if applied
    if (subscription.__discountMeta) {
      const { code, discountId, amountBefore, discountAmount, amountAfter } = subscription.__discountMeta;
      try {
        await DiscountUsage.create({
          userId,
          subscriptionId: subscription._id,
          discountId,
          code,
          amountBefore,
          discountAmount,
          amountAfter
        });
      } catch (e) {
        console.error('Error recording discount usage:', e);
      }
      delete subscription.__discountMeta;
    }

    // Log the action
    await AuditLog.logAction({
      userId,
      action: 'create_subscription',
      resource: 'subscription',
      resourceId: subscription._id,
      details: `Subscribed to plan "${plan.name}"`,
      newValues: subscription.toObject(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'data_modification'
    });

    // Send notification
    await notifier.sendSubscriptionNotification(
      userId,
      'created',
      subscription
    );

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscription
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during subscription creation'
    });
  }
};

// Get user's subscriptions
exports.getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, includeExpired = false } = req.query;

    const filter = { userId };
    if (status) {
      filter.status = status;
    } else if (!includeExpired) {
      filter.status = { $ne: 'expired' };
    }

    const subscriptions = await Subscription.find(filter)
      .populate('planId')
      .populate('discountApplied')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      subscriptions,
      count: subscriptions.length
    });

  } catch (error) {
    console.error('Get user subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get subscription by ID
exports.getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const subscription = await Subscription.findById(id)
      .populate('planId')
      .populate('discountApplied')
      .populate('userId', 'username email firstName lastName');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Check if user can access this subscription
    if (req.user.role !== 'admin' && subscription.userId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      subscription
    });

  } catch (error) {
    console.error('Get subscription by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Upgrade or downgrade subscription
exports.upgradeDowngrade = async (req, res) => {
  try {
    const { subscriptionId, newPlanId, reason } = req.body;
    const userId = req.user.userId;

    // Validate subscription exists and belongs to user
    const subscription = await Subscription.findById(subscriptionId)
      .populate('planId');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active subscriptions can be modified'
      });
    }

    // Validate new plan
    const newPlan = await Plan.findById(newPlanId);
    if (!newPlan) {
      return res.status(404).json({
        success: false,
        message: 'New plan not found'
      });
    }

    if (!newPlan.isActive) {
      return res.status(400).json({
        success: false,
        message: 'New plan is not available'
      });
    }

    // Store old values for audit log
    const oldValues = subscription.toObject();

    // Update subscription
    subscription.planId = newPlanId;
    subscription.nextPaymentAmount = newPlan.price;
    subscription.notes = reason || subscription.notes;

    // Validate the updated subscription
    try {
      await subscription.save();
    } catch (error) {
      console.error('Error saving subscription update:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating subscription'
      });
    }

    // Populate new plan details
    await subscription.populate('planId');

    // Log the action
    await AuditLog.logAction({
      userId,
      action: 'modify_subscription',
      resource: 'subscription',
      resourceId: subscription._id,
      details: `Subscription changed from "${oldValues.planId.name}" to "${newPlan.name}"`,
      oldValues,
      newValues: subscription.toObject(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'data_modification'
    });

    // Send notification
    const eventType = newPlan.price > oldValues.planId.price ? 'upgraded' : 'downgraded';
    await notifier.sendSubscriptionNotification(
      userId,
      eventType,
      subscription
    );

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription
    });

  } catch (error) {
    console.error('Upgrade/downgrade error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during subscription modification'
    });
  }
};

// Cancel subscription
exports.cancel = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { reason, immediate = false } = req.body;
    const userId = req.user.userId;

    const subscription = await Subscription.findById(subscriptionId)
      .populate('planId');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active subscriptions can be cancelled'
      });
    }

    // Store old values for audit log
    const oldValues = subscription.toObject();

    // Update subscription
    subscription.status = immediate ? 'cancelled' : 'cancelled';
    subscription.cancellationReason = reason;
    subscription.cancelledAt = new Date();
    subscription.autoRenew = false;

    if (immediate) {
      subscription.endDate = new Date();
    }

    await subscription.save();

    // Log the action
    await AuditLog.logAction({
      userId,
      action: 'cancel_subscription',
      resource: 'subscription',
      resourceId: subscription._id,
      details: `Subscription cancelled${immediate ? ' immediately' : ''}. Reason: ${reason || 'Not specified'}`,
      oldValues,
      newValues: subscription.toObject(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'data_modification'
    });

    // Send notification
    await notifier.sendSubscriptionNotification(
      userId,
      'cancelled',
      subscription
    );

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during subscription cancellation'
    });
  }
};

// Renew subscription
exports.renew = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.userId;

    const subscription = await Subscription.findById(subscriptionId)
      .populate('planId');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!['active', 'expired', 'cancelled'].includes(subscription.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only active, expired, or cancelled subscriptions can be renewed'
      });
    }

    // Store old values for audit log
    const oldValues = subscription.toObject();

    // Calculate new end date
    const currentEndDate = new Date(subscription.endDate);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + (subscription.planId.contractLength || 1));

    // Update subscription
    subscription.endDate = newEndDate;
    subscription.nextBillingDate = newEndDate;
    subscription.status = 'active';
    subscription.autoRenew = true;
    subscription.nextPaymentAmount = subscription.planId.price;

    await subscription.save();

    // Log the action
    await AuditLog.logAction({
      userId,
      action: 'renew_subscription',
      resource: 'subscription',
      resourceId: subscription._id,
      details: `Subscription renewed until ${newEndDate.toISOString()}`,
      oldValues,
      newValues: subscription.toObject(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'data_modification'
    });

    // Send notification
    await notifier.sendSubscriptionNotification(
      userId,
      'renewed',
      subscription
    );

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      subscription
    });

  } catch (error) {
    console.error('Renew subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during subscription renewal'
    });
  }
};

// Toggle auto-renewal
exports.toggleAutoRenew = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.userId;

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Store old values for audit log
    const oldValues = subscription.toObject();

    // Toggle auto-renewal
    subscription.autoRenew = !subscription.autoRenew;
    await subscription.save();

    // Log the action
    await AuditLog.logAction({
      userId,
      action: 'toggle_auto_renew',
      resource: 'subscription',
      resourceId: subscription._id,
      details: `Auto-renewal ${subscription.autoRenew ? 'enabled' : 'disabled'}`,
      oldValues,
      newValues: subscription.toObject(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'data_modification'
    });

    res.json({
      success: true,
      message: `Auto-renewal ${subscription.autoRenew ? 'enabled' : 'disabled'} successfully`,
      subscription
    });

  } catch (error) {
    console.error('Toggle auto-renew error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during auto-renewal toggle'
    });
  }
};

// Get all subscriptions (Admin only)
exports.getAllSubscriptions = async (req, res) => {
  try {
    const { 
      status, 
      userId, 
      planId, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (planId) filter.planId = planId;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const subscriptions = await Subscription.find(filter)
      .populate('userId', 'username email firstName lastName')
      .populate('planId')
      .populate('discountApplied')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Subscription.countDocuments(filter);

    res.json({
      success: true,
      subscriptions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get all subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
