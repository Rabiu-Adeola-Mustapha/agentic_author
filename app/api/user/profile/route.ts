import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/options';
import { connectDB } from '@/lib/db/mongoose';
import { UserModel } from '@/lib/db/models/User';
import { PaymentModel } from '@/lib/db/models/Payment';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await UserModel.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const payments = await PaymentModel.find({
      userId: session.user.id,
      status: 'success',
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      email: user.email,
      createdAt: user.createdAt,
      subscription: {
        plan: user.subscription.plan,
        status: user.subscription.status,
        expiresAt: user.subscription.expiresAt,
      },
      payments: payments.map((p) => ({
        reference: p.reference,
        amount: p.amount,
        currency: p.currency,
        plan: (p.metadata as any)?.plan || 'pro',
        createdAt: p.createdAt,
        status: p.status,
      })),
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
