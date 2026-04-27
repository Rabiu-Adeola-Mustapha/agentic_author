import logger from '@/lib/logger';

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function resendOTP(email: string): Promise<void> {
  const bcrypt = (await import('bcryptjs')).default;
  const { OtpCodeModel } = await import('@/lib/db/models/OtpCode');
  const { sendOtpEmail } = await import('@/lib/email/mailer');
  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Delete existing OTPs for this email
  await OtpCodeModel.deleteMany({ email });

  // Create new OTP
  await OtpCodeModel.create({
    email,
    otp: hashedOtp,
    expiresAt,
  });

  // Send email
  await sendOtpEmail(email, otp);

  logger.info('OTP resent successfully', {
    email,
    reason: 'verification_redirect',
    timestamp: new Date().toISOString(),
  });
}
