const AWS = require('aws-sdk');
const crypto = require('crypto');

// Configure AWS SDK
const sns = new AWS.SNS({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const ses = new AWS.SES({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// In-memory OTP storage (in production, use Redis or database)
const otpStorage = new Map();
const attemptStorage = new Map();

class OTPService {
  constructor() {
    // Configuration
    this.OTP_EXPIRY_MINUTES = 5;
    this.MAX_RESEND_ATTEMPTS = 3;
    this.RESEND_COOLDOWN_SECONDS = 60; // 1 minute between resends
    this.MAX_VERIFY_ATTEMPTS = 5;
  }

  /**
   * Generate a random 6-digit OTP
   */
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store OTP with expiration (5 minutes)
   */
  static storeOTP(identifier, otp) {
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes
    otpStorage.set(identifier, {
      otp,
      expiresAt,
      attempts: 0,
      verifyAttempts: 0,
      createdAt: Date.now()
    });

    // Auto-cleanup after expiry
    setTimeout(() => {
      otpStorage.delete(identifier);
    }, 5 * 60 * 1000);
  }

  /**
   * Check if resend is allowed
   */
  static canResendOTP(identifier) {
    const attempts = attemptStorage.get(identifier) || {
      count: 0,
      lastSentAt: 0,
      firstAttemptAt: Date.now()
    };

    const timeSinceLastSend = (Date.now() - attempts.lastSentAt) / 1000;
    const timeSinceFirstAttempt = (Date.now() - attempts.firstAttemptAt) / 1000;

    // Reset attempts after 1 hour
    if (timeSinceFirstAttempt > 3600) {
      attemptStorage.delete(identifier);
      return {
        allowed: true,
        remainingAttempts: 3,
        cooldownSeconds: 0
      };
    }

    // Check if max attempts reached
    if (attempts.count >= 3) {
      const cooldownRemaining = Math.max(0, 3600 - timeSinceFirstAttempt);
      return {
        allowed: false,
        remainingAttempts: 0,
        cooldownSeconds: Math.ceil(cooldownRemaining),
        message: 'Maximum resend attempts reached. Please try again in ' + Math.ceil(cooldownRemaining / 60) + ' minutes.'
      };
    }

    // Check cooldown period
    if (timeSinceLastSend < 60) {
      const cooldownRemaining = Math.ceil(60 - timeSinceLastSend);
      return {
        allowed: false,
        remainingAttempts: 3 - attempts.count,
        cooldownSeconds: cooldownRemaining,
        message: `Please wait ${cooldownRemaining} seconds before requesting another OTP.`
      };
    }

    return {
      allowed: true,
      remainingAttempts: 3 - attempts.count - 1,
      cooldownSeconds: 0
    };
  }

  /**
   * Record OTP send attempt
   */
  static recordSendAttempt(identifier) {
    const attempts = attemptStorage.get(identifier) || {
      count: 0,
      firstAttemptAt: Date.now()
    };

    attemptStorage.set(identifier, {
      count: attempts.count + 1,
      lastSentAt: Date.now(),
      firstAttemptAt: attempts.firstAttemptAt
    });
  }


  /**
   * Verify OTP
   */
  static verifyOTP(identifier, inputOTP) {
    const stored = otpStorage.get(identifier);

    if (!stored) {
      return {
        success: false,
        valid: false,
        message: 'OTP not found or expired. Please request a new one.'
      };
    }

    if (Date.now() > stored.expiresAt) {
      otpStorage.delete(identifier);
      return {
        success: false,
        valid: false,
        message: 'OTP has expired. Please request a new one.'
      };
    }

    // Increment verify attempts
    stored.verifyAttempts = (stored.verifyAttempts || 0) + 1;

    if (stored.verifyAttempts > 5) {
      otpStorage.delete(identifier);
      return {
        success: false,
        valid: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.'
      };
    }

    if (stored.otp !== inputOTP) {
      const remainingAttempts = 5 - stored.verifyAttempts;
      return {
        success: false,
        valid: false,
        message: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
        remainingAttempts
      };
    }

    // OTP verified successfully - cleanup
    otpStorage.delete(identifier);
    attemptStorage.delete(identifier);

    return {
      success: true,
      valid: true,
      message: 'OTP verified successfully.'
    };
  }

  /**
   * Format Sri Lankan mobile number to international format
   */
  static formatSriLankanNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Handle different Sri Lankan number formats
    if (cleaned.startsWith('94')) {
      // Already in international format
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      // Local format starting with 0
      return `+94${cleaned.substring(1)}`;
    } else if (cleaned.length === 9) {
      // Local format without 0
      return `+94${cleaned}`;
    } else {
      // Assume it's already in correct format
      return `+94${cleaned}`;
    }
  }

  /**
   * Send OTP via SMS to mobile number
   */
  static async sendSMSOTP(phoneNumber) {
    try {
      const otp = this.generateOTP();
      const formattedNumber = this.formatSriLankanNumber(phoneNumber);

      const message = `Your DocSpot Connect verification code is: ${otp}. This code will expire in 5 minutes.`;

      const params = {
        PhoneNumber: formattedNumber,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: 'DocSpot'
          },
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional'
          }
        }
      };
      console.log("params", params);
      const result = await sns.publish(params).promise();
      console.log("result", result);
      // Store OTP for verification
      this.storeOTP(phoneNumber, otp);

      return {
        success: true,
        messageId: result.MessageId,
        message: 'OTP sent successfully'
      };
    } catch (error) {
      console.error('SMS OTP Error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to send OTP'
      };
    }
  }

  /**
   * Send OTP via Email
   */
  static async sendEmailOTP(email) {
    try {
      const otp = this.generateOTP();

      const params = {
        Source: process.env.FROM_EMAIL || 'noreply@docspotconnect.com',
        Destination: {
          ToAddresses: [email]
        },
        Message: {
          Subject: {
            Data: 'DocSpot Connect - Verification Code',
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: this.generateEmailTemplate(otp),
              Charset: 'UTF-8'
            },
            Text: {
              Data: `Your DocSpot Connect verification code is: ${otp}. This code will expire in 5 minutes.`,
              Charset: 'UTF-8'
            }
          }
        }
      };

      const result = await ses.sendEmail(params).promise();

      // Store OTP for verification
      this.storeOTP(email, otp);

      return {
        success: true,
        messageId: result.MessageId,
        message: 'OTP sent successfully'
      };
    } catch (error) {
      console.error('Email OTP Error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to send OTP'
      };
    }
  }

  /**
   * Generate HTML email template for OTP
   */
  static generateEmailTemplate(otp) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DocSpot Connect - Verification Code</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #0a1f44;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .otp-code {
            background-color: #0a1f44;
            color: #ffffff;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            letter-spacing: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">DocSpot Connect</div>
            <h1>Verification Code</h1>
          </div>
          
          <p>Hello,</p>
          
          <p>Thank you for using DocSpot Connect. Please use the following verification code to complete your registration:</p>
          
          <div class="otp-code">${otp}</div>
          
          <div class="warning">
            <strong>Important:</strong> This verification code will expire in 5 minutes. Please do not share this code with anyone.
          </div>
          
          <p>If you didn't request this verification code, please ignore this email.</p>
          
          <p>Best regards,<br>
          The DocSpot Connect Team</p>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2024 DocSpot Connect. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Validate Sri Lankan mobile number format
   */
  static validateSriLankanMobile(mobile) {
    const cleaned = mobile.replace(/\D/g, '');

    // Sri Lankan mobile numbers should be 9 digits after country code
    // Common formats: 07XXXXXXXX, +947XXXXXXXX, 947XXXXXXXX
    return /^(0|94|\+94)?7[0-9]{8}$/.test(cleaned);
  }

  /**
   * Validate email format
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get OTP info (for debugging/admin purposes)
   */
  static getOTPInfo(identifier) {
    const stored = otpStorage.get(identifier);
    if (!stored) return null;

    return {
      expiresIn: Math.max(0, Math.ceil((stored.expiresAt - Date.now()) / 1000)),
      verifyAttempts: stored.verifyAttempts || 0,
      maxAttempts: 5,
      createdAt: new Date(stored.createdAt).toISOString()
    };
  }

  /**
   * Clear OTP for identifier
   */
  static clearOTP(identifier) {
    otpStorage.delete(identifier);
  }

  /**
   * Clear all attempts for identifier
   */
  static clearAttempts(identifier) {
    attemptStorage.delete(identifier);
  }

  /**
   * Clean up expired OTPs (should be called periodically)
   */
  static cleanupExpiredOTPs() {
    const now = Date.now();
    for (const [identifier, data] of otpStorage.entries()) {
      if (now > data.expiresAt) {
        otpStorage.delete(identifier);
      }
    }
  }
}

module.exports = OTPService;
