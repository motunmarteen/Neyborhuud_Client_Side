# Backend Synchronization Guide for NeyborHuud Email & Authentication System

## Overview

The NeyborHuud PWA frontend has been enhanced with modern email and authentication UX features. This document provides the backend team with everything needed to implement the corresponding API endpoints to support these features.

**Frontend Repository:** NeyborHuud-PWA
**API Base URL Expected:** `https://neyborhuud-serverside.onrender.com/api/v1`

---

## Executive Summary

The frontend now supports:
1. ✅ Real-time email/username availability checking during signup
2. ✅ Post-signup email verification flow with resend capability
3. ✅ Complete forgot password / reset password flow
4. ✅ Email verification via token (from email link)
5. ✅ Settings page for notification and privacy preferences

**Backend needs to implement/verify these endpoints exist and conform to the specifications below.**

---

## API Endpoints Specification

### 1. Check Email Availability

**Purpose:** Frontend calls this during signup to show real-time feedback if email is already registered.

```
GET /api/v1/auth/check-email?email={email}
```

**Request:**
```
Query Parameters:
  - email: string (URL encoded)
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "available": true  // or false if email exists
  }
}
```

**Frontend Behavior:**
- Called with 600ms debounce after user stops typing
- If `available: true` → shows green checkmark
- If `available: false` → shows "This email is already registered"
- If endpoint fails/doesn't exist → assumes available (graceful degradation)

---

### 2. Check Username Availability

**Purpose:** Real-time username availability check during signup.

```
GET /api/v1/auth/check-username?username={username}
```

**Request:**
```
Query Parameters:
  - username: string (URL encoded)
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "available": true  // or false if username taken
  }
}
```

**Frontend Behavior:**
- Same as email check with 600ms debounce
- Username regex on frontend: `/^[a-zA-Z0-9_]{3,30}$/`

---

### 3. User Registration (Create Account)

**Purpose:** Register a new user account.

```
POST /api/v1/auth/create-account
```

**Request Body:**
```json
{
  "username": "nancy_surulere",
  "email": "nancy@example.com",
  "password": "SecurePass123!",
  "agreeToTerms": true,
  "location": {
    "latitude": 6.5244,
    "longitude": 3.3792,
    "state": "Lagos",
    "lga": "Surulere",
    "neighborhood": "Ojuelegba",
    "formattedAddress": "Ojuelegba, Surulere, Lagos State",
    "resolutionSource": "geocoded"
  },
  "deviceLocation": {
    "lat": 6.5244,
    "lng": 3.3792,
    "accuracy": 15
  }
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully. Please verify your email.",
  "data": {
    "user": {
      "id": "user_123",
      "username": "nancy_surulere",
      "email": "nancy@example.com",
      "verificationStatus": "unverified",
      "createdAt": "2026-01-28T12:00:00Z"
    },
    "token": "jwt_access_token_here",
    "community": {
      "id": "community_456",
      "communityName": "Surulere Core"
    }
  }
}
```

**Backend Requirements:**
- Send verification email to user's email address
- Email should contain link: `https://neyborhuud-pwa-kohl.vercel.app/verify-email?token={verification_token}`
- Token should expire after 24 hours
- DO NOT expect `assignedCommunityId` or `communityId` in request (backend assigns automatically)

---

### 4. Resend Verification Email

**Purpose:** Allow users to request a new verification email.

```
POST /api/v1/auth/resend-verification
```

**Request Body (if user is authenticated):**
```json
{}
```

**OR (if user provides email):**
```json
{
  "email": "nancy@example.com"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

**Backend Requirements:**
- Rate limit: Max 1 request per 60 seconds per email
- Generate new verification token
- Invalidate previous tokens (optional but recommended)
- Send email with verification link

---

### 5. Verify Email

**Purpose:** Handle verification when user clicks email link.

```
POST /api/v1/auth/verify-email
```

**Request Body:**
```json
{
  "token": "verification_token_from_email_link"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "user_123",
      "username": "nancy_surulere",
      "email": "nancy@example.com",
      "verificationStatus": "verified"
    }
  }
}
```

**Error Response (400 - Expired Token):**
```json
{
  "success": false,
  "message": "Verification token has expired. Please request a new one."
}
```

**Error Response (400 - Invalid Token):**
```json
{
  "success": false,
  "message": "Invalid verification token."
}
```

**Backend Requirements:**
- Validate token exists and hasn't expired
- Update user's `verificationStatus` to "verified"
- Optionally award bonus HuudCoins (+10) for email verification
- Return user object with updated status

---

### 6. Forgot Password (Request Reset)

**Purpose:** Initiate password reset flow by sending email.

```
POST /api/v1/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "nancy@example.com"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

**SECURITY NOTE:** Always return success message regardless of whether email exists in database. This prevents email enumeration attacks.

**Backend Requirements:**
- If email exists, send password reset email
- Reset link format: `https://neyborhuud-pwa-kohl.vercel.app/reset-password?token={reset_token}`
- Token should expire after 15 minutes
- Rate limit: Max 3 requests per hour per email

---

### 7. Reset Password

**Purpose:** Set new password using reset token.

```
POST /api/v1/auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset_token_from_email_link",
  "newPassword": "NewSecurePass456!"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now log in."
}
```

**Error Response (400 - Expired Token):**
```json
{
  "success": false,
  "message": "This reset link has expired. Please request a new one."
}
```

**Error Response (400 - Invalid Token):**
```json
{
  "success": false,
  "message": "Invalid reset token."
}
```

**Backend Requirements:**
- Validate token exists and hasn't expired
- Validate password meets requirements (8+ chars, uppercase, lowercase, number, special char)
- Hash new password securely
- Invalidate the reset token after use
- Optionally invalidate all existing sessions (security measure)

---

### 8. Update Notification Settings

**Purpose:** Save user's notification preferences.

```
PUT /api/v1/auth/settings/notifications
```

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "email": true,
  "push": true,
  "sms": false,
  "chat": true,
  "mentions": true,
  "likes": true,
  "comments": true
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification settings updated",
  "data": {
    "notifications": {
      "email": true,
      "push": true,
      "sms": false,
      "chat": true,
      "mentions": true,
      "likes": true,
      "comments": true
    }
  }
}
```

---

### 9. Update Privacy Settings

**Purpose:** Save user's privacy preferences.

```
PUT /api/v1/auth/settings/privacy
```

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "profileVisibility": "public",  // "public" | "friends" | "private"
  "showLocation": true,
  "showPhone": false,
  "showEmail": false
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Privacy settings updated",
  "data": {
    "privacy": {
      "profileVisibility": "public",
      "showLocation": true,
      "showPhone": false,
      "showEmail": false
    }
  }
}
```

---

## Email Templates Required

### 1. Email Verification

**Subject:** Verify your NeyborHuud account

**Content should include:**
- Welcome message with username
- Verification button/link: `https://neyborhuud-pwa-kohl.vercel.app/verify-email?token={token}`
- Expiration notice (24 hours)
- "If you didn't create this account, ignore this email"

### 2. Password Reset

**Subject:** Reset your NeyborHuud password

**Content should include:**
- "We received a request to reset your password"
- Reset button/link: `https://neyborhuud-pwa-kohl.vercel.app/reset-password?token={token}`
- Expiration notice (15 minutes)
- "If you didn't request this, you can ignore this email"
- Security tip: "Never share this link with anyone"

---

## Token Specifications

### Verification Token
- **Length:** 32+ characters (UUID or secure random)
- **Expiration:** 24 hours
- **One-time use:** Yes (invalidate after verification)

### Password Reset Token
- **Length:** 32+ characters (UUID or secure random)
- **Expiration:** 15 minutes
- **One-time use:** Yes (invalidate after use)

---

## CORS Configuration Reminder

Ensure these origins are allowed:

```javascript
const allowedOrigins = [
  'https://neyborhuud-pwa-kohl.vercel.app',  // Production
  /^https:\/\/.*\.vercel\.app$/,              // Vercel previews
  'http://localhost:3000',                    // Local dev
  'http://localhost:3001',
  'http://localhost:3002',
];
```

---

## Error Response Format

All error responses should follow this format for consistency:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "ERROR_CODE",  // Optional: machine-readable code
  "errors": {             // Optional: field-specific errors
    "email": ["Email is already registered"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

---

## Testing Endpoints

Use these curl commands to test endpoints:

### Check Email Availability
```bash
curl "https://neyborhuud-serverside.onrender.com/api/v1/auth/check-email?email=test@example.com"
```

### Check Username Availability
```bash
curl "https://neyborhuud-serverside.onrender.com/api/v1/auth/check-username?username=testuser"
```

### Forgot Password
```bash
curl -X POST "https://neyborhuud-serverside.onrender.com/api/v1/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Verify Email
```bash
curl -X POST "https://neyborhuud-serverside.onrender.com/api/v1/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d '{"token": "verification_token_here"}'
```

### Reset Password
```bash
curl -X POST "https://neyborhuud-serverside.onrender.com/api/v1/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{"token": "reset_token_here", "newPassword": "NewPass123!"}'
```

---

## Implementation Priority

| Priority | Endpoint | Reason |
|----------|----------|--------|
| 🔴 Critical | `/auth/create-account` | User registration (may already exist) |
| 🔴 Critical | `/auth/verify-email` | Email verification flow |
| 🔴 Critical | `/auth/resend-verification` | Users need to resend if email missed |
| 🟠 High | `/auth/forgot-password` | Password recovery |
| 🟠 High | `/auth/reset-password` | Password recovery |
| 🟡 Medium | `/auth/check-email` | Better UX, graceful degradation if missing |
| 🟡 Medium | `/auth/check-username` | Better UX, graceful degradation if missing |
| 🟢 Low | `/auth/settings/notifications` | Settings page |
| 🟢 Low | `/auth/settings/privacy` | Settings page |

---

## Questions for Backend Team

1. Are verification and reset tokens stored in database or Redis?
2. What email service is being used (SendGrid, Mailgun, AWS SES)?
3. Is there a preference for token format (JWT vs UUID vs random string)?
4. Should email verification award HuudCoins? If so, how many?
5. Are there any rate limiting middlewares already in place?

---

## Summary

The frontend is ready and waiting for these backend endpoints. The implementation uses graceful degradation - if endpoints like `/auth/check-email` don't exist, the frontend will still work but won't show real-time availability feedback.

**Contact:** Frontend team available for any clarification on expected request/response formats.

**Last Updated:** January 28, 2026
