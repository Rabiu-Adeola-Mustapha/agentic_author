import mongoose, { Schema, Document } from 'mongoose';

export interface IOtpCode extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
}

const otpCodeSchema = new Schema<IOtpCode>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: false }
);

otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpCodeModel =
  mongoose.models.OtpCode ||
  mongoose.model<IOtpCode>('OtpCode', otpCodeSchema);
