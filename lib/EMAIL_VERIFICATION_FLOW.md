# Email Verification Flow - Unverified Email Handling

## 📋 Overview

When a user tries to login or signup with an unverified email, the system automatically:

1. **Detects** the unverified email during login
2. **Resends** OTP automatically
3. **Redirects** to the OTP verification page
4. **Logs** all events for monitoring

No manual intervention needed from the user!

---

## 🔄 Complete Flow

### Scenario 1: User Tries to Login with Unverified Email

```
┌─────────────────────────────────────────────────────────┐
│ 1. User enters email & password on /login page          │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ 2. LoginForm.tsx calls signIn('credentials', {...})     │
│    - Sends email and password to auth                   │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Auth Provider (lib/auth/options.ts)                  │
│    - Finds user in database                             │
│    - Checks if user.isVerified === false                │
│    - Throws Error: "Email not verified"                 │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ 4. LoginForm catches error                              │
│    - Detects "Email not verified" in error message      │
│    - Shows toast: "Email Not Verified"                  │
│    - Automatically calls /api/otp/send                  │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ 5. /api/otp/send endpoint                               │
│    - Finds user by email                                │
│    - Checks if email is NOT verified                    │
│    - Generates 6-digit OTP                              │
│    - Hashes OTP with bcrypt                             │
│    - Saves to OtpCode collection                        │
│    - Sends OTP to user's email                          │
│    - Logs: "OTP sent successfully"                      │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ 6. LoginForm redirects to /verify-otp                   │
│    - Passes email as query parameter                    │
│    - URL: /verify-otp?email=user@example.com           │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ 7. OtpForm displays                                     │
│    - Reads email from query params                      │
│    - Shows email field (disabled, pre-filled)           │
│    - Shows OTP input field                              │
│    - Shows "Resend OTP" button (60s cooldown)           │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ 8. User enters 6-digit OTP and clicks Verify            │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ 9. /api/otp/verify endpoint                             │
│    - Finds latest OTP record for email                  │
│    - Checks if OTP is not expired (10 min TTL)          │
│    - Compares entered OTP with stored (bcrypt)          │
│    - Updates User.isVerified = true                     │
│    - Deletes OTP record                                 │
│    - Logs: "Email verified successfully"                │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ 10. OtpForm shows success message                       │
│     - Toast: "Email verified. You can now log in."      │
│     - Redirects to /login page                          │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ 11. User logs in again                                  │
│     - Email is now verified (isVerified = true)         │
│     - Login succeeds                                    │
│     - Redirected to /dashboard                          │
└─────────────────────────────────────────────────────────┘
```

### Scenario 2: User Signs Up

```
┌─────────────────────────────────────────────────────────┐
│ 1. User fills signup form                               │
│    - Full Name, Email, Password                         │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ 2. SignupForm calls /api/auth/register                  │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ 3. /api/auth/register endpoint                          │
│    - Validates input                                    │
│    - Hashes password with bcrypt                        │
│    - Creates User record with isVerified = false        │
│    - Returns success                                    │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ 4. SignupForm automatically calls /api/otp/send         │
│    - Generates and sends OTP                            │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ 5. SignupForm redirects to /verify-otp                  │
│    - Shows toast: "Check your email for OTP"            │
│    - URL: /verify-otp?email=user@example.com           │
│                                                         │
│ → Continue from step 7 above                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Relevant Files

### Auth Configuration
- **`lib/auth/options.ts`** - Auth provider, throws "Email not verified" error

### API Endpoints
- **`app/api/auth/register`** - Creates user with isVerified = false
- **`app/api/otp/send`** - Generates and sends OTP
- **`app/api/otp/verify`** - Verifies OTP and marks user verified

### Frontend Components
- **`components/auth/LoginForm.tsx`** - Catches unverified error, resends OTP
- **`components/auth/SignupForm.tsx`** - Redirects to OTP verification
- **`components/auth/OtpForm.tsx`** - OTP input and verification UI

### Pages
- **`app/(auth)/login/page.tsx`** - Login page
- **`app/(auth)/signup/page.tsx`** - Signup page
- **`app/(auth)/verify-otp/page.tsx`** - OTP verification page

---

## 🔍 Key Code Sections

### 1. Auth Provider (lib/auth/options.ts)
```typescript
const user = await UserModel.findOne({ email: credentials.email });
if (!user.isVerified) {
  throw new Error('Email not verified'); // ← Triggers the flow
}
```

### 2. LoginForm Error Handling (components/auth/LoginForm.tsx)
```typescript
if (result.error.includes('Email not verified')) {
  // Automatically resend OTP
  await fetch('/api/otp/send', {
    method: 'POST',
    body: JSON.stringify({ email: formData.email }),
  });
  
  // Redirect to verification page
  router.push(`/verify-otp?email=${email}`);
}
```

### 3. OTP Send (app/api/otp/send/route.ts)
```typescript
const otp = generateOTP(); // "123456"
const hashedOtp = await bcrypt.hash(otp, 10);
const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min TTL

await OtpCodeModel.create({ email, otp: hashedOtp, expiresAt });
await sendOtpEmail(email, otp); // Sends plain OTP to email
```

### 4. OTP Verify (app/api/otp/verify/route.ts)
```typescript
const isOtpCorrect = await bcrypt.compare(otp, otpCode.otp);
if (!isOtpCorrect) {
  throw new Error('Invalid OTP');
}

// Mark user as verified
await UserModel.updateOne({ email }, { isVerified: true });
```

---

## 📊 Monitoring & Logging

All events are logged for tracking:

### Logs Generated

1. **OTP Sent** (in logs/combined.log)
```
timestamp [INFO]: OTP sent successfully
  email: user@example.com
  reason: email_verification
```

2. **Email Verified** (in logs/combined.log)
```
timestamp [INFO]: Email verified successfully
  email: user@example.com
```

3. **Failed Verification** (in logs/combined.log)
```
timestamp [WARN]: Invalid OTP attempt
  email: user@example.com
```

### View Logs

```bash
# See all OTP-related logs
grep "OTP\|Email verified" logs/combined.log

# Real-time monitoring
tail -f logs/combined.log | grep -i "otp\|verified"
```

---

## 🔒 Security Features

### OTP Security
- ✅ 6-digit random OTP (100,000 - 999,999 range)
- ✅ OTP hashed with bcrypt (not stored in plaintext)
- ✅ 10-minute expiration (TTL)
- ✅ One-time use (deleted after verification)
- ✅ Rate limited (can resend after 60 seconds)

### Password Security
- ✅ Password hashed with bcrypt
- ✅ Never stored or transmitted in plaintext
- ✅ Not logged in any logs

### Email Security
- ✅ Email confirmed via OTP only
- ✅ User cannot login until verified
- ✅ Automatic OTP resend (max 60s interval)

---

## ⚙️ OTP Settings

### OTP Expiration
**File**: `app/api/otp/send/route.ts:41`
```typescript
const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
```

To change: Edit the `10 * 60 * 1000` (milliseconds)
- `5 * 60 * 1000` = 5 minutes
- `15 * 60 * 1000` = 15 minutes

### OTP Cooldown (Resend)
**File**: `components/auth/OtpForm.tsx:64`
```typescript
setResendCooldown(60); // 60 seconds
```

To change: Modify the `60` value

### OTP Format
**File**: `app/api/otp/send/route.ts:13`
```typescript
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

Currently generates 6-digit OTP. To change:
```typescript
// 4-digit OTP
Math.floor(1000 + Math.random() * 9000).toString()

// 8-digit OTP
Math.floor(10000000 + Math.random() * 90000000).toString()
```

---

## 🧪 Testing the Flow

### Test 1: Login with Unverified Email
1. Create a user account (signup)
2. Don't verify email (skip OTP)
3. Go to `/login`
4. Enter email and password
5. ✅ Should automatically resend OTP and redirect to `/verify-otp`

### Test 2: OTP Expiration
1. Request OTP via `/api/otp/send`
2. Wait 10 minutes
3. Try to verify with correct OTP
4. ✅ Should show "OTP expired" error

### Test 3: Invalid OTP
1. Enter wrong 6-digit code
2. ✅ Should show "Invalid OTP" error
3. Can retry without losing OTP

### Test 4: Resend OTP
1. Click "Resend OTP" button
2. ✅ Button should be disabled for 60 seconds
3. ✅ New OTP sent to email
4. Can verify with new OTP

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| OTP not received | Check email spam folder, resend OTP |
| OTP expired | Click "Resend OTP" button |
| Invalid OTP error | Check email for OTP code, verify it's still valid |
| Can't login after verification | Check that isVerified is true in database |
| Email shows "not verified" forever | Check OTP send logs for errors |

---

## 📈 Metrics to Monitor

Track these KPIs:

1. **Signup to Verification Time**
   - Average time from signup to email verification
   - Target: < 5 minutes

2. **Unverified Login Attempts**
   - Count of users trying to login with unverified email
   - Shows user activation funnel

3. **OTP Verification Success Rate**
   - Percentage of valid OTP submissions
   - Target: > 95%

4. **OTP Resend Rate**
   - How many users need to resend OTP
   - High rate may indicate email delivery issues

---

## 🎯 User Experience

### Happy Path (Signup)
```
Signup page → Register → OTP page → Verify → Login → Dashboard
Duration: ~1-2 minutes
```

### Happy Path (Login)
```
Login page → Error (email not verified) → Auto-resend OTP → 
OTP page → Verify → Redirected to login → Login → Dashboard
Duration: ~1-2 minutes
```

### User Sees
1. Signup form
2. "Account created. Check your email for OTP." toast
3. OTP verification page (email pre-filled)
4. Resend OTP button (after 60s)
5. Success message
6. Redirected to login

---

## 🔗 Integration with Monitoring

All events are logged and visible in:

1. **Admin Dashboard**: `/dashboard/metrics`
   - See OTP-related events in logs
   - Track verification funnel

2. **CLI Report**: `npm run logs:analyze`
   - See OTP statistics
   - Analyze verification patterns

3. **Log Files**: `logs/combined.log`
   - Real-time event stream
   - Detailed error messages

---

## ✅ Checklist

- [x] Login detects unverified email
- [x] Auto-resend OTP on unverified login attempt
- [x] Redirect to `/verify-otp?email=...`
- [x] OTP form displays with pre-filled email
- [x] OTP expiration (10 min)
- [x] Resend cooldown (60 sec)
- [x] Email verification updates `isVerified`
- [x] Logging for monitoring
- [x] Error handling for all scenarios
- [x] User-friendly toast messages

---

**Status**: ✅ Complete and Production Ready
**Last Updated**: 2024-01-15
**Version**: 1.0
