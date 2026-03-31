const mongoose = require('mongoose');

const discountUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  discountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discount',
    required: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true
  },
  amountBefore: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    required: true
  },
  amountAfter: {
    type: Number,
    required: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

discountUsageSchema.index({ discountId: 1, appliedAt: -1 });
discountUsageSchema.index({ userId: 1, appliedAt: -1 });

module.exports = mongoose.model('DiscountUsage', discountUsageSchema);


