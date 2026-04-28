import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/options';
import { connectDB } from '@/lib/db/mongoose';
import { PaymentModel } from '@/lib/db/models/Payment';
import { initializeTransaction } from '@/lib/payments/paystack';

const initializePaymentSchema = z.object({
  plan: z.enum(['pro']),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan, email } = initializePaymentSchema.parse(body);

    await connectDB();

    const amountKobo = 50000 * 100;
    const origin = request.nextUrl.origin;
    const callbackUrl = `${origin}/api/payments/callback`;

    const response = await initializeTransaction(email, amountKobo, {
      userId: session.user.id,
      plan,
    }, callbackUrl);

    await PaymentModel.create({
      userId: session.user.id,
      reference: response.reference,
      amount: amountKobo,
      currency: 'NGN',
      status: 'pending',
      metadata: {
        plan,
      },
    });

    return NextResponse.json(
      {
        authorizationUrl: response.authorization_url,
        reference: response.reference,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
