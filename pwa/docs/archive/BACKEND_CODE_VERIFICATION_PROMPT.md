# Backend Implementation: Code-Based Email Verification (OTP)

## Summary

The frontend has been updated to use **6-digit code verification** instead of link-based verification. This is a better UX because:

1. **Reliability** - Emails with links often go to spam or get blocked; codes are easier to deliver
2. **User stays in app** - No need to open email app, click link, get redirected back
3. **Mobile-friendly** - Works seamlessly on all devices
4. **Familiar pattern** - Users are accustomed to OTP codes from banking, 2FA, etc.

---

## Current Issues Identified

1. **Verification emails not being received** - Users complete signup but never receive the verification email (not in inbox, not in spam)
2. **Users stuck in unverified state** - Account exists with `emailVerified: false` but user can't verify
3. **"Already registered" but unverified** - Email shows as taken, but user can't complete verification

---

## Required Backend Changes

### 1. Generate 6-Digit Verification Code (Not Link)

When a user registers or requests a new verification:

```javascript
// Generate a 6-digit numeric code
const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

// Store with expiration (e.g., 10 minutes)
await storeVerificationCode({
    email: user.email,
    code: verificationCode,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    attempts: 0
});
```

### 2. Update Email Template

Instead of sending a clickable link, send the code:

**Subject:** Your NeyborHuud verification code: {CODE}

**Body:**
```
Hi {username},

Your verification code is:

    {CODE}

This code expires in 10 minutes.

Enter this code in the app to verify your email.

If you didn't create a NeyborHuud account, please ignore this email.

— The NeyborHuud Team
```

### 3. Update `/auth/verify-email` Endpoint

**Accept both token (legacy) AND code (new):**

```
POST /api/v1/auth/verify-email
```

**Request Body (Code-based - NEW):**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Request Body (Token-based - Legacy/Backward Compatible):**
```json
{
  "token": "verification_token_string"
}
```

**Implementation Logic:**
```javascript
async function verifyEmail(req, res) {
    const { email, code, token } = req.body;
    
    // METHOD 1: Code-based verification (new)
    if (email && code) {
        const record = await findVerificationRecord(email);
        
        if (!record) {
            return res.status(400).json({
                success: false,
                message: 'No verification code found. Please request a new one.'
            });
        }
        
        if (record.expiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Code expired. Please request a new one.'
            });
        }
        
        if (record.attempts >= 5) {
            return res.status(400).json({
                success: false,
                message: 'Too many attempts. Please request a new code.'
            });
        }
        
        if (record.code !== code) {
            await incrementAttempts(email);
            return res.status(400).json({
                success: false,
                message: 'Invalid code. Please check and try again.'
            });
        }
        
        // Success - verify email
        await markEmailVerified(email);
        await deleteVerificationRecord(email);
        
        const user = await getUser(email);
        return res.json({
            success: true,
            message: 'Email verified successfully',
            data: { user }
        });
    }
    
    // METHOD 2: Token-based verification (legacy)
    if (token) {
        // Existing token verification logic
        // ...
    }
    
    return res.status(400).json({
        success: false,
        message: 'Email and code or token required'
    });
}
```

### 4. Update `/auth/resend-verification` Endpoint

```
POST /api/v1/auth/resend-verification
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Verification code sent successfully"
}
```

**Implementation:**
```javascript
async function resendVerification(req, res) {
    const { email } = req.body;
    
    // Check if email exists
    const user = await findUserByEmail(email);
    if (!user) {
        // For security, still return success (don't reveal if email exists)
        return res.json({
            success: true,
            message: 'If this email is registered, a verification code has been sent.'
        });
    }
    
    // Check if already verified
    if (user.emailVerified) {
        return res.status(400).json({
            success: false,
            message: 'Email is already verified'
        });
    }
    
    // Rate limiting: Check if recent code exists (within 60 seconds)
    const recentCode = await findRecentVerificationCode(email, 60);
    if (recentCode) {
        return res.status(429).json({
            success: false,
            message: 'Please wait before requesting a new code'
        });
    }
    
    // Generate and store new code
    const code = generateSixDigitCode();
    await storeVerificationCode({
        email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0
    });
    
    // Send email with code
    await sendVerificationEmail(email, code, user.username);
    
    return res.json({
        success: true,
        message: 'Verification code sent successfully'
    });
}
```

### 5. Update `/auth/create-account` Endpoint

After creating the user:

```javascript
// Generate verification code (not link)
const code = generateSixDigitCode();
await storeVerificationCode({
    email: newUser.email,
    code,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0
});

// Send email with code
await sendVerificationEmail(newUser.email, code, newUser.username);

// Return response
return res.status(201).json({
    success: true,
    message: 'Account created successfully. Please verify your email with the code we sent.',
    data: {
        user: newUser,
        token: accessToken,
        community: assignedCommunity
    }
});
```

---

## Database Schema for Verification Codes

```javascript
// MongoDB Schema Example
const VerificationCodeSchema = new Schema({
    email: { type: String, required: true, lowercase: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Index for cleanup and lookups
VerificationCodeSchema.index({ email: 1 });
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
```

---

## Security Considerations

1. **Code Expiration:** 10 minutes is reasonable (balance security vs UX)
2. **Attempt Limiting:** Max 5 attempts per code, then require new code
3. **Rate Limiting:** Max 1 resend per 60 seconds per email
4. **Code Invalidation:** Delete code after successful verification
5. **No Email Enumeration:** Always return success for resend (don't reveal if email exists)

---

## Email Delivery Checklist

If emails are not being received, check:

1. **Email service configured?** (SendGrid, Mailgun, AWS SES, etc.)
2. **API keys correct?** Check environment variables
3. **From address verified?** Most email services require sender verification
4. **SPF/DKIM/DMARC configured?** For deliverability
5. **Check email service logs** - Are emails being sent? Are they bouncing?
6. **Test with different email providers** - Gmail, Outlook, Yahoo

### Quick Test

Add logging to confirm emails are being sent:

```javascript
async function sendVerificationEmail(email, code, username) {
    console.log(`[EMAIL] Sending verification code ${code} to ${email}`);
    
    try {
        const result = await emailService.send({
            to: email,
            subject: `Your NeyborHuud code: ${code}`,
            // ...
        });
        console.log(`[EMAIL] Sent successfully:`, result);
    } catch (error) {
        console.error(`[EMAIL] Failed to send:`, error);
        throw error; // Re-throw so caller knows it failed
    }
}
```

---

## Frontend Behavior Summary

### Signup Flow
1. User fills signup form
2. `POST /auth/create-account` → Backend creates user + sends code
3. Frontend shows "Enter 6-digit code" screen
4. User enters code
5. `POST /auth/verify-email` with `{ email, code }`
6. Success → proceed to profile completion

### Verify Email Page (`/verify-email`)
- If `?token=xxx` → Try token verification (backward compatible)
- If no token → Show code entry form (email + 6-digit input)
- "Resend Code" button → `POST /auth/resend-verification`

### Error Handling
| Error | Frontend Message |
|-------|------------------|
| Code expired | "Code expired. Please request a new one." |
| Invalid code | "Invalid code. Please check and try again." |
| Too many attempts | "Too many attempts. Please request a new code." |
| Already verified | Redirect to success screen |

---

## Testing the Implementation

### Test 1: Registration + Code Verification
```bash
# 1. Register
curl -X POST "https://api.example.com/api/v1/auth/create-account" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!","agreeToTerms":true}'

# 2. Check email for 6-digit code (or check logs)

# 3. Verify with code
curl -X POST "https://api.example.com/api/v1/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'
```

### Test 2: Resend Code
```bash
curl -X POST "https://api.example.com/api/v1/auth/resend-verification" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Test 3: Invalid Code (should fail)
```bash
curl -X POST "https://api.example.com/api/v1/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"000000"}'
# Expected: { "success": false, "message": "Invalid code..." }
```

---

## Summary of Changes Needed

| Endpoint | Change |
|----------|--------|
| `POST /auth/create-account` | Generate 6-digit code, send email with code (not link) |
| `POST /auth/verify-email` | Accept `{ email, code }` in addition to `{ token }` |
| `POST /auth/resend-verification` | Generate new code, send email, rate limit |

**New database table/collection:** `verification_codes` (email, code, expiresAt, attempts)

**Email template change:** Send code in email body, not a clickable link

---

## Questions for Backend Team

1. What email service are you using? Is it configured and working?
2. Are there any logs showing email send attempts?
3. Is there a test endpoint to trigger a verification email manually?
4. What's the current verification token format and expiration?

---

**Priority: HIGH** - Users cannot complete registration without working email verification.

Please implement code-based verification and let me know when it's deployed so we can test end-to-end.
