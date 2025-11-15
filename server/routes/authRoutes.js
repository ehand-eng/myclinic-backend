const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { auth } = require('express-oauth2-jwt-bearer');
const { validateJwt, requireRole, ROLES } = require('../middleware/authMiddleware');
const { ManagementClient } = require('auth0');
const axios = require('axios');

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
  console.log('Auth0 Management API client initialized');
} catch (error) {
  console.error('Failed to initialize Auth0 Management API client:', error);
}

// Public routes
router.get('/config', (req, res) => {
  // Add additional logging for debugging
  console.log('Auth config request received');
  console.log('Auth0 config values:', {
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    audience: process.env.AUTH0_AUDIENCE,
    redirectUri: process.env.AUTH0_CALLBACK_URL,
  });

  res.json({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    audience: process.env.AUTH0_AUDIENCE,
    redirectUri: process.env.AUTH0_CALLBACK_URL
  });
});

// Authenticate via Auth0
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt for username:", username);
    const tokenResponse = await axios.post(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      grant_type: 'password',
      username: username,
      password: password,
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: process.env.AUTH0_AUDIENCE,
      scope: 'openid profile email'
    });

    if (!tokenResponse.data || !tokenResponse.data.access_token) {
      console.error('Token exchange failed:', tokenResponse.data);
      return res.status(400).json({ message: 'Failed to exchange credentials for token' });
    }
    console.log('Token received successfully :'+JSON.stringify(tokenResponse.data));
    const userInfoResponse = await axios.get(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
      headers: { 
        Authorization: `Bearer ${tokenResponse.data.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    const auth0User = userInfoResponse.data;
    console.log('User info retrieved:', {
      sub: auth0User.sub,
      email: auth0User.email,
      name: auth0User.name || auth0User.nickname
    });
    const roleResponse = await auth0Management.users.getRoles({ id: auth0User.sub });
    let roleNames = [];
    if (roleResponse && roleResponse.data && Array.isArray(roleResponse.data)) {
      roleNames = roleResponse.data.map(role => role.name);
    }
    console.log('Logged user has role :', JSON.stringify(roleResponse, null, 2));
    let userRole = '';
    if (roleNames.includes('super_admin')) {
      userRole = 'super_admin';
    } else if (roleNames.includes('hospital_admin')) {
      userRole = 'hospital_admin';
    } else if (roleNames.includes('cpadmin')) {
      userRole = 'super_admin'; 
    }

    console.log("user role is "+userRole);
    let roleIds = [];
    if (roleResponse && roleResponse.data && Array.isArray(roleResponse.data)) {
      roleIds = roleResponse.data.map(role => role.id);
    }

    let rolePermissions = [];
    for (const roleId of roleIds) {
      const permResponse = await auth0Management.roles.getPermissions({ id: roleId });
      if (permResponse && permResponse.data && Array.isArray(permResponse.data)) {
        rolePermissions.push(...permResponse.data.map(perm => perm.permission_name));
      }
    }
    console.log("permissions --->"+rolePermissions);
    rolePermissions = [...new Set(rolePermissions)];

    console.log("final role permissions :::: "+rolePermissions);


    let user = await User.findOne({ auth0Id: auth0User.sub });
    res.json({
      access_token: tokenResponse.data.access_token,
      user: {
        id: user._id,
        auth0Id: user.auth0Id,
        name: user.name,
        email: user.email,
        role: userRole,
        dispensaryIds: user.dispensaryIds,
        permissions: rolePermissions
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      message: 'Authentication failed', 
      error: error.message
    });
  }
});

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    // Create user in our database
    const user = new User({
      name,
      email,
      dispensaryIds: [],
      isActive: true,
      lastLogin: new Date()
    });
    console.log(">>>>>>. user save >>>>>> "+JSON.stringify(user));
    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dispensaryIds: user.dispensaryIds
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      message: 'Failed to create user account',
      error: error.message 
    });
  }
});

// Protected routes
// Get current user profile 
router.get('/me', validateJwt, async (req, res) => {
  try {
    // In development mode, handle mock authentication
    if (process.env.NODE_ENV === 'development' && req.auth.payload.sub === 'dev-user') {
      console.log('Development mode: Using mock user data');
      return res.status(200).json({
        id: 'dev-user-id',
        name: 'Development User',
        email: 'dev@example.com',
        role: 'super_admin',
        dispensaryIds: [],
        permissions: ['read:doctors', 'read:dispensaries'],
        lastLogin: new Date()
      });
    }
    
    const auth0UserId = req.auth.payload.sub;
    console.log('Getting user profile for:', auth0UserId);
    
    // First, check if user exists in our database
    let user = await User.findOne({ auth0Id: auth0UserId });
    
    if (!user) {
      console.log('User not found in database, creating from Auth0');
      // If not in our database, fetch from Auth0 and create in our DB
      if (!auth0Management) {
        return res.status(500).json({ message: 'Auth0 Management API client not available' });
      }
      
      try {
        const auth0User = await auth0Management.users.get({ id: auth0UserId });
        
        // Fetch user roles
        const roleResponse = await auth0Management.users.getRoles({ id: auth0UserId });
        console.log('Raw role response:', JSON.stringify(roleResponse, null, 2));
        
        // Extract role names from the response
        let roleNames = [];
        if (roleResponse && roleResponse.data && Array.isArray(roleResponse.data)) {
          roleNames = roleResponse.data.map(role => role.name);
        }
        console.log('Extracted role names:', roleNames);
        
        // Determine user role
        let userRole = 'hospital_staff';
        if (roleNames.includes('super_admin')) {
          userRole = 'super_admin';
        } else if (roleNames.includes('hospital_admin')) {
          userRole = 'hospital_admin';
        } else if (roleNames.includes('cpadmin')) {
          userRole = 'super_admin'; // Map cpadmin to super_admin role
        }
        console.log(">>>>>>>>>>>> "+userRole);
        
        const dispensaryIds = auth0User.app_metadata?.dispensaryIds || [];
        
        // Create new user in our database
        user = new User({
          name: auth0User.name || auth0User.nickname,
          email: auth0User.email,
          auth0Id: auth0UserId,
          role: userRole,
          dispensaryIds: dispensaryIds,
          isActive: true,
          lastLogin: new Date()
        });
        
        await user.save();
      } catch (error) {
        console.error('Failed to fetch user from Auth0:', error);
        return res.status(500).json({ message: 'Failed to fetch user from Auth0' });
      }
    } else {
      // Update last login time
      user.lastLogin = new Date();
      await user.save();
    }
    
    // Get user permissions from Auth0
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.decode(token);
    const permissions = decodedToken[`${process.env.AUTH0_AUDIENCE}/permissions`] || [];
    
    const roleResponse = await auth0Management.users.getRoles({ id: auth0User.sub });
    let roleNames = [];
    if (roleResponse && roleResponse.data && Array.isArray(roleResponse.data)) {
      roleNames = roleResponse.data.map(role => role.name);
    }
    console.log('Logged user has role :', JSON.stringify(roleResponse, null, 2));
    let userRole = 'hospital_staff';
    if (roleNames.includes('super_admin')) {
      userRole = 'super_admin';
    } else if (roleNames.includes('hospital_admin')) {
      userRole = 'hospital_admin';
    } else if (roleNames.includes('cpadmin')) {
      userRole = 'super_admin'; 
    }

    console.log("user role is "+userRole);
    let roleIds = [];
    if (roleResponse && roleResponse.data && Array.isArray(roleResponse.data)) {
      roleIds = roleResponse.data.map(role => role.id);
    }

    let rolePermissions = [];
    for (const roleId of roleIds) {
      const permResponse = await auth0Management.roles.getPermissions({ id: roleId });
      if (permResponse && permResponse.data && Array.isArray(permResponse.data)) {
        rolePermissions.push(...permResponse.data.map(perm => perm.permission_name));
      }
    }
    console.log("permissions --->"+rolePermissions);
    rolePermissions = [...new Set(rolePermissions)];

    console.log("final role permissions :::: "+rolePermissions);

    res.status(200).json({
      id: user._id,
      auth0Id: user.auth0Id,
      name: user.name,
      email: user.email,
      role: user.role,
      dispensaryIds: user.dispensaryIds || [],
      permissions: [...new Set([...permissions, ...rolePermissions])],
      lastLogin: user.lastLogin
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin-only routes
// Get all users (super_admin only)
router.get('/users', async (req, res) => {
  try {
    // Get all users from our database
    const users = await User.find({}).select('-passwordHash');
    
    // Get all dispensaries for mapping
    const Dispensary = require('../models/Dispensary');
    const dispensaries = await Dispensary.find({});
    const dispensaryMap = new Map(dispensaries.map(d => [d._id.toString(), d]));

    // Process each user to get their roles and dispensary assignments
    
    const processedUsers = await Promise.all(users.map(async (user) => {
      try {
        // Get user roles from Auth0
        console.log(",....... rorl ...... "+user.auth0Id);
        let roleNames = [];
        if(user.auth0Id != undefined){
          const roleResponse = await auth0Management.users.getRoles({ id: user.auth0Id });
          console.log(">>>>>>>> role response >>>>>>>> "+JSON.stringify(roleResponse));
          if (roleResponse && roleResponse.data && Array.isArray(roleResponse.data)) {
            roleNames = roleResponse.data.map(role => role.name);
          }
        }
        

        // Process dispensary assignments
        const dispensaryAssignments = user.dispensaryIds.map(dispensaryId => {
          const dispensary = dispensaryMap.get(dispensaryId.toString());
          console.log(">>>>>>.ddddd >>>> "+dispensary);
          if (!dispensary) return null;

          // Determine role for this dispensary
          let role = 'hospital_staff';
          if (roleNames.includes('super_admin')) {
            role = 'hospital_admin';
          } else if (roleNames.includes('hospital_admin')) {
            role = 'hospital_admin';
          }

          return {
            dispensaryId: dispensary._id.toString(),
            dispensaryName: dispensary.name,
            role
          };
        }).filter(Boolean); // Remove any null entries

        return {
          _id: user._id,
          auth0Id: user.auth0Id,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          dispensaryAssignments
        };
      } catch (error) {
        console.error(`Error processing user ${user._id}:`, error);
        return null;
      }
    }));

    // Filter out any null entries from failed processing
    const validUsers = processedUsers.filter(Boolean);

    res.status(200).json(validUsers);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get users by dispensary (for dispensary admins)
router.get('/users/dispensary/:dispensaryId', validateJwt, requireRole([ROLES.SUPER_ADMIN, ROLES.hospital_admin]), async (req, res) => {
  try {
    const { dispensaryId } = req.params;
    
    // For dispensary admin, check if they have access to this dispensary
    if (req.user.roles.includes(ROLES.hospital_admin)) {
      const user = await User.findOne({ auth0Id: req.user.id });
      if (!user.dispensaryIds.includes(dispensaryId)) {
        return res.status(403).json({ message: 'Access denied to this dispensary' });
      }
    }
    
    const users = await User.find({ dispensaryIds: dispensaryId }).select('-passwordHash');
    res.status(200).json(users);
  } catch (error) {
    console.error('Get dispensary users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
