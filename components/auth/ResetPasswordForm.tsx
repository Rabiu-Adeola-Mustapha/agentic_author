'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !email) {
        setTokenValid(false);
        setValidating(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`
        );

        if (res.ok) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          const data = await res.json();
          toast({
            title: 'Invalid Link',
            description: data.error || 'This reset link is invalid or has expired.',
            variant: 'destructive' as const,
          });
        }
      } catch (error) {
        setTokenValid(false);
        toast({
          title: 'Error',
          description: 'Failed to validate reset link',
          variant: 'destructive' as const,
        });
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token, email, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive' as const,
      });
      return;
    }

    if (formData.newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters',
        variant: 'destructive' as const,
      });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast({
        title: 'Success',
        description: 'Your password has been reset. Redirecting to login...',
      });

      setResetSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset password',
        variant: 'destructive' as const,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="w-full max-w-md text-center">
        <p className="text-zinc-400">Validating reset link...</p>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="w-full max-w-md space-y-4">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-400 mb-1">Invalid Link</h3>
            <p className="text-sm text-zinc-400">
              This password reset link is invalid or has expired. Links are valid for 1 hour.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Link href="/forgot-password">
            <Button className="w-full">Request New Reset Link</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="w-full max-w-md space-y-4">
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-400 mb-1">Password Reset!</h3>
            <p className="text-sm text-zinc-400">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-zinc-400">
          Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <label className="block text-sm font-medium mb-2">New Password</label>
        <Input
          type="password"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="At least 8 characters"
          required
          disabled={submitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Confirm Password</label>
        <Input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter your password"
          required
          disabled={submitting}
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Resetting...' : 'Reset Password'}
      </Button>

      <Link href="/login">
        <Button variant="outline" className="w-full" disabled={submitting}>
          Back to Login
        </Button>
      </Link>
    </form>
  );
}
