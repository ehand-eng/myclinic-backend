const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const Booking = require('../models/Booking');

/**
 * Create payment intent
 * POST /api/payments/create-intent
 */
router.post('/create-intent', async (req, res) => {
    try {
        const { bookingId, amount, currency } = req.body;

        // Validate booking exists
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Validate amount matches booking
        if (amount !== booking.fees.totalFee) {
            return res.status(400).json({ message: 'Amount mismatch' });
        }

        // Create payment intent
        const result = await paymentService.createPaymentIntent(
            bookingId,
            amount,
            currency || 'LKR'
        );

        if (result.success) {
            res.json({
                clientSecret: result.clientSecret,
                paymentIntentId: result.paymentIntentId,
            });
        } else {
            res.status(500).json({
                message: 'Failed to create payment intent',
                error: result.error,
            });
        }
    } catch (error) {
        console.error('Payment intent error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message,
        });
    }
});

/**
 * Stripe webhook handler
 * POST /api/payments/webhook/stripe
 */
router.post(
    '/webhook/stripe',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        const signature = req.headers['stripe-signature'];

        // Verify webhook signature
        const verification = paymentService.verifyWebhookSignature(
            req.body,
            signature
        );

        if (!verification.success) {
            console.error('Webhook verification failed:', verification.error);
            return res.status(400).send(`Webhook Error: ${verification.error}`);
        }

        const event = verification.event;

        try {
            // Handle different event types
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await handlePaymentSuccess(event.data.object);
                    break;

                case 'payment_intent.payment_failed':
                    await handlePaymentFailure(event.data.object);
                    break;

                case 'charge.refunded':
                    await handleRefund(event.data.object);
                    break;

                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }

            res.json({ received: true });
        } catch (error) {
            console.error('Webhook processing error:', error);
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    }
);

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent) {
    const bookingId = paymentIntent.metadata.bookingId;

    console.log(`Payment succeeded for booking ${bookingId}`);

    // Update booking
    await Booking.findByIdAndUpdate(bookingId, {
        isPaid: true,
        'payment.status': 'completed',
        'payment.method': 'card',
        'payment.transactionId': paymentIntent.id,
        'payment.paidAt': new Date(),
        'payment.gateway': 'stripe',
    });

    // TODO: Send payment confirmation SMS/email
    console.log(`Booking ${bookingId} marked as paid`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntent) {
    const bookingId = paymentIntent.metadata.bookingId;

    console.log(`Payment failed for booking ${bookingId}`);

    // Update booking
    await Booking.findByIdAndUpdate(bookingId, {
        'payment.status': 'failed',
    });

    // TODO: Send payment failure notification
}

/**
 * Handle refund
 */
async function handleRefund(charge) {
    const paymentIntentId = charge.payment_intent;

    console.log(`Refund processed for payment intent ${paymentIntentId}`);

    // Find booking by payment transaction ID
    const booking = await Booking.findOne({
        'payment.transactionId': paymentIntentId,
    });

    if (booking) {
        await Booking.findByIdAndUpdate(booking._id, {
            isPaid: false,
            'payment.status': 'refunded',
            'payment.refundedAt': new Date(),
        });

        console.log(`Booking ${booking._id} marked as refunded`);
    }
}

/**
 * Create refund
 * POST /api/payments/refund
 */
router.post('/refund', async (req, res) => {
    try {
        const { bookingId, amount } = req.body;

        // Get booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (!booking.payment?.transactionId) {
            return res.status(400).json({ message: 'No payment found for this booking' });
        }

        // Create refund
        const result = await paymentService.createRefund(
            booking.payment.transactionId,
            amount
        );

        if (result.success) {
            res.json({
                message: 'Refund created successfully',
                refundId: result.refundId,
                status: result.status,
            });
        } else {
            res.status(500).json({
                message: 'Failed to create refund',
                error: result.error,
            });
        }
    } catch (error) {
        console.error('Refund error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message,
        });
    }
});

module.exports = router;
