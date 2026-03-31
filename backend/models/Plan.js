const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    unique: true
  },
  description: { 
    type: String,
    trim: true
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  quota: { 
    type: Number, 
    required: true,
    min: 0
  }, // e.g., data quota in GB
  productType: { 
    type: String, 
    enum: ['Fibernet', 'Broadband Copper'], 
    required: true 
  },
  features: [{
    name: String,
    description: String,
    included: {
      type: Boolean,
      default: true
    }
  }],
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxUsers: {
    type: Number,
    default: 1
  },
  downloadSpeed: {
    type: Number, // in Mbps
    required: true
  },
  uploadSpeed: {
    type: Number, // in Mbps
    required: true
  },
  setupFee: {
    type: Number,
    default: 0
  },
  contractLength: {
    type: Number, // in months
    default: 12
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
planSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
planSchema.index({ productType: 1, isActive: 1 });
planSchema.index({ price: 1 });

module.exports = mongoose.model('Plan', planSchema);
