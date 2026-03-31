const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount'],
    required: true
  },
  value: { 
    type: Number, 
    required: true,
    min: 0
  }, // percentage or fixed amount
  maxDiscountAmount: {
    type: Number,
    min: 0
  }, // maximum discount amount for percentage discounts
  minOrderAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  applicablePlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  }],
  applicableProductTypes: [{
    type: String,
    enum: ['Fibernet', 'Broadband Copper']
  }],
  conditions: { 
    type: String,
    trim: true
  }, // e.g., 'seasonal', 'new_customer', 'loyalty'
  startDate: { 
    type: Date,
    required: true
  },
  endDate: { 
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  }, // whether discount is visible to users
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
discountSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
discountSchema.index({ code: 1 });
discountSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
discountSchema.index({ applicableProductTypes: 1 });

// Virtual for isCurrentlyValid
discountSchema.virtual('isCurrentlyValid').get(function() {
  const now = new Date();
  return this.isActive && 
         this.startDate <= now && 
         this.endDate >= now &&
         (this.usageLimit === null || this.usedCount < this.usageLimit);
});

// Virtual for remainingUses
discountSchema.virtual('remainingUses').get(function() {
  if (this.usageLimit === null) return 'unlimited';
  return Math.max(0, this.usageLimit - this.usedCount);
});

// Ensure virtual fields are serialized
discountSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Discount', discountSchema);
