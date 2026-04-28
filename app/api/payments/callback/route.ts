import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import { PaymentModel } from '@/lib/db/models/Payment';
import { UserModel } from '@/lib/db/models/User';
import { SubscriptionModel } from '@/lib/db/models/Subscription';
import { verifyTransaction } from '@/lib/payments/paystack';

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get('reference');
    if (!reference) {
      return NextResponse.redirect(
        new URL('/dashboard/billing?error=missing_reference', request.nextUrl.origin)
      );
    }

    await connectDB();

    // Verify payment with Paystack
    const verification = await verifyTransaction(reference);

    if (verification.data.status !== 'success') {
      return NextResponse.redirect(
        new URL(`/dashboard/billing?error=payment_failed&reference=${reference}`, request.nextUrl.origin)
      );
    }

    // Find payment record
    const payment = await PaymentModel.findOne({ reference });
    if (!payment) {
      console.warn(`Payment not found for reference ${reference}`);
      return NextResponse.redirect(
        new URL(`/dashboard/billing?error=payment_not_found&reference=${reference}`, request.nextUrl.origin)
      );
    }

    // Update payment status
    await PaymentModel.updateOne(
      { reference },
      { status: 'success' }
    );

    // Get user and update subscription
    const user = await UserModel.findById(payment.userId);
    if (!user) {
      console.warn(`User not found for payment ${reference}`);
      return NextResponse.redirect(
        new URL(`/dashboard/billing?error=user_not_found&reference=${reference}`, request.nextUrl.origin)
      );
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

    console.log(`[Payment] Subscription upgraded to pro for user ${payment.userId}`);

    return NextResponse.redirect(
      new URL('/dashboard/billing?success=true', request.nextUrl.origin)
    );
  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/billing?error=verification_failed', request.nextUrl.origin)
    );
  }
}
