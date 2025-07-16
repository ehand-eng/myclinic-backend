const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { validateJwt, requireRole, ROLES } = require('../middleware/authMiddleware');
const { ManagementClient } = require('auth0');
const Dispensary = require('../models/Dispensary');

// Setup Auth0 Management API client
let auth0Management;
try {
  auth0Management = new ManagementClient({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    scope: 'read:users read:user_idp_tokens read:user_metadata read:user_app_metadata',
    audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`
  });
} catch (error) {
  console.error('Failed to initialize Auth0 Management API client:', error);
}

// Get all users with their dispensary assignments
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-passwordHash');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get users by dispensary
router.get('/dispensary/:dispensaryId/users', validateJwt, requireRole([ROLES.SUPER_ADMIN, ROLES.hospital_admin]), async (req, res) => {
  try {
    const { dispensaryId } = req.params;
    const users = await User.find({ dispensaryIds: dispensaryId }).select('-passwordHash');
    res.json(users);
  } catch (error) {
    console.error('Error fetching dispensary users:', error);
    res.status(500).json({ message: 'Failed to fetch dispensary users' });
  }
});

// Assign user to dispensary
router.post('/assign', async (req, res) => {
  try {
    const { userId, dispensaryId, role } = req.body;

    // Validate role
    if (!['hospital_admin', 'hospital_staff'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Get user from our database
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's dispensary assignments
    if (!user.dispensaryIds.includes(dispensaryId)) {
      user.dispensaryIds.push(dispensaryId);
    }

    // Update user's role if needed
    if (role === 'hospital_admin' && user.role !== 'hospital_admin') {
      user.role = 'hospital_admin';
    }

    await user.save();

    // Update Auth0 user metadata
    // try {
    //   await auth0Management.users.update({ _id: userId }, {
    //     app_metadata: {
    //       dispensaryIds: user.dispensaryIds,
    //       role: user.role
    //     }
    //   });
    // } catch (auth0Error) {
    //   console.error('Error updating Auth0 user:', auth0Error);
    //   // Continue even if Auth0 update fails
    // }

    res.json({ message: 'User assigned to dispensary successfully', user });
  } catch (error) {
    console.error('Error assigning user to dispensary:', error);
    res.status(500).json({ message: 'Failed to assign user to dispensary' });
  }
});

// Remove user from dispensary
//router.delete('/unassign', validateJwt, requireRole([ROLES.SUPER_ADMIN]), async (req, res) => {
router.delete('/unassign', async (req, res) => {
  try {
    const { userId, dispensaryId } = req.body;

    // Get user from our database
    const user = await User.findOne({ auth0Id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove dispensary from user's assignments
    user.dispensaryIds = user.dispensaryIds.filter(id => id !== dispensaryId);

    // If user has no dispensaries left, set role to basic user
    if (user.dispensaryIds.length === 0) {
      user.role = 'user';
    }

    await user.save();

    // Update Auth0 user metadata
    try {
      await auth0Management.users.update({ id: userId }, {
        app_metadata: {
          dispensaryIds: user.dispensaryIds,
          role: user.role
        }
      });
    } catch (auth0Error) {
      console.error('Error updating Auth0 user:', auth0Error);
      // Continue even if Auth0 update fails
    }

    res.json({ message: 'User removed from dispensary successfully', user });
  } catch (error) {
    console.error('Error removing user from dispensary:', error);
    res.status(500).json({ message: 'Failed to remove user from dispensary' });
  }
});

// Get all user-dispensary assignments
router.get('/assignments', async (req, res) => {
  try {
    const users = await User.find({}).select('-passwordHash');
    const dispensaries = await Dispensary.find({});

    const assignments = users.flatMap(user => 
      user.dispensaryIds.map(dispensaryId => {
        const dispensary = dispensaries.find(d => d._id.toString() === dispensaryId);
        return {
          userId: user.auth0Id,
          userName: user.name,
          userEmail: user.email,
          dispensaryId: dispensaryId,
          dispensaryName: dispensary ? dispensary.name : 'Unknown',
          role: user.role
        };
      })
    );

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
});

// Update user's role in dispensary
router.put('/update-role', validateJwt, requireRole([ROLES.SUPER_ADMIN]), async (req, res) => {
  try {
    const { userId, dispensaryId, role } = req.body;

    // Validate role
    if (!['hospital_admin', 'hospital_staff'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Get user from our database
    const user = await User.findOne({ auth0Id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's role
    user.role = role;
    await user.save();

    // Update Auth0 user metadata
    try {
      await auth0Management.users.update({ id: userId }, {
        app_metadata: {
          dispensaryIds: user.dispensaryIds,
          role: user.role
        }
      });
    } catch (auth0Error) {
      console.error('Error updating Auth0 user:', auth0Error);
      // Continue even if Auth0 update fails
    }

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

module.exports = router; 