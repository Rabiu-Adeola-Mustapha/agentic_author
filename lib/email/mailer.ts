import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  throw new Error("Gmail SMTP credentials are not configured");
}

const transporter = nodemailer.createTransport({
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

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: `"Agentic Author" <${GMAIL_USER}>`,
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
  await transporter.sendMail({
    from: `"Agentic Author" <${GMAIL_USER}>`,
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
