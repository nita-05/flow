const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register new user
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    await user.updateLastLogin();

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Login user
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    await user.updateLastLogin();

    res.json({
      message: 'Login successful',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Failed to get user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be either light or dark')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedUpdates = ['name', 'preferences'];
    const updates = {};

    // Only allow specific fields to be updated
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        message: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    message: 'Logout successful'
  });
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: req.user.getPublicProfile()
  });
});

// Google OAuth Routes
router.get('/google', passport.authenticate('google', {
  scope: ['openid', 'email', 'profile'],
  accessType: 'offline',
  prompt: 'consent'
}));

router.get('/google/callback', 
  (req, res, next) => {
    // Check if required environment variables are set
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('❌ Google OAuth credentials not configured');
      return res.status(500).json({
        message: 'Google OAuth not configured',
        error: 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment variables'
      });
    }
    
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not configured');
      return res.status(500).json({
        message: 'JWT secret not configured',
        error: 'Missing JWT_SECRET in environment variables'
      });
    }
    
    next();
  },
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_auth_failed` 
  }),
  (req, res) => {
    // Successful authentication: issue JWT so frontend can call protected APIs
    try {
      console.log('🔑 Generating JWT token for user:', req.user._id);
      console.log('🔑 JWT_SECRET present:', process.env.JWT_SECRET ? 'Yes' : 'No');
      
      if (!process.env.JWT_SECRET) {
        console.error('❌ JWT_SECRET is missing from environment variables');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=jwt_secret_missing`);
      }
      
      const token = generateToken(req.user._id);
      console.log('✅ JWT token generated successfully');

      // Option 1: also set a non-HTTP-only cookie for quick dev usage
      // Note: For production, prefer HttpOnly cookies and header-based auth via frontend
      res.cookie('token', token, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // Redirect with token as query param so frontend can store it
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?jwt=${encodeURIComponent(token)}`;
      console.log('🔄 Redirecting to dashboard:', redirectUrl);
      return res.redirect(redirectUrl);
    } catch (e) {
      console.error('❌ JWT generation error:', e.message);
      console.error('❌ Error stack:', e.stack);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=token_issue_failed`);
    }
  }
);

// Get current session user
router.get('/session', (req, res) => {
  console.log('Session endpoint called, req.user:', req.user);
  if (req.user) {
    const userProfile = req.user.getPublicProfile();
    console.log('User profile being returned:', userProfile);
    res.json({
      message: 'User authenticated',
      user: userProfile
    });
  } else {
    console.log('No user in session');
    res.status(401).json({
      message: 'No active session',
      code: 'NO_SESSION'
    });
  }
});

// Logout (destroy session)
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        message: 'Logout failed',
        error: err.message
      });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          message: 'Session destruction failed',
          error: err.message
        });
      }
      res.clearCookie('connect.sid');
      res.json({
        message: 'Logout successful'
      });
    });
  });
});

// Get AI usage statistics
router.get('/ai-usage', (req, res) => {
  try {
    const aiService = require('../services/aiService');
    const stats = aiService.getUsageStats();
    
    res.json({
      message: 'AI usage statistics',
      stats: {
        ...stats,
        totalCostFormatted: `$${stats.totalCost.toFixed(4)}`,
        averageCostPerRequestFormatted: `$${stats.averageCostPerRequest.toFixed(4)}`
      }
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    res.status(500).json({
      message: 'Failed to get usage statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
