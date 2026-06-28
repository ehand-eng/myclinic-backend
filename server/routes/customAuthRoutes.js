const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

const router = express.Router();

// JWT Secret (should be in env vars)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Password strength helper
// Rule: at least 8 chars and at least 3 of 4 categories:
// - lowercase letters
// - uppercase letters
// - digits
// - special characters
const isStrongPassword = (password) => {
  if (typeof password !== 'string') return false;
  if (password.length < 8) return false;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const categories = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
  return categories >= 3;
};

const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters and include at least three of the following: lowercase letters, uppercase letters, numbers, and special characters.';

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, mobile, password, role, dispensaryIds = [], nationality } = req.body;

    // Validation
    if (!name || !email || !password || !mobile) {
      return res.status(400).json({ message: 'Name, email, phone number, and password are required' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: PASSWORD_RULE_MESSAGE });
    }

    // Check if user already exists by email or mobile
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }

    // Handle role assignment - if no role provided, user is an online user
    let roleDoc = null;
    let userRole = 'online';

    if (role) {
      roleDoc = await Role.findOne({ name: role });
      if (!roleDoc) {
        return res.status(400).json({ message: 'Invalid role specified' });
      }
      userRole = role;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name,
      email,
      mobile,
      passwordHash,
      nationality: nationality || 'other',
      role: roleDoc ? roleDoc._id : null, // null for online users
      dispensaryIds: dispensaryIds,
      isActive: true,
      lastLogin: new Date()
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: userRole
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        nationality: user.nationality,
        role: userRole,
        dispensaryIds: user.dispensaryIds
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Failed to create user account',
      error: error.message
    });
  }
});

// Roles that use the admin portal; everyone else is "regular"
const ADMIN_ROLES = ['super-admin', 'dispensary-admin', 'dispensary-staff', 'doctor', 'channel-partner'];
const isAdminRole = (roleName) => roleName && ADMIN_ROLES.includes(roleName.toLowerCase().replace(/_/g, '-'));

const normalizeSriLankanMobile = (mobile) => {
  const cleaned = String(mobile || '').replace(/\D/g, '');

  if (cleaned.startsWith('94') && cleaned.length === 11) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+94${cleaned.substring(1)}`;
  }

  if (cleaned.length === 9) {
    return `+94${cleaned}`;
  }

  return String(mobile || '').trim();
};

const buildSriLankanMobileCandidates = (mobile) => {
  const raw = String(mobile || '').trim();
  const cleaned = raw.replace(/\D/g, '');
  const candidates = new Set();

  if (raw) candidates.add(raw);
  if (cleaned) candidates.add(cleaned);

  if (cleaned.startsWith('94') && cleaned.length === 11) {
    const local = cleaned.substring(2);
    candidates.add(`+${cleaned}`);
    candidates.add(local);
    candidates.add(`0${local}`);
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    const local = cleaned.substring(1);
    candidates.add(local);
    candidates.add(`94${local}`);
    candidates.add(`+94${local}`);
  } else if (cleaned.length === 9) {
    candidates.add(`0${cleaned}`);
    candidates.add(`94${cleaned}`);
    candidates.add(`+94${cleaned}`);
  }

  return Array.from(candidates);
};

// Send OTP for forgot-password flow (regular users only)
router.post('/forgot-password/send-otp', async (req, res) => {
  try {
    const { mobile, email } = req.body;

    if ((!mobile || typeof mobile !== 'string') && (!email || typeof email !== 'string')) {
      return res.status(400).json({ message: 'Mobile number or email is required' });
    }

    const OTPService = require('../services/OTPService');

    if (mobile && typeof mobile === 'string') {
      if (!OTPService.validateSriLankanMobile(mobile)) {
        return res.status(400).json({ message: 'Invalid Sri Lankan mobile number format' });
      }

      const mobileCandidates = buildSriLankanMobileCandidates(mobile);
      const user = await User.findOne({ mobile: { $in: mobileCandidates } }).populate('role');

      if (!user) {
        return res.status(404).json({ message: 'User not found with this mobile number' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is inactive' });
      }

      const roleName = user.role ? user.role.name : 'online';
      if (isAdminRole(roleName)) {
        return res.status(403).json({
          code: 'USE_ADMIN_PORTAL',
          message: 'Use the admin portal to reset the password for this account.'
        });
      }

      const normalizedMobile = normalizeSriLankanMobile(user.mobile || mobile);
      const result = await OTPService.sendSMSOTP(normalizedMobile);
      if (!result.success) {
        return res.status(500).json({ message: result.message || 'Failed to send OTP', error: result.error });
      }

      return res.json({
        message: 'OTP sent successfully',
        messageId: result.messageId
      });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).populate('role');
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    const roleName = user.role ? user.role.name : 'online';
    if (isAdminRole(roleName)) {
      return res.status(403).json({
        code: 'USE_ADMIN_PORTAL',
        message: 'Use the admin portal to reset the password for this account.'
      });
    }

    if (!OTPService.validateEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const result = await OTPService.sendEmailOTP(normalizedEmail);
    if (!result.success) {
      return res.status(500).json({ message: result.message || 'Failed to send OTP', error: result.error });
    }

    res.json({
      message: 'OTP sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Forgot password send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
});

// Reset password using OTP (regular users only)
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { mobile, email, otp, newPassword } = req.body;

    if ((!mobile && !email) || !otp || !newPassword) {
      return res.status(400).json({ message: 'Mobile number or email, OTP, and new password are required' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ message: PASSWORD_RULE_MESSAGE });
    }

    const OTPService = require('../services/OTPService');
    let user;
    let otpIdentifier;

    if (mobile && typeof mobile === 'string') {
      if (!OTPService.validateSriLankanMobile(mobile)) {
        return res.status(400).json({ message: 'Invalid Sri Lankan mobile number format' });
      }

      const mobileCandidates = buildSriLankanMobileCandidates(mobile);
      user = await User.findOne({ mobile: { $in: mobileCandidates } }).populate('role');
      otpIdentifier = normalizeSriLankanMobile(user?.mobile || mobile);
    } else {
      const normalizedEmail = email.trim().toLowerCase();

      if (!OTPService.validateEmail(normalizedEmail)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      user = await User.findOne({ email: normalizedEmail }).populate('role');
      otpIdentifier = normalizedEmail;
    }

    if (!user) {
      return res.status(404).json({ message: mobile ? 'User not found with this mobile number' : 'User not found with this email' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    const roleName = user.role ? user.role.name : 'online';
    if (isAdminRole(roleName)) {
      return res.status(403).json({
        code: 'USE_ADMIN_PORTAL',
        message: 'Use the admin portal to reset the password for this account.'
      });
    }

    const otpResult = OTPService.verifyOTP(otpIdentifier, String(otp).trim());
    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.message });
    }

    const isSamePassword = user.passwordHash ? await bcrypt.compare(newPassword, user.passwordHash) : false;
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from the current password' });
    }

    const saltRounds = 10;
    user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    user.mustChangePassword = false;
    user.lastLogin = new Date();
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Forgot password reset error:', error);
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
});

// Login endpoint - for REGULAR users only (rejects admin credentials)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).populate('role');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const roleName = user.role ? user.role.name : 'online';
    console.log('Role name:', roleName);
    if (isAdminRole(roleName)) {
      return res.status(403).json({
        code: 'USE_ADMIN_PORTAL',
        message: 'Use the admin portal to sign in with this account.'
      });
    }

    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: roleName,
        permissions: user.role ? user.role.permissions : []
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        nationality: user.nationality,
        role: roleName,
        dispensaryIds: user.dispensaryIds,
        permissions: user.role ? user.role.permissions : [],
        mustChangePassword: !!user.mustChangePassword
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
});

// Admin login endpoint - for ADMIN users only (rejects regular user credentials)
router.post('/login-admin', async (req, res) => {
  try {
    console.log('Admin login attempt:', req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).populate('role');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const roleName = user.role ? user.role.name : 'online';
    if (!isAdminRole(roleName)) {
      return res.status(403).json({
        code: 'USE_REGULAR_LOGIN',
        message: 'Use the regular login to sign in with this account.'
      });
    }

    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: roleName,
        permissions: user.role ? user.role.permissions : []
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: roleName,
        dispensaryIds: user.dispensaryIds,
        permissions: user.role ? user.role.permissions : [],
        mustChangePassword: !!user.mustChangePassword
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('role');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      nationality: user.nationality,
      role: user.role ? user.role.name : 'online',
      dispensaryIds: user.dispensaryIds,
      permissions: user.role ? user.role.permissions : [],
      lastLogin: user.lastLogin,
      mustChangePassword: !!user.mustChangePassword
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update current user basic profile (e.g. name)
router.put('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('role');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Name is required' });
    }

    user.name = name.trim();
    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      nationality: user.nationality,
      role: user.role ? user.role.name : 'online',
      dispensaryIds: user.dispensaryIds,
      permissions: user.role ? user.role.permissions : [],
      lastLogin: user.lastLogin
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    console.error('Update user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password for current user
router.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from the current password' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ message: PASSWORD_RULE_MESSAGE });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ message: 'Password change is not available for this account' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const saltRounds = 10;
    user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    user.mustChangePassword = false;
    await user.save();

    res.json({
      message: 'Password updated successfully',
      mustChangePassword: false
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;