import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db/mongoose';
import { UserModel } from '@/lib/db/models/User';
import { OtpCodeModel } from '@/lib/db/models/OtpCode';

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = verifyOtpSchema.parse(body);

    await connectDB();

    const otpCode = await OtpCodeModel.findOne({ email }).sort({ createdAt: -1 });

    if (!otpCode) {
      return NextResponse.json(
        { error: 'OTP not found. Request a new one.' },
        { status: 404 }
      );
    }

    if (new Date() > otpCode.expiresAt) {
      await OtpCodeModel.deleteOne({ _id: otpCode._id });
      return NextResponse.json(
        { error: 'OTP expired' },
        { status: 400 }
      );
    }

    const isOtpCorrect = await bcrypt.compare(otp, otpCode.otp);
    if (!isOtpCorrect) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 401 }
      );
    }

    await UserModel.updateOne({ email }, { isVerified: true });

    await OtpCodeModel.deleteOne({ _id: otpCode._id });

    return NextResponse.json(
      { verified: true, message: 'Email verified successfully' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('OTP verify error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
