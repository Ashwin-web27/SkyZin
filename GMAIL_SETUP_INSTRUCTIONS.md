# Gmail App Password Setup for personalok051@gmail.com

To receive actual password reset emails at your Gmail account, you need to set up a Gmail App Password.

## Steps to Create Gmail App Password:

### 1. Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Click "2-Step Verification" 
3. Follow the steps to enable 2FA if not already enabled

### 2. Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other (custom name)" as the device
4. Enter "Learno Platform" as the custom name
5. Click "Generate"
6. Copy the 16-character app password (e.g., "abcd efgh ijkl mnop")

### 3. Update Backend Configuration
Replace `your-app-password-here` in `backend/.env` with your actual app password:

```env
SMTP_PASS=your-16-character-app-password
```

## Current Configuration Status:
- ✅ Gmail account configured: personalok051@gmail.com
- ✅ Target email set: personalok051@gmail.com  
- ✅ Email service updated to use Gmail SMTP
- ⏳ **PENDING**: Gmail App Password needs to be set

## How It Works:
1. User requests password reset for any email (e.g., user@example.com)
2. System generates reset token and link
3. **All emails are sent to personalok051@gmail.com** (for testing)
4. Email shows original user info but arrives in your inbox
5. You can use the reset link to test the functionality

## Testing Steps:
1. Set up Gmail App Password (follow steps above)
2. Update the `SMTP_PASS` in `backend/.env`
3. Restart backend server
4. Go to http://localhost:3000/auth/forgot-password
5. Enter any email address (the system will send reset email to your Gmail)
6. Check personalok051@gmail.com for password reset email
7. Click the reset link to test password reset functionality

## Production Note:
In production, remove `TEST_EMAIL_TARGET` from `.env` to send emails to actual user addresses.