
const { auth } = require('express-oauth2-jwt-bearer');
const jwt = require('jsonwebtoken');

// Auth0 JWT validation middleware with improved error handling
const validateJwt = (req, res, next) => {
  console.log("vvvvvvvvv=====")
  // Skip validation if no auth header is present (for development)
  if (process.env.NODE_ENV === 'development' && !req.headers.authorization) {
    console.log('Development mode: Skipping JWT validation');
    req.auth = { 
      payload: { 
        sub: 'dev-user',
        permissions: ['read:doctors', 'read:dispensaries']
      }
    };
    return next();
  }

  console.log('Auth header:', req.headers.authorization ? 'Present' : 'Not present');
  
  // Check if authentication header exists
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Authorization header is required' });
  }
  
  try {
    // Basic validation of the token format
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Invalid authorization format' });
    }
    
    console.log('Token format check passed, proceeding with Auth0 validation');
    
    // Debug token information
    try {
      const decodedHeader = jwt.decode(token, { complete: true })?.header;
      console.log('Token header:', decodedHeader ? JSON.stringify(decodedHeader) : 'Unable to decode token header');
    } catch (err) {
      console.log('Token decode attempt failed:', err.message);
    }
    
    // Use Auth0 JWT validation
    const authMiddleware = auth({
      audience: process.env.AUTH0_AUDIENCE,
      issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
      tokenSigningAlg: 'RS256',
      credentialsRequired: true
    });
    
    // Handle potential errors from the auth middleware
    authMiddleware(req, res, (err) => {
      if (err) {
        console.error('JWT validation error:', err.message);
        
        // Special handling for development mode
        if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
          console.log('Development mode with BYPASS_AUTH: Proceeding despite JWT error');
          req.auth = { 
            payload: { 
              sub: 'dev-user',
              permissions: ['read:doctors', 'read:dispensaries', 'manage:timeslots', 'update:bookings', 'create:bookings', 'read:bookings']
            }
          };
          return next();
        }
        
        return res.status(401).json({
          message: 'Authentication failed',
          error: err.message
        });
      }
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check if user has the required permissions
const checkPermissions = (requiredPermissions) => {
  return (req, res, next) => {
    // If in development mode without auth header, allow access
    if (process.env.NODE_ENV === 'development' && !req.headers.authorization) {
      return next();
    }

    const permissions = req.auth?.permissions || [];
    
    // Check if the user has all the required permissions
    const hasRequiredPermissions = requiredPermissions.every(permission => 
      permissions.includes(permission)
    );

    if (!hasRequiredPermissions) {
      return res.status(403).json({
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    // If in development mode without auth header, allow access
    if (process.env.NODE_ENV === 'development' && !req.headers.authorization) {
      return next();
    }

    // Extract token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Decode JWT (already validated by validateJwt)
      const decoded = jwt.decode(token);
      
      if (!decoded) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Get user roles from Auth0 token
      const userRoles = decoded[`${process.env.AUTH0_AUDIENCE}/roles`] || [];
      
      // Check if user has any of the required roles
      const hasRole = roles.some(role => userRoles.includes(role));
      
      if (!hasRole) {
        return res.status(403).json({ message: 'Insufficient role' });
      }
      
      // Add user info to request
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        roles: userRoles
      };
      
      next();
    } catch (error) {
      console.error('Role validation error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
};

// Auth0 permissions mapping
const PERMISSIONS = {
  // Doctor permissions
  CREATE_DOCTOR: 'create:doctors',
  UPDATE_DOCTOR: 'update:doctors',
  DELETE_DOCTOR: 'delete:doctors',
  READ_DOCTORS: 'read:doctors',
  
  // Dispensary permissions
  CREATE_DISPENSARY: 'create:dispensaries',
  UPDATE_DISPENSARY: 'update:dispensaries',
  DELETE_DISPENSARY: 'delete:dispensaries',
  READ_DISPENSARIES: 'read:dispensaries',
  
  // TimeSlot permissions
  MANAGE_TIMESLOTS: 'manage:timeslots',
  
  // Booking permissions
  UPDATE_BOOKING: 'update:bookings',
  CREATE_BOOKING: 'create:bookings',
  READ_BOOKINGS: 'read:bookings',
  
  // Reports permissions
  VIEW_REPORTS: 'view:reports'
};

// Auth0 roles mapping
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  hospital_admin: 'hospital_admin',
  hospital_staff: 'hospital_staff'
};

module.exports = {
  validateJwt,
  checkPermissions,
  requireRole,
  PERMISSIONS,
  ROLES
};
