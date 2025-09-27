const nodemailer = require('nodemailer');

// Create transporter based on environment
const createTransporter = async () => {
  if (process.env.NODE_ENV === 'production') {
    // Production email configuration (e.g., SendGrid, AWS SES, etc.)
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 465,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Development - Use Gmail for real email delivery
    if (process.env.USE_GMAIL === 'true' && process.env.SMTP_USER && process.env.SMTP_PASS !== 'your-app-password-here') {
      console.log('📧 Using Gmail SMTP for email delivery');
      console.log('   From:', process.env.SMTP_USER);
      console.log('   Target Email:', process.env.TEST_EMAIL_TARGET);
      
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      // Fallback to Ethereal Email for testing
      try {
        const testAccount = await nodemailer.createTestAccount();
        
        console.log('📧 Using Ethereal Email for testing:');
        console.log('   Email:', testAccount.user);
        console.log('   Password:', testAccount.pass);
        
        return nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 465,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      } catch (error) {
        console.error('Failed to create test account:', error.message);
        throw new Error('Email service configuration failed');
      }
    }
  }
};

// Send password reset email
const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  try {
    const transporter = await createTransporter();

    // In development, send all emails to the configured target email
    const targetEmail = to;

    console.log(`📧 Sending password reset email:`);
    console.log(`   Original recipient: ${to}`);
    console.log(`   Actual recipient: ${targetEmail}`);
    console.log(`   Reset URL: ${resetUrl}`);

    const mailOptions = {
      from: process.env.FROM_EMAIL || '"SkyZin Support" <skyzin2025@gmail.com>',
      to: targetEmail,
      subject: 'Reset Your SkyZin Password - SkyZin Platform',
      html: generatePasswordResetEmailHTML({ name, resetUrl, to: targetEmail, originalEmail: to }),
      text: generatePasswordResetEmailText({ name, resetUrl, to: targetEmail, originalEmail: to })
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Password reset email sent successfully');
      console.log('Message ID:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Generate HTML email template
const generatePasswordResetEmailHTML = ({ name, resetUrl, to, originalEmail }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - SkyZin</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8f9fa;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-top: 40px;
          margin-bottom: 40px;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 1px solid #e9ecef;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #6366f1;
          margin-bottom: 10px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #1f2937;
        }
        .content {
          padding: 0 20px;
        }
        .reset-button {
          display: inline-block;
          padding: 14px 32px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 25px 0;
          transition: all 0.3s ease;
        }
        .reset-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }
        .alternative-link {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          border-left: 4px solid #6366f1;
        }
        .alternative-link p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }
        .alternative-link a {
          color: #6366f1;
          word-break: break-all;
          text-decoration: none;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        .warning {
          background-color: #fef3cd;
          border: 1px solid #fde68a;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
        .warning p {
          margin: 0;
          color: #92400e;
          font-size: 14px;
        }
        @media (max-width: 600px) {
          .container {
            margin: 20px 10px;
            padding: 15px;
          }
          .content {
            padding: 0 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">SkyZin</div>
          <p style="margin: 0; color: #6b7280;">Your Learning Platform</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Hello ${name}! 👋
          </div>
          
          ${originalEmail && originalEmail !== to ? `<div style="background-color: #e0f2fe; border: 1px solid #0288d1; border-radius: 6px; padding: 15px; margin: 20px 0;"><p style="margin: 0; color: #01579b; font-size: 14px;"><strong>Development Mode:</strong> This email was originally for ${originalEmail} but sent to ${to} for testing purposes.</p></div>` : ''}
          
          <p>We received a request to reset your password for your SkyZin account. If you made this request, click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="reset-button">Reset My Password</a>
          </div>
          
          <div class="alternative-link">
            <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
            <a href="${resetUrl}">${resetUrl}</a>
          </div>
          
          <div class="warning">
            <p><strong>Important:</strong> This password reset link will expire in 10 minutes for security reasons. If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          
          <p>If you have any questions or need assistance, feel free to contact our support team.</p>
          
          <p>Best regards,<br>The SkyZin Team</p>
        </div>
        
        <div class="footer">
          <p>This email was sent to ${to}. If you didn't request a password reset, please ignore this email.</p>
          <p>&copy; 2024 SkyZin. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Generate plain text email
const generatePasswordResetEmailText = ({ name, resetUrl, to, originalEmail }) => {
  return `
Hello ${name}!

We received a request to reset your password for your SkyZin account.

If you made this request, click the link below to reset your password:
${resetUrl}

This password reset link will expire in 10 minutes for security reasons.

If you didn't request a password reset, you can safely ignore this email.

If you have any questions or need assistance, feel free to contact our support team.

Best regards,
The SkyZin Team

---
This email was sent to ${to}. If you didn't request a password reset, please ignore this email.
© 2024 SkyZin. All rights reserved.
  `.trim();
};

module.exports = {
  sendPasswordResetEmail
};