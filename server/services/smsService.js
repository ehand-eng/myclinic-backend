const axios = require('axios');

// Dialog e-SMS API Configuration
const DIALOG_SMS_API_URL = process.env.DIALOG_SMS_API_URL || 'https://e-sms.dialog.lk/api/v2';
const DIALOG_SMS_USERNAME = process.env.DIALOG_SMS_USERNAME;
const DIALOG_SMS_PASSWORD = process.env.DIALOG_SMS_PASSWORD;
const DIALOG_SMS_SOURCE_ADDRESS = process.env.DIALOG_SMS_SOURCE_ADDRESS || 'eHands';

// Token cache
let cachedToken = null;
let tokenExpiry = null;

/**
 * Login to Dialog e-SMS API and get authentication token
 * @returns {Promise<string>} JWT token
 */
async function getAuthToken() {
    try {
        // Check if we have a valid cached token
        if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
            console.log('Using cached SMS API token');
            return cachedToken;
        }

        console.log('Requesting new SMS API token...');
        console.log('DIALOG_SMS_API_URL', DIALOG_SMS_API_URL);
        console.log('DIALOG_SMS_USERNAME', DIALOG_SMS_USERNAME);
        console.log('DIALOG_SMS_PASSWORD', DIALOG_SMS_PASSWORD);
        const response = await axios.post(`${DIALOG_SMS_API_URL}/user/login`, {
            username: DIALOG_SMS_USERNAME,
            password: DIALOG_SMS_PASSWORD
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.token) {
            cachedToken = response.data.token;
            // Set expiry to 11 hours from now (tokens expire in 12 hours, refresh early)
            tokenExpiry = Date.now() + (11 * 60 * 60 * 1000);
            console.log('SMS API token obtained successfully');
            return cachedToken;
        } else {
            throw new Error('No token received from Dialog API');
        }
    } catch (error) {
        console.error('Error getting SMS API token:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with SMS API');
    }
}

/**
 * Send SMS via Dialog e-SMS API
 * @param {string} mobile - Mobile number (Sri Lankan format, e.g., "773837922")
 * @param {string} message - SMS message content
 * @param {string} transactionId - Booking transaction ID
 * @returns {Promise<Object>} API response
 */
async function sendSMS(mobile, message, transactionId) {
    try {
        // Validate inputs
        if (!mobile || !message) {
            throw new Error('Mobile number and message are required');
        }

        // Get authentication token
        const token = await getAuthToken();

        // Format mobile number (remove any leading 0 or +94)
        let formattedMobile = mobile.replace(/^\+?94/, '').replace(/^0/, '');

        // Validate Sri Lankan mobile number (should be 9 digits starting with 7)
        if (!/^7\d{8}$/.test(formattedMobile)) {
            console.warn(`Invalid Sri Lankan mobile number format: ${mobile}`);
            // Still try to send, but log warning
        }

        console.log(`Sending SMS to ${formattedMobile}...`);

        const response = await axios.post(`${DIALOG_SMS_API_URL}/sms`, {
            msisdn: [{ mobile: formattedMobile }],
            sourceAddress: DIALOG_SMS_SOURCE_ADDRESS,
            message: message,
            transaction_id: transactionId,
            payment_method: 0
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('SMS sent successfully:', response.data);
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error sending SMS:', error.response?.data || error.message);

        // If token expired, clear cache and retry once
        if (error.response?.status === 401 && cachedToken) {
            console.log('Token expired, retrying with fresh token...');
            cachedToken = null;
            tokenExpiry = null;

            try {
                const token = await getAuthToken();
                const retryResponse = await axios.post(`${DIALOG_SMS_API_URL}/sms`, {
                    msisdn: [{ mobile: mobile.replace(/^\+?94/, '').replace(/^0/, '') }],
                    sourceAddress: DIALOG_SMS_SOURCE_ADDRESS,
                    message: message,
                    transaction_id: transactionId,
                    payment_method: 0
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('SMS sent successfully on retry:', retryResponse.data);
                return {
                    success: true,
                    data: retryResponse.data
                };
            } catch (retryError) {
                console.error('Retry failed:', retryError.response?.data || retryError.message);
                throw retryError;
            }
        }

        throw error;
    }
}

/**
 * Send booking confirmation SMS
 * @param {Object} bookingDetails - Booking information
 * @param {string} bookingDetails.patientPhone - Patient's phone number
 * @param {string} bookingDetails.patientName - Patient's name
 * @param {string} bookingDetails.transactionId - Booking transaction ID
 * @param {string} bookingDetails.doctorName - Doctor's name
 * @param {string} bookingDetails.dispensaryName - Dispensary name
 * @param {string} bookingDetails.bookingDate - Booking date
 * @param {string} bookingDetails.timeSlot - Time slot
 * @param {number} bookingDetails.appointmentNumber - Appointment number
 * @returns {Promise<Object>} Send result
 */
async function sendBookingConfirmation(bookingDetails) {
    try {
        const {
            patientPhone,
            patientName,
            transactionId,
            doctorName,
            dispensaryName,
            bookingDate,
            timeSlot,
            appointmentNumber
        } = bookingDetails;

        // Validate required fields
        if (!patientPhone) {
            console.warn('No phone number provided, skipping SMS');
            return { success: false, reason: 'No phone number' };
        }

        // Create message
        const message = `Dear ${patientName}, your booking is confirmed! 
Ref: ${transactionId}
Doctor: ${doctorName}
Location: ${dispensaryName}
Date: ${bookingDate}
Time: ${timeSlot}
Appointment #${appointmentNumber}
Thank you for choosing eHands!`;

        // Send SMS
        const result = await sendSMS(patientPhone, message, transactionId);
        return result;
    } catch (error) {
        console.error('Error sending booking confirmation SMS:', error.message);
        // Don't throw - we don't want SMS failures to block booking
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    sendSMS,
    sendBookingConfirmation,
    getAuthToken
};
