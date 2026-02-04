const express = require('express');
const router = express.Router();
const dialogGenieService = require('../services/dialogGenieService');
const smsService = require('../services/smsService');
const Booking = require('../models/Booking');

// =============================================================================
// DIALOG GENIE PAYMENT GATEWAY ROUTES
// =============================================================================

/**
 * Create Dialog Genie payment intent
 * POST /api/payments/dialog-genie/create-intent/:bookingId
 */
router.post('/dialog-genie/create-intent/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { customer } = req.body;

        console.log('Creating Dialog Genie payment intent for booking:', bookingId);

        // Find booking with populated fields
        const booking = await Booking.findById(bookingId)
            .populate('doctorId', 'name')
            .populate('dispensaryId', 'name address');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Validate booking has fees
        if (!booking.fees || !booking.fees.totalFee) {
            return res.status(400).json({
                message: 'Booking does not have fee information',
                details: 'totalFee is required for payment'
            });
        }

        // Validate booking is pending payment
        if (booking.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Booking is already paid' });
        }

        // Create payment intent with Dialog Genie
        const result = await dialogGenieService.createPaymentIntent(booking, customer);

        // Update booking with payment intent ID
        booking.paymentIntentId = result.paymentIntentId;
        booking.paymentStatus = 'processing';
        booking.paymentGateway = 'dialog_genie';
        await booking.save();

        res.json({
            success: true,
            paymentIntentId: result.paymentIntentId,
            paymentUrl: result.paymentUrl,
            amount: result.amount,
        });
    } catch (error) {
        console.error('Dialog Genie create intent error:', error);
        res.status(500).json({
            message: 'Failed to create payment intent',
            error: error.message,
        });
    }
});

/**
 * Dialog Genie redirect handler
 * GET /api/payments/dialog-genie/redirect
 * Called by Dialog Genie after payment completion/failure
 */
router.get('/dialog-genie/redirect', async (req, res) => {
    try {
        console.log('Dialog Genie redirect received:', req.query);

        // Parse redirect parameters
        const { paymentId, status, bookingId: localId } = dialogGenieService.parseRedirectParams(req.query);

        // Find booking by localId or payment intent ID with populated fields for SMS
        let booking = null;
        if (localId) {
            booking = await Booking.findById(localId)
                .populate('doctorId', 'name')
                .populate('dispensaryId', 'name address');
        }
        if (!booking && paymentId) {
            booking = await Booking.findOne({ paymentIntentId: paymentId })
                .populate('doctorId', 'name')
                .populate('dispensaryId', 'name address');
        }

        const redirectUrls = dialogGenieService.getRedirectUrls(booking?._id || 'unknown');

        if (!booking) {
            console.error('Booking not found for redirect:', { paymentId, localId });
            return res.redirect(`${redirectUrls.failedUrl}?error=booking_not_found`);
        }

        // Process payment result
        if (status === 'SUCCESS') {
            booking.paymentStatus = 'paid';
            booking.isPaid = true;
            booking.paidAt = new Date();
            if (paymentId) {
                booking.paymentIntentId = paymentId;
            }
            await booking.save();

            console.log(`Payment successful for booking ${booking._id}`);

            // Send SMS confirmation after successful payment
            try {
                smsService.sendBookingConfirmationSMS(booking).then(smsResult => {
                    console.log('SMS sent after payment success:', smsResult);
                }).catch(smsError => {
                    console.error('Failed to send SMS after payment:', smsError);
                });
            } catch (smsError) {
                console.error('Error initiating SMS after payment:', smsError);
                // Don't block the redirect if SMS fails
            }

            return res.redirect(redirectUrls.successUrl);
        } else {
            booking.paymentStatus = 'failed';
            await booking.save();

            console.log(`Payment failed for booking ${booking._id}`);
            return res.redirect(`${redirectUrls.failedUrl}?error=payment_failed`);
        }
    } catch (error) {
        console.error('Dialog Genie redirect error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        return res.redirect(`${frontendUrl}/booking/payment-failed/error?error=${encodeURIComponent(error.message)}`);
    }
});

/**
 * Dialog Genie callback (webhook)
 * POST /api/payments/dialog-genie/callback
 * Called by Dialog Genie for payment status updates
 */
router.post('/dialog-genie/callback', async (req, res) => {
    try {
        console.log('Dialog Genie callback received:', req.body);

        const { paymentId, status, localId } = req.body;

        // Find booking with populated fields for SMS
        let booking = null;
        if (localId) {
            booking = await Booking.findById(localId)
                .populate('doctorId', 'name')
                .populate('dispensaryId', 'name address');
        }
        if (!booking && paymentId) {
            booking = await Booking.findOne({ paymentIntentId: paymentId })
                .populate('doctorId', 'name')
                .populate('dispensaryId', 'name address');
        }

        if (!booking) {
            console.error('Booking not found for callback:', { paymentId, localId });
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Idempotency check - don't reprocess completed payments
        if (booking.paymentStatus === 'paid') {
            return res.json({ success: true, message: 'Already processed' });
        }

        // Process payment result
        if (status === 'SUCCESS') {
            booking.paymentStatus = 'paid';
            booking.isPaid = true;
            booking.paidAt = new Date();
            await booking.save();

            console.log(`Callback: Payment successful for booking ${booking._id}`);

            // Send SMS confirmation (non-blocking)
            try {
                smsService.sendBookingConfirmationSMS(booking).then(smsResult => {
                    console.log('SMS sent after callback payment success:', smsResult);
                }).catch(smsError => {
                    console.error('Failed to send SMS after callback:', smsError);
                });
            } catch (smsError) {
                console.error('Error initiating SMS after callback:', smsError);
            }
        } else {
            booking.paymentStatus = 'failed';
            await booking.save();

            console.log(`Callback: Payment failed for booking ${booking._id}`);
        }

        res.json({ success: true, bookingId: booking._id });
    } catch (error) {
        console.error('Dialog Genie callback error:', error);
        res.status(500).json({ message: 'Callback processing failed', error: error.message });
    }
});

/**
 * Check payment status
 * GET /api/payments/dialog-genie/check-status/:bookingId
 */
router.get('/dialog-genie/check-status/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // If there's a payment intent, verify with Dialog Genie
        if (booking.paymentIntentId && booking.paymentStatus === 'processing') {
            try {
                const statusResult = await dialogGenieService.checkTransactionStatus(booking.paymentIntentId);

                if (statusResult.isSuccess && booking.paymentStatus !== 'paid') {
                    booking.paymentStatus = 'paid';
                    booking.isPaid = true;
                    booking.paidAt = new Date();
                    await booking.save();
                }
            } catch (checkError) {
                console.error('Error checking transaction status:', checkError.message);
                // Continue with current booking status
            }
        }

        res.json({
            bookingId: booking._id,
            paymentStatus: booking.paymentStatus,
            paymentMethod: booking.paymentMethod,
            isPaid: booking.isPaid,
            paidAt: booking.paidAt,
        });
    } catch (error) {
        console.error('Check payment status error:', error);
        res.status(500).json({ message: 'Error checking payment status', error: error.message });
    }
});

module.exports = router;
