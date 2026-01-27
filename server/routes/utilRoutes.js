const express = require('express');
const router = express.Router();
const otpService = require('../services/OTPService');
const smsService = require('../services/smsService');

/**
 * Send OTP to mobile number or email
 * POST /api/util/send-otp
 */
router.post('/send-otp', async (req, res) => {
    try {
        const { type, identifier, purpose } = req.body;

        // Validate input
        if (!type || !['mobile', 'email'].includes(type)) {
            return res.status(400).json({
                message: 'Invalid type. Must be "mobile" or "email"'
            });
        }

        if (!identifier) {
            return res.status(400).json({
                message: `${type === 'mobile' ? 'Mobile number' : 'Email'} is required`
            });
        }

        // Validate mobile format for Sri Lankan numbers
        if (type === 'mobile') {
            const mobileRegex = /^(\+94|0)7[0-9]{8}$/;
            if (!mobileRegex.test(identifier)) {
                return res.status(400).json({
                    message: 'Invalid mobile number format. Use +94XXXXXXXXX or 07XXXXXXXX'
                });
            }
        }

        // Check if resend is allowed
        const resendCheck = otpService.canResendOTP(identifier);
        if (!resendCheck.allowed) {
            return res.status(429).json({
                message: resendCheck.message,
                remainingAttempts: resendCheck.remainingAttempts,
                cooldownSeconds: resendCheck.cooldownSeconds
            });
        }

        // Generate OTP
        const otp = otpService.generateOTP();

        // Store OTP
        otpService.storeOTP(identifier, otp);

        // Record send attempt
        otpService.recordSendAttempt(identifier);

        // Send OTP based on type
        let sendResult;
        if (type === 'mobile') {
            // Normalize mobile number for SMS service (9 digits, no +94 or 0)
            let normalizedMobile = identifier.replace(/\D/g, '');
            if (normalizedMobile.startsWith('94')) {
                normalizedMobile = normalizedMobile.substring(2);
            }
            if (normalizedMobile.startsWith('0')) {
                normalizedMobile = normalizedMobile.substring(1);
            }
            console.log('Normalized mobile:', normalizedMobile + " ::: " + otp);
            const message = `Your OTP is: ${otp}. It will expire in 5 minutes. Do not share this code with anyone.`;

            // SMS service expects an array of mobile numbers
            sendResult = await smsService.sendSMS([normalizedMobile], message);

            if (!sendResult.success) {
                // Rollback OTP storage on SMS failure
                otpService.clearOTP(identifier);
                return res.status(500).json({
                    message: 'Failed to send OTP via SMS',
                    error: sendResult.error
                });
            }
        } else {
            // Email sending (to be implemented)
            // For now, just log it
            console.log(`OTP for ${identifier}: ${otp}`);
            sendResult = { success: true, message: 'Email OTP feature coming soon' };
        }

        res.json({
            message: 'OTP sent successfully',
            expiresIn: 300, // 5 minutes in seconds
            remainingAttempts: resendCheck.remainingAttempts,
            cooldownSeconds: otpService.RESEND_COOLDOWN_SECONDS
        });

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            message: 'Failed to send OTP',
            error: error.message
        });
    }
});

/**
 * Verify OTP
 * POST /api/util/verify-otp
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { identifier, otp } = req.body;

        // Validate input
        if (!identifier || !otp) {
            return res.status(400).json({
                message: 'Identifier and OTP are required'
            });
        }

        // Verify OTP
        const verification = otpService.verifyOTP(identifier, otp);

        if (verification.valid) {
            return res.json({
                valid: true,
                message: verification.message
            });
        }

        // Invalid OTP
        return res.status(400).json({
            valid: false,
            message: verification.message,
            remainingAttempts: verification.remainingAttempts
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            message: 'Failed to verify OTP',
            error: error.message
        });
    }
});

/**
 * Resend OTP
 * POST /api/util/resend-otp
 */
router.post('/resend-otp', async (req, res) => {
    try {
        const { type, identifier } = req.body;

        // Validate input
        if (!type || !['mobile', 'email'].includes(type)) {
            return res.status(400).json({
                message: 'Invalid type. Must be "mobile" or "email"'
            });
        }

        if (!identifier) {
            return res.status(400).json({
                message: `${type === 'mobile' ? 'Mobile number' : 'Email'} is required`
            });
        }

        // Check if resend is allowed
        const resendCheck = otpService.canResendOTP(identifier);
        if (!resendCheck.allowed) {
            return res.status(429).json({
                message: resendCheck.message,
                remainingAttempts: resendCheck.remainingAttempts,
                cooldownSeconds: resendCheck.cooldownSeconds
            });
        }

        // Clear old OTP
        otpService.clearOTP(identifier);

        // Generate new OTP
        const otp = otpService.generateOTP();

        // Store new OTP
        otpService.storeOTP(identifier, otp);

        // Record send attempt
        otpService.recordSendAttempt(identifier);

        // Send OTP
        let sendResult;
        if (type === 'mobile') {
            // Normalize mobile number for SMS service (9 digits, no +94 or 0)
            let normalizedMobile = identifier.replace(/\D/g, '');
            if (normalizedMobile.startsWith('94')) {
                normalizedMobile = normalizedMobile.substring(2);
            }
            if (normalizedMobile.startsWith('0')) {
                normalizedMobile = normalizedMobile.substring(1);
            }

            const message = `Your OTP is: ${otp}. It will expire in 5 minutes. Do not share this code with anyone.`;

            // SMS service expects an array of mobile numbers
            sendResult = await smsService.sendSMS([normalizedMobile], message);

            if (!sendResult.success) {
                otpService.clearOTP(identifier);
                return res.status(500).json({
                    message: 'Failed to resend OTP via SMS',
                    error: sendResult.error
                });
            }
        } else {
            console.log(`Resend OTP for ${identifier}: ${otp}`);
            sendResult = { success: true, message: 'Email OTP feature coming soon' };
        }

        res.json({
            message: 'OTP resent successfully',
            expiresIn: 300,
            remainingAttempts: resendCheck.remainingAttempts - 1,
            cooldownSeconds: otpService.RESEND_COOLDOWN_SECONDS
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            message: 'Failed to resend OTP',
            error: error.message
        });
    }
});

/**
 * Get OTP status (for debugging - remove in production)
 * GET /api/util/otp-status/:identifier
 */
router.get('/otp-status/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;

        const info = otpService.getOTPInfo(identifier);

        if (!info) {
            return res.status(404).json({
                message: 'No active OTP found for this identifier'
            });
        }

        res.json(info);
    } catch (error) {
        console.error('Get OTP status error:', error);
        res.status(500).json({
            message: 'Failed to get OTP status',
            error: error.message
        });
    }
});

/**
 * Clear OTP and attempts (admin only - for testing)
 * DELETE /api/util/clear-otp/:identifier
 */
router.delete('/clear-otp/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;

        otpService.clearOTP(identifier);
        otpService.clearAttempts(identifier);

        res.json({
            message: 'OTP and attempts cleared successfully'
        });
    } catch (error) {
        console.error('Clear OTP error:', error);
        res.status(500).json({
            message: 'Failed to clear OTP',
            error: error.message
        });
    }
});

module.exports = router;
