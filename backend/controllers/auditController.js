const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// Get audit logs with filtering and pagination
exports.getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resource,
      category,
      severity,
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (resource) filter.resource = resource;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const auditLogs = await AuditLog.find(filter)
      .populate('userId', 'username email role')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      auditLogs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get audit log by ID
exports.getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const auditLog = await AuditLog.findById(id)
      .populate('userId', 'username email role');

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      auditLog
    });

  } catch (error) {
    console.error('Get audit log by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get audit logs for a specific user
exports.getUserAuditLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 50,
      action,
      resource,
      category,
      startDate,
      endDate
    } = req.query;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build filter
    const filter = { userId };
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (resource) filter.resource = resource;
    if (category) filter.category = category;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const auditLogs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      auditLogs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get user audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get audit logs for a specific resource
exports.getResourceAuditLogs = async (req, res) => {
  try {
    const { resource, resourceId } = req.params;
    const {
      page = 1,
      limit = 50,
      action,
      category,
      startDate,
      endDate
    } = req.query;

    // Build filter
    const filter = { resource, resourceId };
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (category) filter.category = category;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const auditLogs = await AuditLog.find(filter)
      .populate('userId', 'username email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      resource,
      resourceId,
      auditLogs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get resource audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get audit log statistics
exports.getAuditLogStats = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
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

    const [
      totalLogs,
      logsByAction,
      logsByCategory,
      logsBySeverity,
      dailyLogs,
      topUsers
    ] = await Promise.all([
      AuditLog.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate }
      }),
      AuditLog.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      AuditLog.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      AuditLog.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      AuditLog.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      AuditLog.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate },
            userId: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$userId',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            username: '$user.username',
            email: '$user.email',
            role: '$user.role',
            count: 1
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      period,
      dateRange: { startDate, endDate },
      stats: {
        totalLogs,
        logsByAction,
        logsByCategory,
        logsBySeverity,
        dailyLogs,
        topUsers
      }
    });

  } catch (error) {
    console.error('Get audit log stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get security-related audit logs
exports.getSecurityAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      severity
    } = req.query;

    // Build filter for security-related logs
    const filter = {
      category: 'security'
    };

    if (severity) {
      filter.severity = severity;
    } else {
      // Default to medium and high severity for security logs
      filter.severity = { $in: ['medium', 'high', 'critical'] };
    }
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const auditLogs = await AuditLog.find(filter)
      .populate('userId', 'username email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      auditLogs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get security audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Export audit logs to CSV (simplified version)
exports.exportAuditLogs = async (req, res) => {
  try {
    const {
      userId,
      action,
      resource,
      category,
      severity,
      startDate,
      endDate,
      limit = 1000
    } = req.query;

    // Build filter
    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (resource) filter.resource = resource;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const auditLogs = await AuditLog.find(filter)
      .populate('userId', 'username email role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    // Convert to CSV format
    const csvHeaders = [
      'Timestamp',
      'User',
      'Action',
      'Resource',
      'Resource ID',
      'Details',
      'Category',
      'Severity',
      'IP Address'
    ];

    const csvRows = auditLogs.map(log => [
      log.timestamp.toISOString(),
      log.userId ? `${log.userId.username} (${log.userId.email})` : 'System',
      log.action,
      log.resource || '',
      log.resourceId || '',
      log.details || '',
      log.category,
      log.severity,
      log.ipAddress || ''
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
    res.send(csvContent);

  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during export'
    });
  }
};
