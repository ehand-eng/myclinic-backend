const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
    /**
     * Create payment intent for booking
     * @param {string} bookingId - Booking ID
     * @param {number} amount - Amount in LKR
     * @param {string} currency - Currency code (default: LKR)
     * @returns {Promise<Object>} Payment intent details
     */
    async createPaymentIntent(bookingId, amount, currency = 'LKR') {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency.toLowerCase(),
                metadata: {
                    bookingId: bookingId,
                },
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            return {
                success: true,
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
            };
        } catch (error) {
            console.error('Payment intent creation failed:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Verify webhook signature from Stripe
     * @param {Buffer} payload - Raw request body
     * @param {string} signature - Stripe signature header
     * @returns {Object} Verification result
     */
    verifyWebhookSignature(payload, signature) {
        try {
            const event = stripe.webhooks.constructEvent(
                payload,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
            return { success: true, event };
        } catch (error) {
            console.error('Webhook signature verification failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create refund for a payment
     * @param {string} paymentIntentId - Payment intent ID
     * @param {number} amount - Amount to refund (optional, full refund if not specified)
     * @returns {Promise<Object>} Refund details
     */
    async createRefund(paymentIntentId, amount = null) {
        try {
            const refundData = {
                payment_intent: paymentIntentId,
            };

            if (amount) {
                refundData.amount = Math.round(amount * 100);
            }

            const refund = await stripe.refunds.create(refundData);

            return {
                success: true,
                refundId: refund.id,
                status: refund.status,
            };
        } catch (error) {
            console.error('Refund creation failed:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

module.exports = new PaymentService();
