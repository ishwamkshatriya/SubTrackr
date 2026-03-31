const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const Discount = require('../models/Discount');
const DiscountUsage = require('../models/DiscountUsage');
const AuditLog = require('../models/AuditLog');
const notifier = require('../utils/notifier');
const { validatePositiveNumber, validateDateRange } = require('../utils/validators');

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      isActive, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    // Get subscription counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const subscriptionCount = await Subscription.countDocuments({ userId: user._id });
        const activeSubscriptionCount = await Subscription.countDocuments({ 
          userId: user._id, 
          status: 'active' 
        });
        
        return {
          ...user.toObject(),
          subscriptionCount,
          activeSubscriptionCount
        };
      })
    );

    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get user by ID (Admin only)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's subscriptions
    const subscriptions = await Subscription.find({ userId: id })
      .populate('planId', 'name price productType')
      .sort({ createdAt: -1 });

    // Get user's usage summary
    const Usage = require('../models/Usage');
    const usageSummary = await Usage.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalDataUsed: { $sum: '$dataUsed' },
          averageDailyUsage: { $avg: '$dataUsed' },
          peakUsage: { $max: '$dataUsed' }
        }
      }
    ]);

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        subscriptions,
        usageSummary: usageSummary[0] || {
          totalDataUsed: 0,
          averageDailyUsage: 0,
          peakUsage: 0
        }
      }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update user (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove sensitive fields
    delete updateData.password;
    delete updateData._id;
    delete updateData.createdAt;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Store old values for audit log
    const oldValues = user.toObject();

    // Update user
    Object.assign(user, updateData);
    
    // Validate the updated user
    try {
      await user.save();
    } catch (error) {
      console.error('Error saving user update:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating user'
      });
    }

    // Log the action
    await AuditLog.logAction({
      userId: req.user.userId,
      action: 'update_user',
      resource: 'user',
      resourceId: user._id,
      details: `User "${user.username}" updated by admin`,
      oldValues,
      newValues: user.toObject(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'data_modification'
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: user.toObject()
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during user update'
    });
  }
};

// Toggle user status (Admin only)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Store old values for audit log
    const oldValues = user.toObject();

    // Toggle user status
    user.isActive = !user.isActive;
    await user.save();

    // Log the action
    await AuditLog.logAction({
      userId: req.user.userId,
      action: 'toggle_user_status',
      resource: 'user',
      resourceId: user._id,
      details: `User "${user.username}" status changed from ${oldValues.isActive ? 'active' : 'inactive'} to ${user.isActive ? 'active' : 'inactive'}`,
      oldValues,
      newValues: user.toObject(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'data_modification'
    });

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: user.toObject()
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during user status change'
    });
  }
};

// Create discount (Admin only)
exports.createDiscount = async (req, res) => {
  try {
    const {
      name,
      description,
      code,
      type,
      value,
      maxDiscountAmount,
      minOrderAmount,
      applicablePlans,
      applicableProductTypes,
      conditions,
      startDate,
      endDate,
      usageLimit,
      isPublic
    } = req.body;

    // Validation
    if (!name || !code || !type || !value || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, type, value, start date, and end date are required'
      });
    }

    // Validate discount value
    const valueValidation = validatePositiveNumber(value, 'Discount value');
    if (!valueValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: valueValidation.message
      });
    }

    // Validate date range
    const dateValidation = validateDateRange(startDate, endDate);
    if (!dateValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: dateValidation.message
      });
    }

    // Check if discount code already exists
    const existingDiscount = await Discount.findOne({ code: code.toUpperCase() });
    if (existingDiscount) {
      return res.status(400).json({
        success: false,
        message: 'Discount code already exists'
      });
    }

    const discount = new Discount({
      name,
      description,
      code: code.toUpperCase(),
      type,
      value,
      maxDiscountAmount,
      minOrderAmount: minOrderAmount || 0,
      applicablePlans: applicablePlans || [],
      applicableProductTypes: applicableProductTypes || [],
      conditions,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      usageLimit,
      isPublic: isPublic !== undefined ? isPublic : true,
      createdBy: req.user.userId
    });

    await discount.save();

    // Log the action
    await AuditLog.logAction({
      userId: req.user.userId,
      action: 'create_discount',
      resource: 'discount',
      resourceId: discount._id,
      details: `Discount "${name}" created with code "${code}"`,
      newValues: discount.toObject(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'data_modification'
    });

    res.status(201).json({
      success: true,
      message: 'Discount created successfully',
      discount
    });

  } catch (error) {
    console.error('Create discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during discount creation'
    });
  }
};

// Get all discounts (Admin only)
exports.getDiscounts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isActive, 
      isPublic,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    if (isActive !== undefined) {
      const now = new Date();
      if (isActive === 'true') {
        filter.isActive = true;
        filter.startDate = { $lte: now };
        filter.endDate = { $gte: now };
      } else {
        filter.$or = [
          { isActive: false },
          { startDate: { $gt: now } },
          { endDate: { $lt: now } }
        ];
      }
    }
    if (isPublic !== undefined) filter.isPublic = isPublic === 'true';

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const discounts = await Discount.find(filter)
      .populate('createdBy', 'username email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Discount.countDocuments(filter);

    res.json({
      success: true,
      discounts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get discounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get discount usage report (admin)
exports.getDiscountUsageReport = async (req, res) => {
  try {
    const { code, userId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (code) filter.code = String(code).toUpperCase();
    if (userId) filter.userId = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [rows, total] = await Promise.all([
      DiscountUsage.find(filter)
        .populate('userId', 'username email')
        .populate('subscriptionId', 'status')
        .populate('discountId', 'name code')
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      DiscountUsage.countDocuments(filter)
    ]);

    res.json({
      success: true,
      usage: rows,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get discount usage report error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching discount usage' });
  }
};

// Update discount (Admin only)
exports.updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.createdBy;

    const discount = await Discount.findById(id);
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found'
      });
    }

    // Store old values for audit log
    const oldValues = discount.toObject();

    // Update discount
    Object.assign(discount, updateData);
    
    // Validate the updated discount
    try {
      await discount.save();
    } catch (error) {
      console.error('Error saving discount update:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating discount'
      });
    }

    // Log the action
    await AuditLog.logAction({
      userId: req.user.userId,
      action: 'update_discount',
      resource: 'discount',
      resourceId: discount._id,
      details: `Discount "${discount.name}" updated`,
      oldValues,
      newValues: discount.toObject(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'data_modification'
    });

    res.json({
      success: true,
      message: 'Discount updated successfully',
      discount
    });

  } catch (error) {
    console.error('Update discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during discount update'
    });
  }
};

// Delete discount (Admin only)
exports.deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;

    const discount = await Discount.findById(id);
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found'
      });
    }

    // Check if discount is being used by any subscriptions
    const usedSubscriptions = await Subscription.countDocuments({
      discountApplied: id
    });

    if (usedSubscriptions > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete discount. It is being used by ${usedSubscriptions} subscription(s). Consider deactivating instead.`
      });
    }

    await Discount.findByIdAndDelete(id);

    // Log the action
    await AuditLog.logAction({
      userId: req.user.userId,
      action: 'delete_discount',
      resource: 'discount',
      resourceId: id,
      details: `Discount "${discount.name}" deleted`,
      oldValues: discount.toObject(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'data_modification'
    });

    res.json({
      success: true,
      message: 'Discount deleted successfully'
    });

  } catch (error) {
    console.error('Delete discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during discount deletion'
    });
  }
};

// Send notification to users (Admin only)
exports.sendNotification = async (req, res) => {
  try {
    const { userIds, message, type = 'info', data = {} } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs are required'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Send notifications
    const results = await notifier.sendBulkNotification(userIds, message, type, data);

    // Log the action
    await AuditLog.logAction({
      userId: req.user.userId,
      action: 'send_notification',
      resource: 'notification',
      details: `Notification sent to ${userIds.length} users: ${message}`,
      newValues: { userIds, message, type, data },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'system'
    });

    res.json({
      success: true,
      message: 'Notifications sent successfully',
      results
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during notification sending'
    });
  }
};

// Send notification to all users with a specific role (Admin only)
exports.sendNotificationToRole = async (req, res) => {
  try {
    const { role, message, type = 'info', data = {} } = req.body;

    if (!role || !message) {
      return res.status(400).json({
        success: false,
        message: 'Role and message are required'
      });
    }

    // Send notifications to role
    const results = await notifier.sendNotificationToRole(role, message, type, data);

    // Log the action
    await AuditLog.logAction({
      userId: req.user.userId,
      action: 'send_notification_to_role',
      resource: 'notification',
      details: `Notification sent to all ${role}s: ${message}`,
      newValues: { role, message, type, data },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'system'
    });

    res.json({
      success: true,
      message: `Notifications sent to all ${role}s successfully`,
      results
    });

  } catch (error) {
    console.error('Send notification to role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during notification sending'
    });
  }
};

// Get public discounts (no authentication required)
exports.getPublicDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find({
      isActive: true,
      isPublic: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).select('-createdBy -updatedAt');

    res.json({
      success: true,
      discounts,
      count: discounts.length
    });
  } catch (error) {
    console.error('Get public discounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching public discounts'
    });
  }
};
