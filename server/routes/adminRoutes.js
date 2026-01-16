const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const Dispensary = require('../models/Dispensary');

const router = express.Router();

// Custom middleware to verify admin access (temporary until Auth0 is fully removed)
const requireSuperAdmin = async (req, res, next) => {
  try {
    // For now, accept both Auth0 and custom JWT tokens
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    let userId;
    
    // Try to decode custom JWT first
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const user = await User.findById(decoded.userId).populate('role');
      if (!user || user.role.name !== 'super-admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }
      
      req.user = user;
      return next();
    } catch (jwtError) {
      // If custom JWT fails, this might be an Auth0 token (for backward compatibility)
      // In production, remove this fallback
      if (process.env.NODE_ENV === 'development') {
        return next();
      } else {
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all roles
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true }).select('name displayName description permissions');
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
});

// Get all users with role and dispensary info
router.get('/users', requireSuperAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .populate('role', 'name displayName')
      .populate('dispensaryIds', 'name address')
      .select('-passwordHash -auth0Id');

    const processedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role ? user.role.name : null,
      roleDisplayName: user.role ? user.role.displayName : null,
      dispensaries: user.dispensaryIds.map(d => ({
        id: d._id,
        name: d.name,
        address: d.address
      })),
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json(processedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Create new user (Super Admin only)
router.post('/users', requireSuperAdmin, async (req, res) => {
  console.log("++++++++++++++ req.body ++++++++++++++", req.body);
  try {
    const { name, email, password, role, dispensaryId, nationality } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Validate role
    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // For dispensary roles, dispensaryId is required
    if (['dispensary-admin', 'dispensary-staff'].includes(role) && !dispensaryId) {
      return res.status(400).json({ message: 'Dispensary is required for this role' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      passwordHash,
      role: roleDoc._id,
      dispensaryIds: dispensaryId ? [dispensaryId] : [],
      isActive: true,
      nationality: nationality || 'sri_lanka' // Default to 'sri_lanka' if not provided
    });

    await user.save();

    // Return user without password hash
    const newUser = await User.findById(user._id)
      .populate('role', 'name displayName')
      .populate('dispensaryIds', 'name address')
      .select('-passwordHash');

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Update user role and dispensary assignment
router.put('/users/:userId', requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, dispensaryId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update role if provided
    if (role) {
      const roleDoc = await Role.findOne({ name: role });
      if (!roleDoc) {
        return res.status(400).json({ message: 'Invalid role specified' });
      }
      user.role = roleDoc._id;
    }

    // Update dispensary assignment if provided
    if (dispensaryId !== undefined) {
      if (dispensaryId) {
        user.dispensaryIds = [dispensaryId];
      } else {
        user.dispensaryIds = [];
      }
    }

    await user.save();

    // Return updated user
    const updatedUser = await User.findById(userId)
      .populate('role', 'name displayName')
      .populate('dispensaryIds', 'name address')
      .select('-passwordHash');

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:userId', requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate('role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of super-admin users
    if (user.role && user.role.name === 'super-admin') {
      return res.status(400).json({ message: 'Cannot delete super admin users' });
    }

    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get all dispensaries
router.get('/dispensaries', async (req, res) => {
  try {
    const dispensaries = await Dispensary.find({ isActive: true }).select('name address');
    res.json(dispensaries);
  } catch (error) {
    console.error('Error fetching dispensaries:', error);
    res.status(500).json({ message: 'Failed to fetch dispensaries' });
  }
});

module.exports = router;