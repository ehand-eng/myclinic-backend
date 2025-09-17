// Role-based access control middleware
// Replaces Auth0/OAuth logic with custom role-based verification

const roleMiddleware = {
  // Check if user has required role for advanced booking features
  requireAdvancedBookingAccess: (req, res, next) => {
    try {
      // Get user info from request (assuming it's set by previous authentication middleware)
      const user = req.user || req.body.user;
      
      // If no user info, check for user data in headers or body
      let userRole = null;
      
      if (user && user.role) {
        userRole = user.role.toLowerCase();
      } else {
        // Try to get role from custom headers or request body
        userRole = req.headers['x-user-role'] || req.body.userRole;
        if (userRole) {
          userRole = userRole.toLowerCase();
        }
      }
      
      console.log(`Role check for advanced booking features - User role: ${userRole}`);
      
      // Define allowed roles for advanced booking features (booking search, adjustment, status check)
      const allowedRoles = ['super-admin', 'dispensary-admin','channel-partner'];
      
      if (!userRole) {
        return res.status(401).json({
          message: 'Authentication required',
          error: 'No user role provided',
          requiredRoles: allowedRoles
        });
      }
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: 'Access denied',
          error: `Role '${userRole}' is not authorized for this operation`,
          requiredRoles: allowedRoles,
          userRole: userRole
        });
      }
      
      // User has required role, proceed to next middleware/route
      req.userRole = userRole;
      next();
      
    } catch (error) {
      console.error('Error in role middleware:', error);
      return res.status(500).json({
        message: 'Server error during role verification',
        error: error.message
      });
    }
  },

  // General role checker that accepts required roles as parameter
  requireRole: (requiredRoles) => {
    return (req, res, next) => {
      try {
        const user = req.user || req.body.user;
        let userRole = null;
        
        if (user && user.role) {
          userRole = user.role.toLowerCase();
        } else {
          userRole = req.headers['x-user-role'] || req.body.userRole;
          if (userRole) {
            userRole = userRole.toLowerCase();
          }
        }
        
        console.log(`Role check - User role: ${userRole}, Required: ${requiredRoles.join(', ')}`);
        
        if (!userRole) {
          return res.status(401).json({
            message: 'Authentication required',
            error: 'No user role provided',
            requiredRoles: requiredRoles
          });
        }
        
        const normalizedRequiredRoles = requiredRoles.map(role => role.toLowerCase());
        
        if (!normalizedRequiredRoles.includes(userRole)) {
          return res.status(403).json({
            message: 'Access denied',
            error: `Role '${userRole}' is not authorized for this operation`,
            requiredRoles: requiredRoles,
            userRole: userRole
          });
        }
        
        req.userRole = userRole;
        next();
        
      } catch (error) {
        console.error('Error in role middleware:', error);
        return res.status(500).json({
          message: 'Server error during role verification',
          error: error.message
        });
      }
    };
  },

  // Check if user can create bookings (includes channel partners)
  requireBookingCreationAccess: (req, res, next) => {
    try {
      const user = req.user || req.body.user;
      let userRole = null;
      
      if (user && user.role) {
        userRole = user.role.toLowerCase();
      } else {
        userRole = req.headers['x-user-role'] || req.body.userRole;
        if (userRole) {
          userRole = userRole.toLowerCase();
        }
      }
      
      console.log(`Role check for booking creation - User role: ${userRole}`);
      
      // Define allowed roles for booking creation
      const allowedRoles = ['super admin', 'dispensary admin', 'dispensary staff', 'channel partner'];
      
      if (!userRole) {
        return res.status(401).json({
          message: 'Authentication required',
          error: 'No user role provided',
          requiredRoles: allowedRoles
        });
      }
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: 'Access denied',
          error: `Role '${userRole}' is not authorized to create bookings`,
          requiredRoles: allowedRoles,
          userRole: userRole
        });
      }
      
      req.userRole = userRole;
      next();
      
    } catch (error) {
      console.error('Error in booking creation role check:', error);
      return res.status(500).json({
        message: 'Server error during role verification',
        error: error.message
      });
    }
  },

  // Check if user can view their own reports (channel partners can only see their own)
  requireOwnReportsAccess: (req, res, next) => {
    try {
      const user = req.user || req.body.user;
      let userRole = null;
      
      if (user && user.role) {
        userRole = user.role.toLowerCase();
      } else {
        userRole = req.headers['x-user-role'] || req.body.userRole;
        if (userRole) {
          userRole = userRole.toLowerCase();
        }
      }
      
      console.log(`Role check for reports access - User role: ${userRole}`);
      
      // Define allowed roles for reports access
      const allowedRoles = ['super admin', 'dispensary admin', 'channel partner'];
      
      if (!userRole) {
        return res.status(401).json({
          message: 'Authentication required',
          error: 'No user role provided',
          requiredRoles: allowedRoles
        });
      }
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: 'Access denied',
          error: `Role '${userRole}' is not authorized to view reports`,
          requiredRoles: allowedRoles,
          userRole: userRole
        });
      }
      
      // Set flag for channel partners to only see their own data
      req.isChannelPartner = userRole === 'channel partner';
      req.userRole = userRole;
      next();
      
    } catch (error) {
      console.error('Error in reports role check:', error);
      return res.status(500).json({
        message: 'Server error during role verification',
        error: error.message
      });
    }
  }
};

module.exports = roleMiddleware;