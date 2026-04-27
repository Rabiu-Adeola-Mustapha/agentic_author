import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import { UserModel } from "@/lib/db/models/User";
import { SubscriptionModel } from "@/lib/db/models/Subscription";
import { OtpCodeModel } from "@/lib/db/models/OtpCode";
import { sendOtpEmail } from "@/lib/email/mailer";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  fullName: z.string().min(2),
});

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email, password, confirmPassword, fullName } =
      registerSchema.parse(body);

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 },
      );
    }

    await connectDB();

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      // If user exists but not verified, resend OTP
      if (!existingUser.isVerified) {
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await OtpCodeModel.deleteMany({ email });

        await OtpCodeModel.create({
          email,
          otp: hashedOtp,
          expiresAt,
        });

        await sendOtpEmail(email, otp);

        return NextResponse.json(
          {
            message: "OTP resent. Please check your email.",
            email,
          },
          { status: 200 },
        );
      }

      // If user is already verified, return error
      return NextResponse.json(
        { error: "Email already registered and verified" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      email,
      passwordHash,
      isVerified: false,
      subscription: {
        plan: "free",
        status: "active",
      },
    });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    await SubscriptionModel.create({
      userId: user._id,
      plan: "free",
      status: "active",
      startDate,
      endDate,
    });

    // Generate and send OTP for new user
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OtpCodeModel.create({
      email,
      otp: hashedOtp,
      expiresAt,
    });

    await sendOtpEmail(email, otp);

    return NextResponse.json(
      {
        message: "Registration successful. Check your email for OTP.",
        email,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
