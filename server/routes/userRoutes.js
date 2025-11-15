const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { validateJwt, requireRole, ROLES } = require('../middleware/authMiddleware');
const { ManagementClient } = require('auth0');

// Setup Auth0 Management API client
let auth0Management;
try {
  auth0Management = new ManagementClient({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    scope: 'read:users update:users delete:users create:users',
    audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`
  });
  console.log('Auth0 Management API client initialized');
} catch (error) {
  console.error('Failed to initialize Auth0 Management API client:', error);
}

// Get all users (super_admin only)
router.get('/', async (req, res) => {
  try {
    console.log("SSSSS")
    const users = await User.find({}).select('-passwordHash');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', validateJwt, requireRole([ROLES.SUPER_ADMIN, ROLES.hospital_admin]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // For hospital_admin, check if they have access to this user's dispensary
    if (req.user.role === ROLES.hospital_admin) {
      const hasAccess = user.dispensaryIds.some(id => 
        req.user.dispensaryIds.includes(id)
      );
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this user' });
      }
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Create new user (super_admin only)
router.post('/', validateJwt, requireRole([ROLES.SUPER_ADMIN]), async (req, res) => {
  try {
    const { name, email, password, role, dispensaryIds } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate role
    if (!['super_admin', 'hospital_admin', 'hospital_staff'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Create user in Auth0
    let auth0User;
    try {
      auth0User = await auth0Management.users.create({
        email,
        name,
        password,
        connection: 'Username-Password-Authentication',
        email_verified: false,
        app_metadata: {
          role,
          dispensaryIds: dispensaryIds || []
        }
      });
    } catch (auth0Error) {
      console.error('Error creating Auth0 user:', auth0Error);
      return res.status(400).json({ 
        message: 'Failed to create user in Auth0',
        error: auth0Error.message 
      });
    }

    // Create user in our database
    const user = new User({
      name,
      email,
      auth0Id: auth0User.user_id,
      role,
      dispensaryIds: dispensaryIds || [],
      isActive: true,
      lastLogin: new Date()
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        dispensaryIds: user.dispensaryIds
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', validateJwt, requireRole([ROLES.SUPER_ADMIN, ROLES.hospital_admin]), async (req, res) => {
  try {
    const { name, email, role, dispensaryIds, isActive } = req.body;
    const userId = req.params.id;

    // Get user from our database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // For hospital_admin, check if they have access to this user's dispensary
    if (req.user.role === ROLES.hospital_admin) {
      const hasAccess = user.dispensaryIds.some(id => 
        req.user.dispensaryIds.includes(id)
      );
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this user' });
      }
    }

    // Update user in Auth0
    try {
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.app_metadata = { ...user.app_metadata, role };
      if (dispensaryIds) updateData.app_metadata = { ...user.app_metadata, dispensaryIds };

      await auth0Management.users.update({ id: user.auth0Id }, updateData);
    } catch (auth0Error) {
      console.error('Error updating Auth0 user:', auth0Error);
      return res.status(400).json({ 
        message: 'Failed to update user in Auth0',
        error: auth0Error.message 
      });
    }

    // Update user in our database
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (dispensaryIds) user.dispensaryIds = dispensaryIds;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        dispensaryIds: user.dispensaryIds,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', validateJwt, requireRole([ROLES.SUPER_ADMIN]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user from Auth0
    try {
      await auth0Management.users.delete({ id: user.auth0Id });
    } catch (auth0Error) {
      console.error('Error deleting Auth0 user:', auth0Error);
      return res.status(400).json({ 
        message: 'Failed to delete user from Auth0',
        error: auth0Error.message 
      });
    }

    // Delete user from our database
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router; 