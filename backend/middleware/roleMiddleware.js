const { authMiddleware } = require('./authMiddleware');

const roleMiddleware = (roles) => {
  return (req, res, next) => {
    // First check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Specific role middlewares for convenience
const adminOnly = roleMiddleware(['admin']);
const userOnly = roleMiddleware(['user']);
const adminOrUser = roleMiddleware(['admin', 'user']);

// Middleware to check if user can access their own resource or is admin
const ownResourceOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }

  const resourceUserId = req.params.userId || req.params.id;
  
  // Allow if user is admin or accessing their own resource
  if (req.user.role === 'admin' || req.user.userId.toString() === resourceUserId) {
    return next();
  }

  return res.status(403).json({ 
    success: false,
    message: 'Access denied. You can only access your own resources.' 
  });
};

// Middleware to check subscription ownership
const subscriptionOwnerOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    // Admin can access any subscription
    if (req.user.role === 'admin') {
      return next();
    }

    const subscriptionId = req.params.subscriptionId || req.params.id;
    const Subscription = require('../models/Subscription');
    
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ 
        success: false,
        message: 'Subscription not found' 
      });
    }

    // Check if user owns the subscription
    if (subscription.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. You can only access your own subscriptions.' 
      });
    }

    next();
  } catch (error) {
    console.error('Subscription ownership check error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error during authorization check' 
    });
  }
};

module.exports = {
  roleMiddleware,
  adminOnly,
  userOnly,
  adminOrUser,
  ownResourceOrAdmin,
  subscriptionOwnerOrAdmin
};
