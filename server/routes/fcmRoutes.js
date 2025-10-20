const express = require('express');
const router = express.Router();
const FcmToken = require('../models/FcmToken');

/**
 * @route POST /api/save-fcm-token
 * @desc Save or update user's FCM token
 * @access Public (you can secure later)
 */
router.post('/', async (req, res) => {
  try {
    const { token, userId, platform } = req.body;
    console.log("token", token);
    console.log("userId", userId);
    console.log("platform", platform);

    if (!token) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    // If token exists, just update timestamp or user info
    let existing = await FcmToken.findOne({ token });
    console.log("existing token found :", existing);
    if (existing) {
      existing.userId = userId || existing.userId;
      existing.platform = platform || existing.platform;
      await existing.save();
      return res.status(200).json({ message: 'Token updated successfully' });
    }

    // Otherwise, create a new one
    const newToken = new FcmToken({ token, userId, platform });
    console.log("newToken generated :", newToken);
    await newToken.save();
    console.log("newToken saved successfully");
    res.status(201).json({ message: 'Token saved successfully' });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ message: 'Server error saving FCM token' });
  }
});

module.exports = router;
