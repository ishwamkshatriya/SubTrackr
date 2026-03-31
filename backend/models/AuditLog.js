const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  action: { 
    type: String, 
    required: true,
    trim: true
  },
  resource: {
    type: String,
    trim: true
  }, // e.g., 'plan', 'subscription', 'user'
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: { 
    type: String,
    trim: true
  },
  oldValues: {
    type: mongoose.Schema.Types.Mixed
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  category: {
    type: String,
    enum: ['authentication', 'authorization', 'data_access', 'data_modification', 'system', 'security'],
    default: 'data_modification'
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  sessionId: {
    type: String
  },
  requestId: {
    type: String
  }
});

// Index for better query performance
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ category: 1, timestamp: -1 });

// Static method to log an action
auditLogSchema.statics.logAction = async function(data) {
  try {
    const auditLog = new this(data);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main operation
  }
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
