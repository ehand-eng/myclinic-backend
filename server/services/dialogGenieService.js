const axios = require('axios');

/**
 * Dialog Genie Payment Gateway Service
 * Handles integration with Dialog Genie payment API
 */
class DialogGenieService {
    constructor() {
        this.apiUrl = process.env.DIALOG_GENIE_API_URL;
        this.apiKey = process.env.DIALOG_GENIE_API_KEY;
        this.paymentUrl = process.env.DIALOG_GENIE_PAYMENT_URL;
        this.backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
        this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    }

    /**
     * Create a payment intent with Dialog Genie
     * @param {Object} booking - Booking document
     * @param {Object} customerInfo - Customer information
     * @returns {Object} Payment intent details with redirect URL
     */
    async createPaymentIntent(booking, customerInfo = {}) {
        if (!this.apiUrl || !this.apiKey) {
            throw new Error('Dialog Genie API configuration is missing');
        }

        // Amount should be in cents (multiply by 100)
        const amountInCents = Math.round(booking.fees.totalFee * 100);
        console.log('Dialog Genie API configuration:', {
            apiUrl: this.apiUrl,
            apiKey: this.apiKey,
            paymentUrl: this.paymentUrl,
            backendUrl: this.backendUrl,
            frontendUrl: this.frontendUrl,
        });
        const payload = {
            amount: amountInCents,
            localId: booking._id.toString(), // Booking ID - returned in callback
            currency: 'LKR',
            redirectUrl: `${this.backendUrl}/api/payments/dialog-genie/redirect`,
            customer: {
                name: customerInfo.name || booking.patientName || 'Customer',
                email: customerInfo.email || booking.patientEmail || 'customer@example.com',
                billingEmail: customerInfo.email || booking.patientEmail || 'customer@example.com',
                billingAddress1: customerInfo.address || '',
                billingCity: customerInfo.city || 'Colombo',
                billingCountry: 'Sri Lanka',
                billingPostCode: customerInfo.postCode || '00100',
            },
        };

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': this.apiKey.trim(), // No 'Bearer' prefix for Dialog Genie
        };

        console.log('Creating Dialog Genie payment intent:', {
            bookingId: booking._id,
            amount: booking.fees.totalFee,
            amountInCents,
        });

        try {
            console.log('Dialog Genie API request:', {
                bookingId: booking._id,
                amount: booking.fees.totalFee,
                amountInCents,
            });
            console.log(this.apiUrl);
            console.log(this.apiKey);
            const response = await axios.post(this.apiUrl, payload, {
                headers,
                timeout: 30000,
            });

            const paymentUrl = response.data.url || response.data.shortUrl;
            const transactionId = response.data.id;

            if (!paymentUrl) {
                console.error('Dialog Genie response:', response.data);
                throw new Error('Payment URL not received from Dialog Genie');
            }

            console.log('Dialog Genie payment intent created:', {
                transactionId,
                paymentUrl,
            });

            return {
                success: true,
                paymentIntentId: transactionId,
                paymentUrl,
                amount: booking.fees.totalFee,
            };
        } catch (error) {
            console.error('Dialog Genie API error:', error.response?.data || error.message);

            if (error.response) {
                const { status, data } = error.response;
                const errorMessage = data?.message || data?.error || error.message;

                switch (status) {
                    case 400:
                        throw new Error(`Invalid request: ${errorMessage}`);
                    case 401:
                        throw new Error('Invalid Dialog Genie API key');
                    case 403:
                        throw new Error('API key lacks required permissions');
                    default:
                        throw new Error(`Payment error: ${errorMessage}`);
                }
            }
            throw new Error(`Failed to create payment: ${error.message}`);
        }
    }

    /**
     * Handle redirect from Dialog Genie after payment
     * @param {Object} query - Query parameters from redirect
     * @returns {Object} Payment result
     */
    parseRedirectParams(query) {
        // Dialog Genie may send different parameter names
        const paymentId = query.id || query.transactionId || query.paymentId || query.transactionReference;

        // Status variations
        let status = query.status;
        if (!status) {
            if (query.success === 'true' || query.success === true) {
                status = 'SUCCESS';
            } else if (query.success === 'false' || query.success === false) {
                status = 'FAILED';
            } else {
                status = 'SUCCESS'; // Default assumption if not specified
            }
        }

        // Your reference ID (booking ID)
        const localId = query.localId || query.reservationId;

        return {
            paymentId,
            status: status.toUpperCase(),
            bookingId: localId,
        };
    }

    /**
     * Verify transaction status with Dialog Genie API
     * @param {string} paymentId - Dialog Genie transaction ID
     * @returns {Object} Transaction status
     */
    async checkTransactionStatus(paymentId) {
        if (!paymentId) {
            throw new Error('Payment ID is required');
        }

        const statusUrl = `${this.apiUrl}/${paymentId}`;

        try {
            const response = await axios.get(statusUrl, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey.trim()}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });

            const status = response.data?.status || response.data?.transactionStatus;

            return {
                paymentId,
                status,
                isSuccess: status === 'SUCCESS' || status === 'COMPLETED',
                rawResponse: response.data,
            };
        } catch (error) {
            console.error('Error checking transaction status:', error.message);
            throw new Error(`Failed to check transaction status: ${error.message}`);
        }
    }

    /**
     * Get frontend redirect URLs
     */
    getRedirectUrls(bookingId) {
        return {
            successUrl: `${this.frontendUrl}/booking/payment-success/${bookingId}`,
            failedUrl: `${this.frontendUrl}/booking/payment-failed/${bookingId}`,
        };
    }
}

module.exports = new DialogGenieService();
