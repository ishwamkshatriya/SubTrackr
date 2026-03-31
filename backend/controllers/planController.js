const Plan = require('../models/Plan');
const AuditLog = require('../models/AuditLog');
const { validatePositiveNumber } = require('../utils/validators');

// Create a new plan (Admin only)
exports.createPlan = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      quota,
      productType,
      features,
      billingCycle,
      maxUsers,
      downloadSpeed,
      uploadSpeed,
      setupFee,
      contractLength
    } = req.body;

    // Validation
    if (!name || !price || !quota || !productType || !downloadSpeed || !uploadSpeed) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, quota, product type, download speed, and upload speed are required'
      });
    }

    // Validate numeric values
    const priceValidation = validatePositiveNumber(price, 'Price');
    if (!priceValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: priceValidation.message
      });
    }

    const quotaValidation = validatePositiveNumber(quota, 'Quota');
    if (!quotaValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: quotaValidation.message
      });
    }

    const downloadSpeedValidation = validatePositiveNumber(downloadSpeed, 'Download speed');
    if (!downloadSpeedValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: downloadSpeedValidation.message
      });
    }

    const uploadSpeedValidation = validatePositiveNumber(uploadSpeed, 'Upload speed');
    if (!uploadSpeedValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: uploadSpeedValidation.message
      });
    }

    // Check if plan with same name already exists
    const existingPlan = await Plan.findOne({ name });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'Plan with this name already exists'
      });
    }

    const plan = new Plan({
      name,
      description,
      price,
      quota,
      productType,
      features: features || [],
      billingCycle: billingCycle || 'monthly',
      maxUsers: maxUsers || 1,
      downloadSpeed,
      uploadSpeed,
      setupFee: setupFee || 0,
      contractLength: contractLength || 12
    });

    await plan.save();

    // Log the action
    await AuditLog.logAction({
      userId: req.user.userId,
      action: 'create_plan',
      resource: 'plan',
      resourceId: plan._id,
      details: `Plan "${name}" created`,
      newValues: plan.toObject(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'data_modification'
    });

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      plan
    });

  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during plan creation'
    });
  }
};

// Get all plans
exports.getPlans = async (req, res) => {
  try {
    const { productType, isActive, sortBy = 'price', sortOrder = 'asc' } = req.query;
    
    // Build filter
    const filter = {};
    if (productType) filter.productType = productType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const plans = await Plan.find(filter).sort(sort);

    res.json({
      success: true,
      plans,
      count: plans.length
    });

  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get plan by ID
exports.getPlanById = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      plan
    });

  } catch (error) {
    console.error('Get plan by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update plan (Admin only)
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Store old values for audit log
    const oldValues = plan.toObject();

    // Update plan
    Object.assign(plan, updateData);
    
    // Validate the updated plan
    try {
      await plan.save();
    } catch (error) {
      console.error('Error saving plan update:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating plan'
      });
    }

    // Log the action
    await AuditLog.logAction({
      userId: req.user.userId,
      action: 'update_plan',
      resource: 'plan',
      resourceId: plan._id,
      details: `Plan "${plan.name}" updated`,
      oldValues,
      newValues: plan.toObject(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'data_modification'
    });

    res.json({
      success: true,
      message: 'Plan updated successfully',
      plan
    });

  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during plan update'
    });
  }
};

// Delete plan (Admin only)
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if plan is being used by any active subscriptions
    const Subscription = require('../models/Subscription');
    const activeSubscriptions = await Subscription.countDocuments({
      planId: id,
      status: 'active'
    });

    if (activeSubscriptions > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan. It is being used by ${activeSubscriptions} active subscription(s). Consider deactivating instead.`
      });
    }

    await Plan.findByIdAndDelete(id);

    // Log the action
    await AuditLog.logAction({
      userId: req.user.userId,
      action: 'delete_plan',
      resource: 'plan',
      resourceId: id,
      details: `Plan "${plan.name}" deleted`,
      oldValues: plan.toObject(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'data_modification'
    });

    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });

  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during plan deletion'
    });
  }
};

// Toggle plan status (Admin only)
exports.togglePlanStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    const oldStatus = plan.isActive;
    plan.isActive = !plan.isActive;
    await plan.save();

    // Log the action
    await AuditLog.logAction({
      userId: req.user.userId,
      action: 'toggle_plan_status',
      resource: 'plan',
      resourceId: plan._id,
      details: `Plan "${plan.name}" status changed from ${oldStatus ? 'active' : 'inactive'} to ${plan.isActive ? 'active' : 'inactive'}`,
      oldValues: { isActive: oldStatus },
      newValues: { isActive: plan.isActive },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'data_modification'
    });

    res.json({
      success: true,
      message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
      plan
    });

  } catch (error) {
    console.error('Toggle plan status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during plan status change'
    });
  }
};

// Get plans by product type
exports.getPlansByProductType = async (req, res) => {
  try {
    const { productType } = req.params;

    if (!['Fibernet', 'Broadband Copper'].includes(productType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product type'
      });
    }

    const plans = await Plan.find({
      productType,
      isActive: true
    }).sort({ price: 1 });

    res.json({
      success: true,
      plans,
      count: plans.length
    });

  } catch (error) {
    console.error('Get plans by product type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Compare plans
exports.comparePlans = async (req, res) => {
  try {
    const { planIds } = req.body;

    if (!planIds || !Array.isArray(planIds) || planIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 plan IDs are required for comparison'
      });
    }

    if (planIds.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 4 plans can be compared at once'
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

    res.json({
      success: true,
      plans,
      comparison: {
        priceRange: {
          min: Math.min(...plans.map(p => p.price)),
          max: Math.max(...plans.map(p => p.price))
        },
        quotaRange: {
          min: Math.min(...plans.map(p => p.quota)),
          max: Math.max(...plans.map(p => p.quota))
        },
        speedRange: {
          min: Math.min(...plans.map(p => p.downloadSpeed)),
          max: Math.max(...plans.map(p => p.downloadSpeed))
        }
      }
    });

  } catch (error) {
    console.error('Compare plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
