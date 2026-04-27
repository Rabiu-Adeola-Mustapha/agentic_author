import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { connectDB } from '@/lib/db/mongoose';
import { UserModel } from '@/lib/db/models/User';
import { sendPasswordResetEmail } from '@/lib/email/mailer';
import logger from '@/lib/logger';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    await connectDB();

    const user = await UserModel.findOne({ email });

    // Don't reveal if email exists (security best practice)
    if (!user) {
      logger.warn('Password reset request for non-existent email', { email });
      return NextResponse.json(
        { message: 'If email exists, reset link will be sent shortly' },
        { status: 200 }
      );
    }

    // Generate reset token (32 random bytes as hex string)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Save to database
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expiresAt;
    await user.save();

    // Generate reset link
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send email
    try {
      await sendPasswordResetEmail(email, resetLink);
      logger.info('Password reset email sent', { email });
    } catch (emailError) {
      logger.error('Failed to send password reset email', {
        email,
        error: emailError instanceof Error ? emailError.message : 'Unknown error',
      });
      // Don't fail the request, but log it
    }

    return NextResponse.json(
      { message: 'If email exists, reset link will be sent shortly' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      );
    }

    logger.error('Password reset request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
