# Gmail App Password Setup for personalok051@gmail.com

## The Problem
Gmail rejected the login because `Pass@12345` is your regular Gmail password. Gmail requires **App Passwords** for third-party applications.

## Quick Fix Options

### Option 1: Use Ethereal Email (Testing Only) - CURRENT SETTING
✅ **Already configured** - Backend will use Ethereal Email for testing
- No setup required
- Emails show as preview URLs in console
- Good for development/testing

### Option 2: Set Up Gmail App Password (Real Emails)
If you want real emails sent to your Gmail:

#### Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Click "2-Step Verification" 
3. Enable 2FA (required for App Passwords)

#### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" as app
3. Select "Other (Custom name)" as device
4. Enter "Learno Platform"
5. Click "Generate"
6. **Copy the 16-character password** (like: `abcd efgh ijkl mnop`)

#### Step 3: Update Configuration
Edit `backend/.env` and replace:
```
SMTP_PASS=your-16-character-app-password-here
USE_GMAIL=true
```

## Current Status
- ❌ Gmail authentication failed (regular password used)
- ✅ Switched to Ethereal Email for testing
- ✅ All reset emails will still go to personalok051@gmail.com via Ethereal
- ✅ You'll see preview URLs in the console logs

## Testing Now
1. Start backend: `npm start`
2. Test forgot password with any email
3. Check console for preview URL
4. Click preview URL to see the email content

## Production Recommendation
For production, set up the Gmail App Password for real email delivery.