const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// JWT validation middleware for custom authentication
const validateCustomJwt = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user with role information
    const user = await User.findById(decoded.userId).populate('role');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive' });
    }
    
    // Add user info to request
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role ? user.role.name : null,
      permissions: user.role ? user.role.permissions : [],
      dispensaryIds: user.dispensaryIds
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    console.error('JWT validation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!Array.isArray(roles)) {
      roles = [roles];
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient privileges' });
    }
    
    next();
  };
};

// Permission-based access control
const requirePermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!Array.isArray(permissions)) {
      permissions = [permissions];
    }
    
    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Hybrid middleware that supports both Auth0 and custom JWT during migration
const validateHybridJwt = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For development mode, allow bypass
      if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
        req.user = {
          id: 'dev-user',
          email: 'dev@example.com',
          name: 'Development User',
          role: 'super-admin',
          permissions: ['manage:users', 'manage:roles', 'manage:dispensaries', 'manage:doctors', 'manage:fees'],
          dispensaryIds: []
        };
        return next();
      }
      
      return res.status(401).json({ message: 'Authorization token required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Try custom JWT first
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).populate('role');
      
      if (user && user.isActive) {
        req.user = {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role ? user.role.name : null,
          permissions: user.role ? user.role.permissions : [],
          dispensaryIds: user.dispensaryIds
        };
        return next();
      }
    } catch (customJwtError) {
      // If custom JWT fails, try Auth0 validation (for backward compatibility)
      try {
        const { auth } = require('express-oauth2-jwt-bearer');
        const authMiddleware = auth({
          audience: process.env.AUTH0_AUDIENCE,
          issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
          tokenSigningAlg: 'RS256'
        });
        
        authMiddleware(req, res, (err) => {
          if (err) {
            return res.status(401).json({ message: 'Authentication failed' });
          }
          
          // For Auth0 users, add compatibility layer
          req.user = {
            id: req.auth.payload.sub,
            email: req.auth.payload.email,
            role: 'super-admin', // Default for Auth0 users during migration
            permissions: ['manage:users', 'manage:roles', 'manage:dispensaries'],
            dispensaryIds: []
          };
          
          next();
        });
      } catch (auth0Error) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
  } catch (error) {
    console.error('Hybrid JWT validation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  validateCustomJwt,
  validateHybridJwt,
  requireRole,
  requirePermission
};