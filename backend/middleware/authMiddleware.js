const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided, authorization denied' 
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ 
        success: false,
        message: 'Server configuration error' 
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token is valid but user no longer exists' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'User account is deactivated' 
      });
    }

    req.user = {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      user: user // Full user object for convenience
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    } else if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token has expired' 
      });
    } else {
      console.error('Auth middleware error:', err);
      return res.status(500).json({ 
        success: false,
        message: 'Server error during authentication' 
      });
    }
  }
};

// Optional auth middleware - doesn't fail if no token
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      if (!process.env.JWT_SECRET) {
      return res.status(500).json({ 
        success: false,
        message: 'Server configuration error' 
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = {
          userId: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          user: user
        };
      }
    }
    
    next();
  } catch (err) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = { authMiddleware, optionalAuthMiddleware };
