const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const OTPService = require('../services/OTPService');

const router = express.Router();

// JWT Secret (should be in env vars)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Send OTP for signup
router.post('/send-otp', async (req, res) => {
  try {
    const { nationality, mobile, email } = req.body;

    // Validate nationality
    if (!nationality || !['sri_lanka', 'other'].includes(nationality)) {
      return res.status(400).json({
        message: 'Invalid nationality. Must be "sri_lanka" or "other"'
      });
    }

    let result;

    if (nationality === 'sri_lanka') {
      // Validate mobile number
      if (!mobile) {
        return res.status(400).json({ message: 'Mobile number is required for Sri Lankan users' });
      }

      if (!OTPService.validateSriLankanMobile(mobile)) {
        return res.status(400).json({ message: 'Invalid Sri Lankan mobile number format' });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ mobile });
      console.log("existingUser found in mobile auth routes", existingUser);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this mobile number already exists' });
      }
      console.log("sending OTP to mobile number", mobile);
      result = await OTPService.sendSMSOTP(mobile);
    } else {
      // Validate email
      if (!email) {
        return res.status(400).json({ message: 'Email is required for foreign users' });
      }

      if (!OTPService.validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      result = await OTPService.sendEmailOTP(email);
    }

    if (result.success) {
      res.json({
        message: result.message,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

// Verify OTP for signup
router.post('/verify-otp', async (req, res) => {
  try {
    const { nationality, mobile, email, otp } = req.body;

    // Validate nationality
    if (!nationality || !['sri_lanka', 'other'].includes(nationality)) {
      return res.status(400).json({
        message: 'Invalid nationality. Must be "sri_lanka" or "other"'
      });
    }

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const identifier = nationality === 'sri_lanka' ? mobile : email;
    const result = OTPService.verifyOTP(identifier, otp);

    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
});

// Signup with mobile/email
router.post('/signup-mobile', async (req, res) => {
  try {
    const { name, password, nationality, mobile, email } = req.body;

    // Validate required fields
    if (!name || !password || !nationality) {
      return res.status(400).json({
        message: 'Name, password, and nationality are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate nationality and contact method
    if (nationality === 'sri_lanka') {
      if (!mobile) {
        return res.status(400).json({ message: 'Mobile number is required for Sri Lankan users' });
      }
      if (!OTPService.validateSriLankanMobile(mobile)) {
        return res.status(400).json({ message: 'Invalid Sri Lankan mobile number format' });
      }
    } else {
      if (!email) {
        return res.status(400).json({ message: 'Email is required for foreign users' });
      }
      if (!OTPService.validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
    }

    // Check if user already exists
    const existingUser = nationality === 'sri_lanka'
      ? await User.findOne({ mobile })
      : await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: `User with this ${nationality === 'sri_lanka' ? 'mobile number' : 'email'} already exists`
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userData = {
      name,
      passwordHash,
      nationality,
      dispensaryIds: [],
      isActive: true,
      lastLogin: new Date()
    };

    if (nationality === 'sri_lanka') {
      userData.mobile = mobile;
    } else {
      userData.email = email;
    }

    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        ...(nationality === 'sri_lanka' ? { mobile: user.mobile } : { email: user.email }),
        nationality: user.nationality,
        role: 'online'
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
        ...(nationality === 'sri_lanka' ? { mobile: user.mobile } : { email: user.email }),
        nationality: user.nationality,
        role: 'online',
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

// Send OTP for login
router.post('/send-login-otp', async (req, res) => {
  try {
    const { loginType, mobile, email } = req.body;

    if (!loginType || !['mobile', 'email'].includes(loginType)) {
      return res.status(400).json({
        message: 'Invalid login type. Must be "mobile" or "email"'
      });
    }

    let result;
    let user;

    if (loginType === 'mobile') {
      if (!mobile) {
        return res.status(400).json({ message: 'Mobile number is required' });
      }

      if (!OTPService.validateSriLankanMobile(mobile)) {
        return res.status(400).json({ message: 'Invalid Sri Lankan mobile number format' });
      }

      // Check if user exists
      user = await User.findOne({ mobile });
      if (!user) {
        return res.status(404).json({ message: 'User not found with this mobile number' });
      }

      result = await OTPService.sendSMSOTP(mobile);
    } else {
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      if (!OTPService.validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      // Check if user exists
      user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found with this email' });
      }

      result = await OTPService.sendEmailOTP(email);
    }

    if (result.success) {
      res.json({
        message: result.message,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Send login OTP error:', error);
    res.status(500).json({
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

/** Login with mobile OTP
 * POST /api/auth/login-mobile
 */
router.post('/login-mobile', async (req, res) => {
  try {
    const { mobile, otp, keepSignedIn } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        message: 'Mobile number and OTP are required'
      });
    }

    if (!OTPService.validateSriLankanMobile(mobile)) {
      return res.status(400).json({ message: 'Invalid Sri Lankan mobile number format' });
    }

    // Find user
    const user = await User.findOne({ email: "akudahewa@gmail.com" });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify OTP
    const otpResult = OTPService.verifyOTP(mobile, otp);
    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.message });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const tokenExpiry = keepSignedIn ? '7d' : '24h';
    const token = jwt.sign(
      {
        userId: user._id,
        mobile: user.mobile,
        nationality: user.nationality,
        role: user.role || 'online'
      },
      JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        nationality: user.nationality,
        role: user.role || 'online',
        dispensaryIds: user.dispensaryIds
      }
    });
  } catch (error) {
    console.error('Mobile login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: error.message
    });
  }
});

// Login with email/password
router.post('/login-email', async (req, res) => {
  try {
    const { email, password, keepSignedIn } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    if (!OTPService.validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const tokenExpiry = keepSignedIn ? '7d' : '24h';
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        nationality: user.nationality,
        role: user.role || 'online'
      },
      JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        nationality: user.nationality,
        role: user.role || 'online',
        dispensaryIds: user.dispensaryIds
      }
    });
  } catch (error) {
    console.error('Email login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: error.message
    });
  }
});

module.exports = router;
