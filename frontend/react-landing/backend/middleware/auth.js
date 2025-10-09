const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔍 Auth middleware called for:', req.path);
    const authHeader = req.headers['authorization'];
    console.log('🔍 Auth header:', authHeader ? 'Present' : 'Missing');
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    console.log('🔍 Token:', token ? token.substring(0, 20) + '...' : 'Missing');

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        message: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    console.log('🔍 Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔍 Token decoded:', decoded);
    
    // Get user from database
    console.log('🔍 Looking up user:', decoded.userId);
    const user = await User.findById(decoded.userId).select('-password');
    console.log('🔍 User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({ 
        message: 'Invalid token - user not found',
        code: 'INVALID_TOKEN'
      });
    }

    // Add user to request object
    req.user = user;
    console.log('✅ User authenticated:', user.email);
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware to check if user is verified
const requireEmailVerification = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({ 
      message: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
};

// Middleware to check subscription plan
const requireSubscription = (requiredPlan) => {
  const planHierarchy = {
    'free': 0,
    'premium': 1,
    'enterprise': 2
  };

  return (req, res, next) => {
    const userPlan = planHierarchy[req.user.subscription.plan] || 0;
    const required = planHierarchy[requiredPlan] || 0;

    if (userPlan < required) {
      return res.status(403).json({ 
        message: `${requiredPlan} subscription required`,
        code: 'SUBSCRIPTION_REQUIRED',
        requiredPlan
      });
    }
    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticateToken,
  requireEmailVerification,
  requireSubscription,
  optionalAuth
};
