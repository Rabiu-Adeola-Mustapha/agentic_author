let transporter: any;

function getTransporter() {
  if (transporter) return transporter;
  
  if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
    const nodemailer = require('nodemailer');
    
    const GMAIL_USER = process.env.GMAIL_USER;
    const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      throw new Error("Gmail SMTP credentials are not configured");
    }

    transporter = nodemailer.createTransport({
      service: "gmail",
      port: 465,
      secure: true,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    return transporter;
  }
  
  return null;
}

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const mailTransporter = getTransporter();
  if (!mailTransporter) return;

  await mailTransporter.sendMail({
    from: `"Agentic Author" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Your Agentic Author Verification Code",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Verify your email</h2>
        <p>Your one-time verification code is:</p>
        <h1 style="letter-spacing: 8px; color: #6366f1;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email: string): Promise<void> {
  const mailTransporter = getTransporter();
  if (!mailTransporter) return;

  await mailTransporter.sendMail({
    from: `"Agentic Author" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Welcome to Agentic Author",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Welcome to Agentic Author!</h2>
        <p>Your account has been created successfully.</p>
        <p>Start creating amazing content with our multi-agent AI pipeline.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<void> {
  const mailTransporter = getTransporter();
  if (!mailTransporter) return;

  await mailTransporter.sendMail({
    from: `"Agentic Author" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Reset Your Agentic Author Password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Reset your password</h2>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <a href="${resetLink}" style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #6366f1;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        ">Reset Password</a>
        <p>Or copy this link:</p>
        <p style="word-break: break-all; color: #666;">
          <code>${resetLink}</code>
        </p>
        <p><strong>This link expires in 1 hour.</strong></p>
        <p>If you didn't request a password reset, ignore this email.</p>
      </div>
    `,
  });
}
