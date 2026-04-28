'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function BillingPage() {
  const { data: session, update: updateSession } = useSession();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      toast({
        title: 'Payment Successful!',
        description: 'Your subscription has been upgraded to Pro. Refreshing your account...',
      });
      updateSession();
      // Clean up URL parameters
      window.history.replaceState({}, '', '/dashboard/billing');
    } else if (error) {
      const errorMessages: Record<string, string> = {
        payment_failed: 'Payment was not completed. Please try again.',
        missing_reference: 'Payment reference is missing.',
        payment_not_found: 'Payment record not found.',
        user_not_found: 'User account not found.',
        verification_failed: 'Payment verification failed. Please contact support.',
      };
      toast({
        title: 'Payment Error',
        description: errorMessages[error] || 'An error occurred during payment verification.',
        variant: 'destructive',
      });
      // Clean up URL parameters
      window.history.replaceState({}, '', '/dashboard/billing');
    }
  }, [searchParams, toast, updateSession]);

  const userPlan = (session?.user as any)?.plan || 'free';

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'pro',
          email: session?.user?.email,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = data.authorizationUrl;
      } else {
        throw new Error('Failed to initialize payment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Upgrade failed',
        variant: 'destructive' as const,
      });
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-4xl font-sora font-bold mb-2">Billing & Plans</h1>
        <p className="text-zinc-400">Manage your subscription</p>
      </div>

      {userPlan === 'pro' && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-100">Pro Plan Active</p>
            <p className="text-sm text-emerald-200">Thank you for upgrading! You now have access to all Pro features.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Free Plan */}
        <Card className={userPlan === 'free' ? 'border-indigo-600' : ''}>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Get started with limited generations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-3xl font-bold">$0</div>
              <p className="text-sm text-zinc-400">/month</p>
            </div>

            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                2 generations per day
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                Up to 3,000 words per project
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                Web search research
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="text-red-500">✗</span>
                No PDF/DOCX export
              </li>
            </ul>

            {userPlan === 'free' ? (
              <Badge className="w-full justify-center py-2">Current Plan</Badge>
            ) : null}
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className={userPlan === 'pro' ? 'border-indigo-600 bg-gradient-to-br from-zinc-900 to-indigo-950' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Pro</CardTitle>
              <Badge className="bg-indigo-600">Popular</Badge>
            </div>
            <CardDescription>Unlimited content creation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-3xl font-bold">₦50,000</div>
              <p className="text-sm text-zinc-400">/month</p>
            </div>

            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                Unlimited generations
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                Up to 60,000 words per project
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                Advanced web research
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                PDF & DOCX export
              </li>
            </ul>

            {userPlan === 'pro' ? (
              <Badge className="w-full justify-center py-2">Current Plan</Badge>
            ) : (
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-11"
                onClick={handleUpgrade}
                disabled={upgrading}
              >
                {upgrading ? 'Processing...' : 'Upgrade to Pro'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
