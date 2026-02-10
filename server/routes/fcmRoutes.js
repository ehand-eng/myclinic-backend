const express = require('express');
const router = express.Router();
const FcmToken = require('../models/FcmToken');
const admin = require('../config/firebase');

/**
 * @route POST /api/save-fcm-token
 * @desc Save or update user's FCM token
 */
router.post('/', async (req, res) => {
  try {
    const { token, userId, platform } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    // Upsert token
    await FcmToken.findOneAndUpdate(
      { token },
      { userId, platform, lastActive: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Token saved successfully' });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ message: 'Server error saving FCM token' });
  }
});

/**
 * @route POST /api/fcm/subscribe
 * @desc Subscribe a token to a specific topic (e.g., 'queue_dispensaryId_doctorId')
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { token, topic } = req.body;
    if (!token || !topic) return res.status(400).json({ message: 'Token and Topic required' });

    await admin.messaging().subscribeToTopic(token, topic);
    console.log(`Subscribed ${token} to ${topic}`);
    res.status(200).json({ message: `Subscribed to ${topic}` });
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    res.status(500).json({ message: 'Failed to subscribe' });
  }
});

/**
 * @route POST /api/fcm/unsubscribe
 * @desc Unsubscribe a token from a topic
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { token, topic } = req.body;
    if (!token || !topic) return res.status(400).json({ message: 'Token and Topic required' });

    await admin.messaging().unsubscribeFromTopic(token, topic);
    res.status(200).json({ message: `Unsubscribed from ${topic}` });
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    res.status(500).json({ message: 'Failed to unsubscribe' });
  }
});

module.exports = router;
