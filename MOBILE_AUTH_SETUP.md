# Mobile Authentication Setup Guide

This guide explains how to set up the new mobile authentication system with OTP functionality using Amazon SNS.

## Features

- **Nationality-based signup**: Users can select Sri Lanka or Other
- **Mobile OTP for Sri Lankan users**: SMS-based verification using Amazon SNS
- **Email OTP for foreign users**: Email-based verification using Amazon SES
- **Dual login options**: Mobile OTP or email/password login
- **Modern UI**: Clean, responsive design matching the provided mockups

## Environment Variables

Add the following environment variables to your `.env` file in the server directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/doctor-reservation

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# AWS Configuration for SNS and SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# Email Configuration
FROM_EMAIL=noreply@docspotconnect.com

# Server Configuration
PORT=5000
NODE_ENV=development
```

## AWS Setup

### 1. Amazon SNS Setup (for SMS)

1. Create an AWS account and navigate to SNS console
2. Create a new topic or use the default
3. Get your AWS Access Key ID and Secret Access Key
4. Configure SMS settings:
   - Set spending limits to prevent unexpected charges
   - Configure delivery status logging
   - Set up CloudWatch alarms for monitoring

### 2. Amazon SES Setup (for Email)

1. Navigate to SES console in AWS
2. Verify your sending email address (`FROM_EMAIL`)
3. If in sandbox mode, verify recipient email addresses for testing
4. Request production access if needed
5. Configure DKIM settings for better deliverability

### 3. IAM Permissions

Create an IAM user with the following permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "sns:Publish",
                "sns:GetSMSAttributes",
                "sns:SetSMSAttributes"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail"
            ],
            "Resource": "*"
        }
    ]
}
```

## Installation

### Server Dependencies

```bash
cd server
npm install aws-sdk
```

### Frontend Dependencies

```bash
npm install aws-sdk
```

## API Endpoints

### Signup Flow

1. **Send OTP**: `POST /api/auth/send-otp`
   ```json
   {
     "nationality": "sri_lanka",
     "mobile": "0771234567"
   }
   ```

2. **Verify OTP**: `POST /api/auth/verify-otp`
   ```json
   {
     "nationality": "sri_lanka",
     "mobile": "0771234567",
     "otp": "123456"
   }
   ```

3. **Complete Signup**: `POST /api/auth/signup-mobile`
   ```json
   {
     "name": "John Doe",
     "password": "password123",
     "nationality": "sri_lanka",
     "mobile": "0771234567"
   }
   ```

### Login Flow

1. **Send Login OTP**: `POST /api/auth/send-login-otp`
   ```json
   {
     "loginType": "mobile",
     "mobile": "0771234567"
   }
   ```

2. **Mobile Login**: `POST /api/auth/login-mobile`
   ```json
   {
     "mobile": "0771234567",
     "otp": "123456",
     "keepSignedIn": false
   }
   ```

3. **Email Login**: `POST /api/auth/login-email`
   ```json
   {
     "email": "user@example.com",
     "password": "password123",
     "keepSignedIn": false
   }
   ```

## Database Schema Updates

The User model has been updated to support:

- `mobile`: String (unique, required for Sri Lankan users)
- `email`: String (unique, required for foreign users)
- `nationality`: String (enum: 'sri_lanka', 'other')

## Frontend Components

### New Pages

- `src/pages/NewSignup.tsx`: Multi-step signup with nationality selection
- `src/pages/NewLogin.tsx`: Login with mobile/email options

### Key Features

- **Progress indicators**: Visual step progression
- **Responsive design**: Works on mobile and desktop
- **Form validation**: Client-side validation with server-side verification
- **Error handling**: Comprehensive error messages
- **Modern UI**: Clean design with company colors (#0a1f44, #ffab00)

## Testing

### Test Mobile Numbers (Sri Lanka)

Use these formats for testing:
- `0771234567` (local format)
- `+94771234567` (international format)
- `94771234567` (without +)

### Test Email Addresses

Ensure your test email addresses are verified in SES if in sandbox mode.

## Security Considerations

1. **OTP Expiration**: OTPs expire after 5 minutes
2. **Rate Limiting**: Implement rate limiting for OTP requests
3. **Attempt Limits**: Maximum 3 failed OTP attempts
4. **JWT Expiration**: Tokens expire after 24 hours (or 7 days if "keep signed in")
5. **Input Validation**: All inputs are validated on both client and server

## Monitoring

- Monitor SNS delivery rates and costs
- Set up CloudWatch alarms for failed OTP sends
- Track user registration and login patterns
- Monitor database performance with new schema

## Troubleshooting

### Common Issues

1. **SMS not delivered**: Check AWS SNS spending limits and phone number format
2. **Email not sent**: Verify SES configuration and email addresses
3. **OTP verification fails**: Check server logs for OTP storage issues
4. **Database errors**: Ensure MongoDB is running and schema is updated

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## Production Deployment

1. Update all environment variables with production values
2. Configure proper AWS IAM roles and policies
3. Set up monitoring and alerting
4. Implement rate limiting and DDoS protection
5. Use HTTPS for all API calls
6. Configure proper CORS settings
7. Set up database backups and monitoring

## Support

For issues or questions, check the server logs and AWS CloudWatch for detailed error information.
