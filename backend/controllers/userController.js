const User = require('../models/User');
const Subscription = require('../models/Subscription');
const AuditLog = require('../models/AuditLog');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's subscription summary
    const subscriptionSummary = await Subscription.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        subscriptionSummary
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, phone, address } = req.body;

    // Build update object
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log the action
    await AuditLog.logAction({
      userId,
      action: 'update_profile',
      resource: 'user',
      resourceId: userId,
      details: 'User profile updated',
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'data_modification'
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
};

// Get user's subscription history
exports.getUserSubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    const filter = { userId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const subscriptions = await Subscription.find(filter)
      .populate('planId', 'name price productType')
      .populate('discountApplied', 'name percentage')
      .sort({ createdAt: -1 })
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
    console.error('Get user subscription history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get user's usage history
exports.getUserUsageHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 30, startDate, endDate } = req.query;

    const filter = { userId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const Usage = require('../models/Usage');
    const usageHistory = await Usage.find(filter)
      .populate('subscriptionId', 'planId')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Usage.countDocuments(filter);

    // Calculate usage summary
    const usageSummary = await Usage.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalDataUsed: { $sum: '$dataUsed' },
          averageDailyUsage: { $avg: '$dataUsed' },
          peakUsage: { $max: '$dataUsed' },
          averageSpeed: { $avg: '$averageSpeed' }
        }
      }
    ]);

    res.json({
      success: true,
      usageHistory,
      usageSummary: usageSummary[0] || {
        totalDataUsed: 0,
        averageDailyUsage: 0,
        peakUsage: 0,
        averageSpeed: 0
      },
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get user usage history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get user's notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, unreadOnly = false } = req.query;

    const notifier = require('../utils/notifier');
    let notifications = notifier.getNotifications(userId, parseInt(limit));

    if (unreadOnly === 'true') {
      notifications = notifications.filter(n => !n.read);
    }

    const unreadCount = notifier.getUnreadCount(userId);

    res.json({
      success: true,
      notifications,
      unreadCount
    });

  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    const notifier = require('../utils/notifier');
    const success = notifier.markAsRead(userId, notificationId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Mark all notifications as read
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifier = require('../utils/notifier');
    notifier.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete user account (soft delete)
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { password, reason } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    // Verify password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Check for active subscriptions
    const activeSubscriptions = await Subscription.countDocuments({
      userId,
      status: 'active'
    });

    if (activeSubscriptions > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete account with active subscriptions. Please cancel all subscriptions first.'
      });
    }

    // Soft delete - deactivate account
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    user.username = `deleted_${Date.now()}_${user.username}`;
    await user.save();

    // Log the action
    await AuditLog.logAction({
      userId,
      action: 'delete_account',
      resource: 'user',
      resourceId: userId,
      details: `Account deleted. Reason: ${reason || 'Not specified'}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      category: 'data_modification',
      severity: 'high'
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during account deletion'
    });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get subscription statistics
    const subscriptionStats = await Subscription.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalSubscriptions: { $sum: 1 },
          activeSubscriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          totalSpent: { $sum: '$totalPaid' }
        }
      }
    ]);

    // Get usage statistics
    const Usage = require('../models/Usage');
    const usageStats = await Usage.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalDataUsed: { $sum: '$dataUsed' },
          averageDailyUsage: { $avg: '$dataUsed' },
          peakUsage: { $max: '$dataUsed' },
          daysWithUsage: { $sum: 1 }
        }
      }
    ]);

    // Get account age
    const user = await User.findById(userId);
    const accountAge = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      stats: {
        subscription: subscriptionStats[0] || {
          totalSubscriptions: 0,
          activeSubscriptions: 0,
          totalSpent: 0
        },
        usage: usageStats[0] || {
          totalDataUsed: 0,
          averageDailyUsage: 0,
          peakUsage: 0,
          daysWithUsage: 0
        },
        account: {
          age: accountAge,
          lastLogin: user.lastLogin,
          isActive: user.isActive
        }
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
