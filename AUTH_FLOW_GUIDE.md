# Authentication Flow - Unverified Email Handling

## 🔄 Updated Auth Flow

When a user tries to **login** or **signup** with an unverified email, the system now:

1. ✅ Automatically detects unverified email
2. ✅ Resends OTP via email
3. ✅ Redirects to verification page
4. ✅ Logs the attempt for monitoring

---

## 📋 Login Flow (Unverified Email)

```
User enters email & password
        ↓
Click "Sign In"
        ↓
System checks if email exists
        ↓
System checks if email is verified
        ↓
❌ Email NOT verified
        ↓
Automatically resend OTP
        ↓
Toast message: "Email Not Verified - OTP sent"
        ↓
Redirect to /verify-otp?email=user@example.com
        ↓
User enters 6-digit OTP
        ↓
Email verified
        ↓
Redirect to /login to login again
```

---

## 📋 Signup Flow (Automatic)

```
User fills signup form
        ↓
Click "Sign Up"
        ↓
Create account
        ↓
Generate OTP
        ↓
Send OTP email
        ↓
Toast message: "Account created. Check email for OTP"
        ↓
Redirect to /verify-otp?email=user@example.com
        ↓
User enters 6-digit OTP
        ↓
Email verified
        ↓
Redirect to /login
        ↓
User can now login
```

---

## 🔧 Implementation Details

### Login Form (components/auth/LoginForm.tsx)

Added logic to handle unverified email:

```typescript
if (result?.error) {
  if (result.error.includes('Email not verified')) {
    // Automatically resend OTP
    await fetch('/api/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email: formData.email }),
    });

    // Show notification
    toast({
      title: 'Email Not Verified',
      description: 'OTP has been sent to your email.',
    });

    // Redirect to OTP page
    router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
  }
}
```

### Auth Options (lib/auth/options.ts)

Updated to check and log verification status:

```typescript
if (!user.isVerified) {
  logger.info('Login attempt with unverified email', { email });
  throw new Error('Email not verified');
}

logger.info('User logged in successfully', { email, userId: user._id });
```

### OTP Verification (components/auth/OtpForm.tsx)

Already had built-in:
- ✅ Pre-fills email from query params
- ✅ 6-digit OTP input
- ✅ Resend OTP button with 60-second cooldown
- ✅ Redirects to login after verification

---

## 📊 Logging & Monitoring

All auth attempts are now logged:

```bash
# View auth logs
tail -f logs/combined.log | grep -i "login\|email\|verified"
```

### Logged Events

1. **Successful Login**
   ```
   User logged in successfully
   {
     email: "user@example.com",
     userId: "123abc"
   }
   ```

2. **Unverified Email Login Attempt**
   ```
   Login attempt with unverified email
   {
     email: "user@example.com"
   }
   ```

3. **Non-existent Email**
   ```
   Login attempt with non-existent email
   {
     email: "nonexistent@example.com"
   }
   ```

4. **Wrong Password**
   ```
   Login attempt with incorrect password
   {
     email: "user@example.com"
   }
   ```

---

## 🎯 User Experience

### Scenario 1: User Signs Up
```
User → Sign Up → Account Created
         → OTP sent to email
         → Redirected to verify-otp
         → Enter OTP
         → Email verified
         → Redirected to login
         → User logs in
```

### Scenario 2: User Tries Login (Not Verified)
```
User → Login → "Email not verified"
         → OTP automatically sent
         → Redirected to verify-otp
         → Enter OTP
         → Email verified
         → Redirected to login
         → User logs in with password
```

### Scenario 3: User Needs OTP Resent
```
User on verify-otp page
         → Click "Resend OTP"
         → New OTP sent to email
         → Cooldown: 60 seconds
         → Can resend after cooldown expires
```

---

## ⏱️ OTP Details

- **Format**: 6 digits (000000-999999)
- **Expiry**: 10 minutes from generation
- **Resend**: Available with 60-second cooldown
- **Attempts**: Unlimited resends, unlimited verification attempts

---

## 🔐 Security

✅ **What's Protected:**
- Passwords are hashed with bcrypt
- OTPs are hashed before storing
- OTPs expire after 10 minutes
- Session tokens use JWT

✅ **Logged Actions:**
- All login attempts (success and failure)
- Unverified email attempts
- Non-existent email attempts
- Wrong password attempts

---

## 📧 Email Sending

OTP emails are sent using:
- Service: `lib/email/mailer.ts`
- Function: `sendOtpEmail(email, otp)`
- Transport: Configured in `.env`

### Email Contents
```
Subject: Verify Your Email - Agentic Author

Hi [User],

Your verification code is: XXXXXX

This code expires in 10 minutes.

If you didn't request this, ignore this email.
```

---

## 🧪 Testing Locally

### Test 1: Sign Up Flow
```
1. Go to /signup
2. Fill form with test email
3. Click "Sign Up"
4. Check terminal for OTP (if using test email)
5. Enter OTP
6. Verify redirects to /login
```

### Test 2: Unverified Login
```
1. Create account without verifying
2. Go to /login
3. Enter credentials
4. Should redirect to /verify-otp automatically
5. OTP should be sent automatically
```

### Test 3: OTP Resend
```
1. On verify-otp page
2. Click "Resend OTP"
3. Should see "in 60s" countdown
4. After 60s, button is clickable again
```

---

## 🔍 Debugging

### Check OTP Was Sent
```bash
# View email logs
tail -f logs/combined.log | grep -i "otp\|email\|sent"
```

### Check Auth Logs
```bash
# View auth attempts
tail -f logs/combined.log | grep -i "login\|verified"
```

### Database Check
```bash
# Check if user is marked as verified
# In MongoDB:
db.users.findOne({ email: "user@example.com" }, { isVerified: 1 })
```

---

## 🛠️ API Endpoints

### Send OTP
```
POST /api/otp/send
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "message": "OTP sent successfully"
}
```

### Verify OTP
```
POST /api/otp/verify
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}

Response:
{
  "message": "Email verified successfully"
}
```

### Login
```
POST /api/auth/callback/credentials
Handled by NextAuth - uses signIn() from client
```

---

## 🎯 Key Files Modified

| File | Change | Purpose |
|------|--------|---------|
| `components/auth/LoginForm.tsx` | Added unverified email handling | Auto-resend OTP on unverified login |
| `lib/auth/options.ts` | Added logging and unverified check | Track auth attempts |
| `components/auth/OtpForm.tsx` | No change needed | Already had email pre-fill + resend |

---

## 💡 Best Practices

✅ **Do:**
- Always redirect unverified users to OTP page
- Auto-resend OTP when user tries to login unverified
- Show clear messages about what's happening
- Log all auth attempts for security

❌ **Don't:**
- Throw raw error messages to users
- Allow login without email verification
- Silently fail on OTP send errors
- Create new OTPs without deleting old ones

---

## 🚀 Next Steps

1. **Test the flow**: Sign up → verify → login
2. **Monitor logs**: Check auth attempts are logged
3. **Check emails**: Verify OTP emails are received
4. **Optional**: Add email templates for better UX

---

## 📞 Support

If email isn't being sent:
1. Check `.env` has email service configured
2. Check `lib/email/mailer.ts` is correct
3. Check logs for email errors: `tail -f logs/error.log`
4. Test with: `npm run dev` and signup

---

**Status**: ✅ **READY TO USE**  
**Last Updated**: 2024-01-15  
**Flow Type**: Automatic unverified email handling
