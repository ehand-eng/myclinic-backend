const express = require('express');
const router = express.Router();
const dialogGenieService = require('../services/DialogGenieService');

// Initiate Payment
router.post('/initiate', async (req, res) => {
    try {
        const { bookingId } = req.body;
        if (!bookingId) {
            return res.status(400).json({ error: 'Booking ID is required' });
        }
        const redirectUrl = await dialogGenieService.createPaymentIntent(bookingId);
        res.json({ redirectUrl });
    } catch (error) {
        console.error('Payment initiation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generic Redirect Handler (User return)
// GET /api/payment/redirect
router.get('/redirect', async (req, res) => {
    await dialogGenieService.handleRedirect(req.query, res);
});

// Webhook Callback
// POST /api/payment/callback
router.post('/callback', async (req, res) => {
    try {
        await dialogGenieService.handleCallback(req.body);
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error processing callback');
    }
});

module.exports = router;
