import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import { PaymentModel } from '@/lib/db/models/Payment';
import { UserModel } from '@/lib/db/models/User';
import { SubscriptionModel } from '@/lib/db/models/Subscription';
import { verifyWebhookSignature } from '@/lib/payments/paystack';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-paystack-signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    const rawBody = await request.text();

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'charge.success') {
      const { reference, authorization, amount } = event.data;

      await connectDB();

      const payment = await PaymentModel.findOne({ reference });
      if (!payment) {
        console.warn(`Payment not found for reference ${reference}`);
        return NextResponse.json({ status: 200 });
      }

      await PaymentModel.updateOne(
        { reference },
        { status: 'success' }
      );

      const user = await UserModel.findById(payment.userId);
      if (!user) {
        console.warn(`User not found for payment ${reference}`);
        return NextResponse.json({ status: 200 });
      }

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      user.subscription.plan = 'pro';
      user.subscription.status = 'active';
      user.subscription.expiresAt = endDate;
      await user.save();

      await SubscriptionModel.updateOne(
        { userId: payment.userId },
        {
          plan: 'pro',
          status: 'active',
          startDate: new Date(),
          endDate,
          paystackReference: reference,
        },
        { upsert: true }
      );

      console.log(
        `[Payment] Subscription upgraded to pro for user ${payment.userId}`
      );
    }

    return NextResponse.json({ status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ status: 200 });
  }
}
