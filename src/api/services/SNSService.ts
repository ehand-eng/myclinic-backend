import AWS from 'aws-sdk';

// Configure AWS SDK
const sns = new AWS.SNS({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export interface OTPRequest {
  phoneNumber?: string;
  email?: string;
  message: string;
}

export interface OTPResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SNSService {
  /**
   * Send OTP via SMS to mobile number
   */
  static async sendSMSOTP(phoneNumber: string, otp: string): Promise<OTPResponse> {
    try {
      // Format phone number for Sri Lanka (+94)
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

      const result = await sns.publish(params).promise();
      
      return {
        success: true,
        messageId: result.MessageId
      };
    } catch (error: any) {
      console.error('SMS OTP Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send OTP via Email (using SES)
   */
  static async sendEmailOTP(email: string, otp: string): Promise<OTPResponse> {
    try {
      const ses = new AWS.SES({
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });

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
      
      return {
        success: true,
        messageId: result.MessageId
      };
    } catch (error: any) {
      console.error('Email OTP Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format Sri Lankan mobile number to international format
   */
  private static formatSriLankanNumber(phoneNumber: string): string {
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
   * Generate HTML email template for OTP
   */
  private static generateEmailTemplate(otp: string): string {
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
   * Generate a random 6-digit OTP
   */
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Validate OTP format
   */
  static validateOTP(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }

  /**
   * Validate Sri Lankan mobile number format
   */
  static validateSriLankanMobile(mobile: string): boolean {
    const cleaned = mobile.replace(/\D/g, '');
    
    // Sri Lankan mobile numbers should be 9 digits after country code
    // Common formats: 07XXXXXXXX, +947XXXXXXXX, 947XXXXXXXX
    return /^(0|94|\+94)?7[0-9]{8}$/.test(cleaned);
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default SNSService;
