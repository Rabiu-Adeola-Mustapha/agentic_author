'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export default function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Verification failed');
      }

      toast({
        title: 'Success',
        description: 'Email verified. You can now log in.',
      });

      router.push('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Verification failed',
        variant: 'destructive' as const,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      toast({
        title: 'Success',
        description: 'OTP resent to your email',
      });

      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend OTP',
        variant: 'destructive' as const,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <Input value={email} disabled className="bg-zinc-800" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">6-Digit OTP</label>
        <Input
          type="text"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          required
          disabled={loading}
          className="text-center text-2xl tracking-widest"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Verifying...' : 'Verify Email'}
      </Button>

      <button
        type="button"
        onClick={handleResend}
        disabled={resendCooldown > 0}
        className="w-full text-sm text-indigo-400 hover:text-indigo-300 disabled:text-zinc-600"
      >
        {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
      </button>
    </form>
  );
}
