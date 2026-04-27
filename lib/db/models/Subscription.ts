import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  plan: 'free' | 'pro';
  status: 'active' | 'inactive' | 'expired';
  startDate: Date;
  endDate: Date;
  paystackReference?: string;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    plan: {
      type: String,
      enum: ['free', 'pro'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'inactive',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    paystackReference: String,
  },
  { timestamps: true }
);

export const SubscriptionModel =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>('Subscription', subscriptionSchema);
