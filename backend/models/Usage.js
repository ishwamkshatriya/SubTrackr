const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
  subscriptionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subscription', 
    required: true 
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  dataUsed: { 
    type: Number, 
    required: true,
    min: 0
  }, // in GB
  dataDownloaded: {
    type: Number,
    default: 0,
    min: 0
  },
  dataUploaded: {
    type: Number,
    default: 0,
    min: 0
  },
  peakHours: {
    type: Number,
    default: 0
  }, // hours of peak usage
  offPeakHours: {
    type: Number,
    default: 0
  }, // hours of off-peak usage
  devicesConnected: {
    type: Number,
    default: 1,
    min: 1
  },
  averageSpeed: {
    type: Number,
    default: 0
  }, // in Mbps
  peakSpeed: {
    type: Number,
    default: 0
  }, // in Mbps
  latency: {
    type: Number,
    default: 0
  }, // in milliseconds
  packetLoss: {
    type: Number,
    default: 0
  }, // percentage
  timeOfDay: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night'],
    default: 'evening'
  },
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    default: 'monday'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for better query performance
usageSchema.index({ subscriptionId: 1, date: 1 });
usageSchema.index({ userId: 1, date: 1 });
usageSchema.index({ date: 1 });

// Virtual for total usage percentage
usageSchema.virtual('usagePercentage').get(function() {
  // This would need to be calculated based on the plan's quota
  // For now, return a placeholder
  return 0;
});

// Ensure virtual fields are serialized
usageSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Usage', usageSchema);
