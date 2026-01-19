// const axios = require('axios');

// // Dialog e-SMS API Configuration
// const DIALOG_SMS_API_URL = process.env.DIALOG_SMS_API_URL || 'https://e-sms.dialog.lk/api/v2';
// const DIALOG_SMS_USERNAME = process.env.DIALOG_SMS_USERNAME;
// const DIALOG_SMS_PASSWORD = process.env.DIALOG_SMS_PASSWORD;
// const DIALOG_SMS_SOURCE_ADDRESS = process.env.DIALOG_SMS_SOURCE_ADDRESS || 'eHands';

// // Token cache
// let cachedToken = null;
// let tokenExpiry = null;

// /**
//  * Login to Dialog e-SMS API and get authentication token
//  * @returns {Promise<string>} JWT token
//  */
// async function getAuthToken() {
//     try {
//         // Check if we have a valid cached token
//         if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
//             console.log('Using cached SMS API token');
//             return cachedToken;
//         }

//         console.log('Requesting new SMS API token...');
//         console.log('DIALOG_SMS_API_URL', DIALOG_SMS_API_URL);
//         console.log('DIALOG_SMS_USERNAME', DIALOG_SMS_USERNAME);
//         console.log('DIALOG_SMS_PASSWORD', DIALOG_SMS_PASSWORD);
//         const response = await axios.post(`${DIALOG_SMS_API_URL}/user/login`, {
//             username: DIALOG_SMS_USERNAME,
//             password: DIALOG_SMS_PASSWORD
//         }, {
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         });

//         if (response.data && response.data.token) {
//             cachedToken = response.data.token;
//             // Set expiry to 11 hours from now (tokens expire in 12 hours, refresh early)
//             tokenExpiry = Date.now() + (11 * 60 * 60 * 1000);
//             console.log('SMS API token obtained successfully');
//             return cachedToken;
//         } else {
//             throw new Error('No token received from Dialog API');
//         }
//     } catch (error) {
//         console.error('Error getting SMS API token:', error.response?.data || error.message);
//         throw new Error('Failed to authenticate with SMS API');
//     }
// }

// /**
//  * Send SMS via Dialog e-SMS API
//  * @param {string} mobile - Mobile number (Sri Lankan format, e.g., "773837922")
//  * @param {string} message - SMS message content
//  * @param {string} transactionId - Booking transaction ID
//  * @returns {Promise<Object>} API response
//  */
// async function sendSMS(mobile, message, transactionId) {
//     try {
//         // Validate inputs
//         if (!mobile || !message) {
//             throw new Error('Mobile number and message are required');
//         }

//         // Get authentication token
//         const token = await getAuthToken();

//         // Format mobile number (remove any leading 0 or +94)
//         let formattedMobile = mobile.replace(/^\+?94/, '').replace(/^0/, '');

//         // Validate Sri Lankan mobile number (should be 9 digits starting with 7)
//         if (!/^7\d{8}$/.test(formattedMobile)) {
//             console.warn(`Invalid Sri Lankan mobile number format: ${mobile}`);
//             // Still try to send, but log warning
//         }

//         console.log(`Sending SMS to ${formattedMobile}...`);

//         const response = await axios.post(`${DIALOG_SMS_API_URL}/sms`, {
//             msisdn: [{ mobile: formattedMobile }],
//             sourceAddress: DIALOG_SMS_SOURCE_ADDRESS,
//             message: message,
//             transaction_id: transactionId,
//             payment_method: 0
//         }, {
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         console.log('SMS sent successfully:', response.data);
//         return {
//             success: true,
//             data: response.data
//         };
//     } catch (error) {
//         console.error('Error sending SMS:', error.response?.data || error.message);

//         // If token expired, clear cache and retry once
//         if (error.response?.status === 401 && cachedToken) {
//             console.log('Token expired, retrying with fresh token...');
//             cachedToken = null;
//             tokenExpiry = null;

//             try {
//                 const token = await getAuthToken();
//                 const retryResponse = await axios.post(`${DIALOG_SMS_API_URL}/sms`, {
//                     msisdn: [{ mobile: mobile.replace(/^\+?94/, '').replace(/^0/, '') }],
//                     sourceAddress: DIALOG_SMS_SOURCE_ADDRESS,
//                     message: message,
//                     transaction_id: transactionId,
//                     payment_method: 0
//                 }, {
//                     headers: {
//                         'Authorization': `Bearer ${token}`,
//                         'Content-Type': 'application/json'
//                     }
//                 });

//                 console.log('SMS sent successfully on retry:', retryResponse.data);
//                 return {
//                     success: true,
//                     data: retryResponse.data
//                 };
//             } catch (retryError) {
//                 console.error('Retry failed:', retryError.response?.data || retryError.message);
//                 throw retryError;
//             }
//         }

//         throw error;
//     }
// }

// /**
//  * Send booking confirmation SMS
//  * @param {Object} bookingDetails - Booking information
//  * @param {string} bookingDetails.patientPhone - Patient's phone number
//  * @param {string} bookingDetails.patientName - Patient's name
//  * @param {string} bookingDetails.transactionId - Booking transaction ID
//  * @param {string} bookingDetails.doctorName - Doctor's name
//  * @param {string} bookingDetails.dispensaryName - Dispensary name
//  * @param {string} bookingDetails.bookingDate - Booking date
//  * @param {string} bookingDetails.timeSlot - Time slot
//  * @param {number} bookingDetails.appointmentNumber - Appointment number
//  * @returns {Promise<Object>} Send result
//  */
// async function sendBookingConfirmation(bookingDetails) {
//     try {
//         const {
//             patientPhone,
//             patientName,
//             transactionId,
//             doctorName,
//             dispensaryName,
//             bookingDate,
//             timeSlot,
//             appointmentNumber
//         } = bookingDetails;

//         // Validate required fields
//         if (!patientPhone) {
//             console.warn('No phone number provided, skipping SMS');
//             return { success: false, reason: 'No phone number' };
//         }

//         // Create message
//         const message = `Dear ${patientName}, your booking is confirmed! 
// Ref: ${transactionId}
// Doctor: ${doctorName}
// Location: ${dispensaryName}
// Date: ${bookingDate}
// Time: ${timeSlot}
// Appointment #${appointmentNumber}
// Thank you for choosing eHands!`;

//         // Send SMS
//         const result = await sendSMS(patientPhone, message, transactionId);
//         return result;
//     } catch (error) {
//         console.error('Error sending booking confirmation SMS:', error.message);
//         // Don't throw - we don't want SMS failures to block booking
//         return {
//             success: false,
//             error: error.message
//         };
//     }
// }

// module.exports = {
//     sendSMS,
//     sendBookingConfirmation,
//     getAuthToken
// };

const axios = require('axios');

// Configuration
// Configuration
// Fallback to hardcoded values if env vars are missing/stale
const SMS_API_URL = process.env.DIALOG_SMS_URL || 'https://e-sms.dialog.lk/api/v2';
const SMS_USERNAME = process.env.DIALOG_SMS_USERNAME || 'ehands';
const SMS_PASSWORD = process.env.DIALOG_SMS_PASSWORD || 'ANVehands!8425';

// In-memory token storage
let cachedToken = null;
let tokenExpirationTime = 0; // Epoch time in seconds

/**
 * Login to the SMS Gateway to retrieve the authentication token
 */
async function login() {
    const loginUrl = `${SMS_API_URL}/user/login`;
    console.log(`🔐 Attempting SMS Gateway login to: "${loginUrl}" with user: ${SMS_USERNAME}`);

    try {
        const response = await axios.post(loginUrl, {
            username: SMS_USERNAME,
            password: SMS_PASSWORD
        });

        if (response.data && response.data.token) {
            cachedToken = response.data.token;
            // Set expiration time (subtract 60 seconds buffer)
            // data.expiration is in seconds from now (e.g., 43200)
            const expiresIn = response.data.expiration || 3600;
            tokenExpirationTime = Math.floor(Date.now() / 1000) + expiresIn - 60;

            console.log('✅ SMS Gateway logged in successfully. Token cached.');
            return cachedToken;
        } else {
            console.error('❌ SMS Gateway login failed: No token in response', response.data);
            throw new Error('SMS Gateway login failed');
        }
    } catch (error) {
        console.error('❌ SMS Gateway login error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
}

/**
 * Get a valid token (reuse cached or login again)
 */
async function getToken() {
    const currentTime = Math.floor(Date.now() / 1000);

    if (cachedToken && currentTime < tokenExpirationTime) {
        return cachedToken;
    }

    return await login();
}

/**
 * Send SMS to multiple numbers
 * @param {Array<string>} mobileNumbers - Array of mobile numbers (e.g., ["771234567"])
 * @param {string} message - Message content
 * @param {string} sourceAddress - Optional sender mask
 */
async function sendSMS(mobileNumbers, message, sourceAddress = null) {
    try {
        const token = await getToken();

        // Format msisdn array
        // The API expects: [{ "mobile": "714551682" }, ...]
        const msisdn = mobileNumbers.map(num => ({ mobile: num }));

        // Generate a unique transaction ID (numeric, max 18 digits)
        // Using current timestamp (13 digits) + 4 random digits = 17 digits
        const transaction_id = parseInt(Date.now().toString() + Math.floor(1000 + Math.random() * 9000).toString());

        const payload = {
            msisdn,
            message,
            transaction_id,
            payment_method: 0 // 0 for Prepaid (required by API)
        };

        if (sourceAddress) {
            payload.sourceAddress = sourceAddress;
        }

        console.log(`📤 Sending SMS with TransID: ${transaction_id}`);

        const response = await axios.post(`${SMS_API_URL}/sms`, payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ SMS sent successfully to ${mobileNumbers.length} numbers. TransID: ${transaction_id}`);
        return { success: true, response: response.data, transactionId: transaction_id };

    } catch (error) {
        console.error('❌ SMS sending failed:', error.message);

        // If auth error, try to clear token and retry once
        if (error.response && error.response.status === 401) {
            console.log('🔄 Auth failed, clearing token and retrying...');
            cachedToken = null;
            // Retry once
            try {
                const newToken = await getToken();
                console.log("🔄 Retrying SMS with new token...");
                const response = await axios.post(`${SMS_API_URL}/sms`, payload, {
                    headers: {
                        'Authorization': `Bearer ${newToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log(`✅ Retry SMS sent successfully. TransID: ${transaction_id}`);
                return { success: true, response: response.data };
            } catch (retryError) {
                console.error('❌ Retry SMS failed:', retryError.message);
                return { success: false, error: retryError.message };
            }
        }

        if (error.response) {
            console.error('Response data:', error.response.data);
        }

        return { success: false, error: error.message };
    }
}

/**
 * Send booking confirmation SMS
 * @param {Object} booking - Booking object
 */
async function sendBookingConfirmationSMS(booking) {
    try {
        const { patientPhone, patientName, bookingDate, estimatedTime, doctorId, appointmentNumber } = booking;

        if (!patientPhone) {
            console.warn('⚠️ No patient phone number provided for booking confirmation SMS.');
            return;
        }

        // Ensure phone number format is correct (remove leading 0 if present, or adapt as needed by API)
        // API example uses "714551682" (9 digits). Sri Lankan numbers are usually 9 digits (excluding 0).
        // Let's normalize: remove non-digits, remove leading '94' if present, remove leading '0'.
        let normalizedPhone = patientPhone.replace(/\D/g, '');
        if (normalizedPhone.startsWith('94')) {
            normalizedPhone = normalizedPhone.substring(2);
        }
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = normalizedPhone.substring(1);
        }

        // Basic validation for SL number length (9 digits)
        if (normalizedPhone.length !== 9) {
            console.warn(`⚠️ Phone number ${patientPhone} normalized to ${normalizedPhone} does not appear to be a valid 9-digit SL mobile number.`);
            // Proceeding anyway or skipping? API might reject it.
            // Let's try to send it anyway or maybe return.
            // The user example shows "7XXXXXXXX" which is 9 digits.
        }

        const dateStr = new Date(bookingDate).toDateString();

        // Construct message
        // "Hi <Name>, your booking is confirmed for <Date> at <Time>. Number: <ApptNo>. Thank you!"
        const message = `Hi ${patientName}, your booking is confirmed for ${dateStr} at ${estimatedTime}.\nAppointment No: ${appointmentNumber}.\nThank you for using MyClinic!`;

        // Send the SMS
        return await sendSMS([normalizedPhone], message);

    } catch (error) {
        console.error('❌ Error in sendBookingConfirmationSMS:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendSMS,
    sendBookingConfirmationSMS
};