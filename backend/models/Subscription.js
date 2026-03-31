const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  planId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Plan', 
    required: true 
  },
  startDate: { 
    type: Date, 
    default: Date.now 
  },
  endDate: { 
    type: Date,
    required: true
  },
  nextBillingDate: {
    type: Date
  },
  status: { 
    type: String, 
    enum: ['active', 'cancelled', 'expired', 'suspended', 'pending'], 
    default: 'active' 
  },
  autoRenew: { 
    type: Boolean, 
    default: true 
  },
  discountApplied: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Discount' 
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'bank_transfer', 'paypal'],
    default: 'credit_card'
  },
  lastPaymentDate: {
    type: Date
  },
  nextPaymentAmount: {
    type: Number
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  cancellationReason: {
    type: String
  },
  cancelledAt: {
    type: Date
  },
  notes: {
    type: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date,
    default: Date.now
  }
});

// Update updatedAt field before saving
subscriptionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ planId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });

// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const diffTime = this.endDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for isExpiringSoon
subscriptionSchema.virtual('isExpiringSoon').get(function() {
  return this.daysRemaining <= 7 && this.daysRemaining > 0;
});

// Ensure virtual fields are serialized
subscriptionSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
