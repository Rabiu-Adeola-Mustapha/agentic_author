'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset link');
      }

      toast({
        title: 'Check Your Email',
        description: 'If an account with this email exists, a password reset link has been sent.',
      });

      setSubmitted(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send reset link',
        variant: 'destructive' as const,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <Link href="/login">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </form>
      ) : (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-indigo-600/10 border border-indigo-600/30 rounded-lg">
            <h3 className="font-semibold text-indigo-400 mb-2">Email Sent!</h3>
            <p className="text-sm text-zinc-400">
              If an account with <strong>{email}</strong> exists, you'll receive a password reset link shortly.
            </p>
          </div>

          <p className="text-sm text-zinc-400">
            Check your email (including spam folder) for the reset link. The link expires in 1 hour.
          </p>

          <Link href="/login">
            <Button className="w-full">
              Back to Login
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
