const axios = require('axios');
const Booking = require('../models/Booking');

class DialogGenieService {
    constructor() {
        this.apiUrl = process.env.DIALOG_GENIE_API_URL;
        this.apiKey = process.env.DIALOG_GENIE_API_KEY;
        this.backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
        this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

        if (!this.apiKey) {
            console.warn('DIALOG_GENIE_API_KEY is missing. Payment integration will not work.');
        }
        if (!this.apiUrl) {
            console.warn('DIALOG_GENIE_API_URL is missing. Using fallback may fail.');
        }
    }

    /**
     * Create Payment Intent matching the reference implementation
     */
    async createPaymentIntent(bookingId) {
        try {
            console.log(`🔄 createPaymentIntent called for booking ${bookingId}`);

            const booking = await Booking.findById(bookingId);
            if (!booking) {
                throw new Error('Booking not found');
            }

            // Calculate amount
            // Converting to cents (LKR)
            // Reference used dummy amount: 1.00 LKR = 100 cents.
            // We will use the actual booking fee.
            let amountInCents = Math.round((booking.fees?.totalFee || 0) * 100);

            // Safety check: if amount is 0, usage might fail. 
            if (amountInCents <= 0) {
                console.warn('Booking amount is 0, fetching proper fees or defaulting to 100 cents for testing?');
                // Fallback to 100 cents if amount is missing? Or error?
                // For now, let's assume valid amount.
                if (process.env.NODE_ENV === 'development') {
                    amountInCents = 100; // Force 1 LKR for testing if 0
                } else {
                    throw new Error('Invalid booking amount');
                }
            }

            const reservationId = booking._id.toString();

            const payload = {
                amount: amountInCents,
                localId: reservationId, // CRITICAL: This is returned in callback
                currency: 'LKR',
                redirectUrl: `https://prechloric-verdell-faster.ngrok-free.dev/api/payment/redirect`,
                customer: {
                    name: booking.patientName,
                    email: booking.patientEmail || 'customer@booking.local',
                    // Default billing info if needed
                    billingEmail: booking.patientEmail || 'customer@booking.local',
                    billingAddress1: 'Not provided',
                    billingCity: 'Colombo',
                    billingCountry: 'Sri Lanka',
                    billingPostCode: '00000'
                }
            };

            console.log('📤 Dialog Genie payload prepared:', { ...payload, customer: '...' });

            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `${this.apiKey.trim()}`
            };

            console.log('Sending request to Dialog Genie:', { url: this.apiUrl, payload });

            const response = await axios.post(this.apiUrl, payload, { headers, timeout: 30000 });
            const responseData = response.data || {};

            const paymentUrl = responseData.url || responseData.shortUrl;
            const dialogGenieTransactionId = responseData.id;

            if (!paymentUrl) {
                throw new Error('Dialog Genie API did not return a payment URL');
            }

            console.log(`✅ Dialog Genie transaction created. ID: ${dialogGenieTransactionId}`);

            // Update Booking with "Processing" state equivalent
            // We can't use "processing" status as it's not in enum. We use notes/paymentId.
            booking.paymentId = dialogGenieTransactionId;
            booking.notes = (booking.notes || '') + ' | Payment Initiated: ' + dialogGenieTransactionId;
            await booking.save();

            return paymentUrl;

        } catch (error) {
            console.error('Failed to create Dialog Genie transaction:', error.message);
            if (error.response) {
                console.error('API Error Response:', JSON.stringify(error.response.data));
            }
            throw new Error('Failed to initiate payment');
        }
    }

    /**
     * Handle Redirect (User Return)
     */
    async handleRedirect(query, res) {
        try {
            console.log(`🔄 Dialog Genie Redirect Received:`, query);

            // Extract info based on reference
            const paymentId = query.id || query.transactionId || query.paymentId || query.transactionReference;
            const status = query.status ||
                (query.success === 'true' || query.success === true ? 'SUCCESS' :
                    (query.success === 'false' || query.success === false ? 'FAILED' : 'SUCCESS'));
            const localId = query.localId || query.reservationId;

            console.log(`Extracted: paymentId=${paymentId}, status=${status}, localId=${localId}`);

            if (!localId) {
                return res.redirect(`${this.frontendUrl}/payment/failed?reason=booking_not_found`);
            }

            // Find Booking
            const booking = await Booking.findById(localId);
            if (!booking) {
                return res.redirect(`${this.frontendUrl}/payment/failed?reason=booking_not_found`);
            }

            // Process Callback Logic (Server Side update)
            const success = await this.processPaymentStatus(booking, paymentId, status);

            if (success) {
                return res.redirect(`${this.frontendUrl}/payment/success?bookingId=${booking._id}`);
            } else {
                return res.redirect(`${this.frontendUrl}/payment/failed?reason=${status}`);
            }

        } catch (error) {
            console.error('Error handling redirect:', error);
            return res.redirect(`${this.frontendUrl}/payment/error`);
        }
    }

    /**
     * Handle Webhook
     */
    async handleCallback(body) {
        console.log(`📞 Webhook Received:`, body);
        const { status, referenceId, paymentId, localId } = body;

        // Use localId (bookingId) if available, or find by paymentIntentId (paymentId)
        let booking;
        if (localId) {
            booking = await Booking.findById(localId);
        } else if (referenceId) { // Genie sometimes sends localId as referenceId? Or strict referenceId map?
            // Actually reference impl uses localId heavily.
            // Fallback to finding by paymentId stored
            booking = await Booking.findOne({ paymentId: paymentId });
        }

        if (!booking && paymentId) {
            booking = await Booking.findOne({ paymentId: paymentId });
        }

        if (!booking) {
            console.error('Booking not found for webhook');
            return false;
        }

        // Map status
        const mappedStatus = (status === 'SUCCESS' || status === 'COMPLETED') ? 'SUCCESS' : 'FAILED';

        await this.processPaymentStatus(booking, paymentId, mappedStatus);
        return true;
    }

    /**
     * Internal helper to update booking status
     */
    async processPaymentStatus(booking, paymentId, status) {
        if (status === 'SUCCESS') {
            if (!booking.isPaid) {
                booking.isPaid = true;
                booking.paymentId = paymentId || booking.paymentId;
                booking.notes = (booking.notes || '') + ' | Payment Successful via Genie';

                // If status was 'cancelled', revert to 'scheduled'
                if (booking.status === 'cancelled') {
                    booking.status = 'scheduled';
                }
                // If status is 'pending', set to 'scheduled' (Wait, we don't use pending)

                await booking.save();
                console.log(`✅ Booking ${booking._id} confirmed/paid.`);
            }
            return true;
        } else {
            // Failed
            const failNote = ' | Payment Failed: ' + status;
            if (!booking.notes?.includes(failNote)) {
                booking.notes = (booking.notes || '') + failNote;
                await booking.save();
            }
            return false;
        }
    }
}

module.exports = new DialogGenieService();
