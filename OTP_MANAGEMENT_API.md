# OTP Management System - API Documentation

## Overview

Centralized OTP (One-Time Password) management system with rate limiting, resend controls, and comprehensive security features.

## Features

✅ **Rate Limiting**
- Maximum 3 resend attempts per hour
- 60-second cooldown between resends
- Automatic reset after 1 hour

✅ **Security**
- 5-minute OTP expiry
- Maximum 5 verification attempts per OTP
- Auto-cleanup of expired OTPs
- In-memory storage (Redis recommended for production)

✅ **Comprehensive Error Handling**
- Detailed error messages
- Remaining attempts feedback
- Cooldown period notifications

---

## API Endpoints

### 1. Send OTP

**Endpoint:** `POST /api/util/send-otp`

**Description:** Send OTP to mobile or email

**Request Body:**
```json
{
  "type": "mobile",           // "mobile" or "email"
  "identifier": "+94771234567", // Mobile number or email
  "purpose": "registration"   // Optional: purpose of OTP
}
```

**Success Response (200 OK):**
```json
{
  "message": "OTP sent successfully",
  "expiresIn": 300,          // Seconds until expiry
  "remainingAttempts": 2,    // Remaining resend attempts
  "cooldownSeconds": 60      // Time to wait before next resend
}
```

**Error Responses:**

**429 Too Many Requests** (Rate limit exceeded):
```json
{
  "message": "Please wait 45 seconds before requesting another OTP.",
  "remainingAttempts": 2,
  "cooldownSeconds": 45
}
```

**429 Too Many Requests** (Max attempts):
```json
{
  "message": "Maximum resend attempts reached. Please try again in 45 minutes.",
  "remainingAttempts": 0,
  "cooldownSeconds": 2700
}
```

---

### 2. Verify OTP

**Endpoint:** `POST /api/util/verify-otp`

**Description:** Verify OTP entered by user

**Request Body:**
```json
{
  "identifier": "+94771234567",
  "otp": "123456"
}
```

**Success Response (200 OK):**
```json
{
  "valid": true,
  "message": "OTP verified successfully."
}
```

**Error Responses:**

**400 Bad Request** (Invalid OTP):
```json
{
  "valid": false,
  "message": "Invalid OTP. 3 attempts remaining.",
  "remainingAttempts": 3
}
```

**400 Bad Request** (Expired):
```json
{
  "valid": false,
  "message": "OTP has expired. Please request a new one."
}
```

**400 Bad Request** (Too many attempts):
```json
{
  "valid": false,
  "message": "Maximum verification attempts exceeded. Please request a new OTP."
}
```

---

### 3. Resend OTP

**Endpoint:** `POST /api/util/resend-otp`

**Description:** Resend OTP (with rate limiting)

**Request Body:**
```json
{
  "type": "mobile",
  "identifier": "+94771234567"
}
```

**Success Response (200 OK):**
```json
{
  "message": "OTP resent successfully",
  "expiresIn": 300,
  "remainingAttempts": 1,
  "cooldownSeconds": 60
}
```

**Error Responses:** Same as Send OTP

---

### 4. Get OTP Status (Debug/Admin)

**Endpoint:** `GET /api/util/otp-status/:identifier`

**Description:** Get current OTP status for debugging

**Example Request:**
```bash
GET /api/util/otp-status/+94771234567
```

**Success Response (200 OK):**
```json
{
  "expiresIn": 245,           // Seconds until expiry
  "verifyAttempts": 1,        // Number of verification attempts
  "maxAttempts": 5,
  "createdAt": "2026-01-26T08:14:07.000Z"
}
```

**404 Not Found:**
```json
{
  "message": "No active OTP found for this identifier"
}
```

---

### 5. Clear OTP (Admin/Testing)

**Endpoint:** `DELETE /api/util/clear-otp/:identifier`

**Description:** Clear OTP and attempts for testing

**Example Request:**
```bash
DELETE /api/util/clear-otp/+94771234567
```

**Success Response (200 OK):**
```json
{
  "message": "OTP and attempts cleared successfully"
}
```

---

## Rate Limiting Rules

### Resend Attempts
1. **Maximum 3 attempts** per identifier per hour
2. **60-second cooldown** between each resend
3. **Automatic reset** after 1 hour from first attempt

### Verification Attempts
1. **Maximum 5 attempts** per OTP
2. Attempts counted per OTP (resets on new OTP)
3. OTP deleted after max attempts exceeded

### Expiry
1. OTP expires after **5 minutes**
2. Auto-cleanup on expiry
3. Can request new OTP after expiry

---

## Usage Examples

### Complete OTP Flow (JavaScript/Node.js)

```javascript
const axios = require('axios');
const API_URL = 'http://localhost:5001/api/util';

// 1. Send OTP
async function sendOTP(mobile) {
  try {
    const response = await axios.post(`${API_URL}/send-otp`, {
      type: 'mobile',
      identifier: mobile
    });
    console.log('OTP sent:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      console.error('Rate limit:', error.response.data);
    }
    throw error;
  }
}

// 2. Verify OTP
async function verifyOTP(mobile, otp) {
  try {
    const response = await axios.post(`${API_URL}/verify-otp`, {
      identifier: mobile,
      otp: otp
    });
    console.log('Verification result:', response.data);
    return response.data.valid;
  } catch (error) {
    console.error('Verification failed:', error.response?.data);
    return false;
  }
}

// 3. Resend OTP
async function resendOTP(mobile) {
  try {
    const response = await axios.post(`${API_URL}/resend-otp`, {
      type: 'mobile',
      identifier: mobile
    });
    console.log('OTP resent:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      const { cooldownSeconds } = error.response.data;
      console.error(`Wait ${cooldownSeconds} seconds`);
    }
    throw error;
  }
}

// Example usage
async function main() {
  const mobile = '+94771234567';
  
  // Send OTP
  await sendOTP(mobile);
  
  // User enters OTP
  const userOTP = '123456'; // From user input
  
  // Verify
  const isValid = await verifyOTP(mobile, userOTP);
  
  if (!isValid) {
    // Resend if needed
    await resendOTP(mobile);
  }
}
```

### Flutter/Dart Example

```dart
import 'package:dio/dio.dart';

class OTPService {
  final Dio _dio = Dio(BaseOptions(baseUrl: 'http://localhost:5001/api/util'));
  
  // Send OTP
  Future<Map<String, dynamic>> sendOTP(String mobile) async {
    try {
      final response = await _dio.post('/send-otp', data: {
        'type': 'mobile',
        'identifier': mobile,
      });
      return response.data;
    } on DioException catch (e) {
      if (e.response?.statusCode == 429) {
        // Handle rate limit
        final cooldown = e.response?.data['cooldownSeconds'];
        throw Exception('Please wait $cooldown seconds');
      }
      rethrow;
    }
  }
  
  // Verify OTP
  Future<bool> verifyOTP(String mobile, String otp) async {
    try {
      final response = await _dio.post('/verify-otp', data: {
        'identifier': mobile,
        'otp': otp,
      });
      return response.data['valid'] == true;
    } catch (e) {
      print('Verification error: $e');
      return false;
    }
  }
  
  // Resend OTP
  Future<Map<String, dynamic>> resendOTP(String mobile) async {
    final response = await _dio.post('/resend-otp', data: {
      'type': 'mobile',
      'identifier': mobile,
    });
    return response.data;
  }
}
```

---

## Configuration

Located in `OTPService.js`:

```javascript
class OTPService {
  constructor() {
    this.OTP_EXPIRY_MINUTES = 5;           // OTP valid for 5 minutes
    this.MAX_RESEND_ATTEMPTS = 3;          // Max 3 resends per hour
    this.RESEND_COOLDOWN_SECONDS = 60;     // 60 seconds between resends
    this.MAX_VERIFY_ATTEMPTS = 5;          // Max 5 verification attempts
  }
}
```

Adjust these values based on your security requirements.

---

## Production Considerations

### 1. Use Redis for Storage
Current implementation uses in-memory storage. For production:

```javascript
const Redis = require('redis');
const redis = Redis.createClient();

// Store OTP in Redis with TTL
await redis.setEx(`otp:${identifier}`, 300, JSON.stringify(otpData));
```

### 2. Add Authentication
Protect admin endpoints:

```javascript
router.delete('/clear-otp/:identifier', validateJwt, requireRole(['admin']), ...);
```

### 3. Implement Logging
Log all OTP operations for security auditing:

```javascript
console log({
  action: 'otp_sent',
  identifier: mobile,
  timestamp: new Date(),
  ip: req.ip
});
```

### 4. Add Monitoring
Monitor OTP metrics:
- Send success/failure rates
- Verification success/failure rates
- Rate limit hits
- Average verification time

---

## Testing

```bash
# Send OTP
curl -X POST http://localhost:5001/api/util/send-otp \
  -H "Content-Type: application/json" \
  -d '{"type":"mobile","identifier":"+94771234567"}'

# Verify OTP
curl -X POST http://localhost:5001/api/util/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier":"+94771234567","otp":"123456"}'

# Check status
curl http://localhost:5001/api/util/otp-status/+94771234567

# Clear for testing
curl -X DELETE http://localhost:5001/api/util/clear-otp/+94771234567
```

---

## Error Handling Best Practices

```javascript
try {
  const result = await sendOTP(mobile);
  // Success
} catch (error) {
  if (error.response?.status === 429) {
    // Rate limited
    const { cooldownSeconds, message } = error.response.data;
    showCooldownMessage(message, cooldownSeconds);
  } else if (error.response?.status === 400) {
    // Invalid input
    showErrorMessage(error.response.data.message);
  } else {
    // Server error
    showErrorMessage('Failed to send OTP. Please try again.');
  }
}
```

---

## Security Notes

- ⚠️ Never log actual OTP values in production
- ⚠️ Implement IP-based rate limiting for additional security
- ⚠️ Use HTTPS in production
- ⚠️ Consider implementing CAPTCHA after multiple failed attempts
- ⚠️ Monitor for suspicious patterns (same IP, multiple identifiers)

---

## Support

For issues or questions regarding OTP management, contact the development team.
