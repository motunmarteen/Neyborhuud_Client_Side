# 🔴 Critical Issue: Profile Completion Fails After Email Verification

## Problem Summary

Users cannot complete their profile after successfully verifying their email. The backend returns a **401 "Invalid token or user not active"** error, even though:
1. ✅ Email verification succeeds
2. ✅ User is marked as verified in the database
3. ✅ Valid authentication token exists

---

## Current Flow & Issue

### Expected Flow:
```
1. User signs up → Gets token → Token stored
2. User verifies email with OTP → Email marked verified ✅
3. User completes profile → Should succeed ✅
```

### Actual Flow:
```
1. User signs up → Gets token → Token stored ✅
2. User verifies email with OTP → Email marked verified ✅
3. User completes profile → 401 Error ❌ "Invalid token or user not active"
```

---

## Error Details

### Request to Complete Profile:
```
POST /api/v1/auth/complete-profile
Headers:
  Authorization: Bearer {token_from_signup}
Body:
  {
    "firstName": "...",
    "lastName": "...",
    "phone": "...",
    "gender": "...",
    "dob": "..."
  }
```

### Backend Response:
```json
{
  "status": 401,
  "message": "Invalid token or user not active",
  "success": false
}
```

### Frontend Console Logs Show:
- ✅ Email verification successful: `"Email verified successfully"`
- ✅ User data updated: `{ emailVerified: true, isVerified: true }`
- ✅ Token exists: `"neyborhuud_access_token"` present in localStorage
- ❌ Profile completion fails with 401

---

## Root Cause Analysis

### Hypothesis 1: Token Not Refreshed After Verification
The token issued during signup might be invalidated or not updated after email verification. The backend may require a new token/session after verification.

**Evidence:**
- Backend returns `data.user` after verification but **no new token/session**
- Old token from signup is still being used
- Token might have claims that don't reflect verified status

### Hypothesis 2: Backend Checks Token Claims Instead of Database
The backend might be checking `emailVerified` status from the token's JWT claims (set at signup time) instead of checking the database.

**Evidence:**
- User is verified in database (`emailVerified: true`)
- But token was issued before verification
- Backend might not be checking database for current verification status

### Hypothesis 3: Session Not Updated After Verification
If using Better Auth or session-based auth, the session might not be updated after email verification.

---

## Required Backend Changes

### Option 1: Return New Token/Session After Verification (RECOMMENDED)

**Update `/api/v1/auth/verify-email` endpoint:**

```javascript
// After successful email verification
await markEmailVerified(email);
await deleteVerificationRecord(email);

const user = await getUser(email);

// ✅ NEW: Generate/refresh token after verification
const newToken = await generateAccessToken(user); // or refresh existing session
const refreshToken = await generateRefreshToken(user); // if applicable

return res.json({
    success: true,
    message: 'Email verified successfully',
    data: {
        user,
        // ✅ Return new token/session
        token: newToken,
        // OR if using session-based auth:
        session: {
            access_token: newToken,
            refresh_token: refreshToken
        }
    }
});
```

**Benefits:**
- Token reflects verified status
- No need to check database on every request
- Clear separation of concerns

---

### Option 2: Check Database for Verification Status (ALTERNATIVE)

**Update `/api/v1/auth/complete-profile` endpoint:**

```javascript
async function completeProfile(req, res) {
    // 1. Authenticate user (check token)
    const user = await authenticateUser(req); // from token
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }
    
    // 2. ✅ Check database for verification status (not token claims)
    const dbUser = await User.findById(user.id); // Fetch fresh from DB
    if (!dbUser.emailVerified && !dbUser.isVerified) {
        return res.status(403).json({
            success: false,
            message: "Please verify your email before completing your profile. Check your email for the verification code."
        });
    }
    
    // 3. Complete profile
    // ... rest of logic
}
```

**Benefits:**
- Always checks current database state
- Works with existing tokens
- More reliable

---

### Option 3: Update Session After Verification (If Using Better Auth)

If using Better Auth or session-based authentication:

```javascript
// After email verification
await markEmailVerified(email);

// ✅ Update the session to reflect verified status
await updateSession(user.id, {
    emailVerified: true,
    isVerified: true
});

// Return updated session token
const updatedSession = await getSession(user.id);
return res.json({
    success: true,
    data: {
        user,
        session: updatedSession
    }
});
```

---

## Current Backend Response (After Verification)

### What Backend Currently Returns:
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "...",
      "emailVerified": true,
      "isVerified": true
    }
    // ❌ No token/session returned
  }
}
```

### What Frontend Needs:
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "...",
      "emailVerified": true,
      "isVerified": true
    },
    // ✅ Return token/session
    "token": "new_access_token_here",
    // OR
    "session": {
      "access_token": "new_access_token_here",
      "refresh_token": "refresh_token_here"
    }
  }
}
```

---

## Testing Checklist

Please verify:

- [ ] **After email verification, does the backend return a new token/session?**
- [ ] **Does `/api/v1/auth/complete-profile` check the database for `emailVerified` status?**
- [ ] **Or does it check token claims (which might be outdated)?**
- [ ] **Is the token from signup still valid after email verification?**
- [ ] **Does the backend update the session after email verification?**

---

## Expected Behavior After Fix

1. User signs up → Gets token ✅
2. User verifies email → Gets new token OR existing token works ✅
3. User completes profile → Success ✅

---

## Error Messages to Update

### Current Error (401):
```
"Invalid token or user not active"
```

### Should Be More Specific:
- **If token invalid:** `"Your session is invalid or expired. Please log in again."`
- **If email not verified:** `"Please verify your email before completing your profile. Check your email for the verification code."`
- **If user not active:** `"Your account is not active. Please contact support."`

---

## Additional Context

### Frontend Implementation:
- Frontend stores token in `localStorage` as `neyborhuud_access_token`
- Frontend automatically sends token in `Authorization: Bearer {token}` header
- Frontend updates user data after verification: `localStorage.setItem('neyborhuud_user', JSON.stringify(user))`

### Verification Endpoint:
```
POST /api/v1/auth/verify-email
Body: { email: "...", code: "123456" }
```

### Profile Completion Endpoint:
```
POST /api/v1/auth/complete-profile
Headers: { Authorization: "Bearer {token}" }
Body: { firstName, lastName, phone, gender, dob }
```

---

## Questions for Backend Team

1. **Does the backend invalidate tokens after email verification?**
2. **Should we get a new token after verification, or should the old token work?**
3. **Does the backend check token claims or database for verification status?**
4. **Is there a session refresh endpoint we should call after verification?**
5. **What's the expected flow for token management after email verification?**

---

## Priority

**🔴 HIGH PRIORITY** - This blocks users from completing their profile after signup, preventing them from using the application.

---

## Contact

If you need more information or have questions, please reach out. We can provide:
- Full request/response logs
- Network traces
- Frontend code snippets
- Test user accounts

Thank you for your attention to this issue!
