'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      console.log('Login attempt result:', result);

      if (result?.error) {
        // Fallback check: even if the error is masked, check if the user is unverified
        try {
          const statusRes = await fetch(`/api/auth/status?email=${encodeURIComponent(formData.email)}`);
          const statusData = await statusRes.json();

          if (statusData.exists && !statusData.isVerified) {
            toast({
              title: 'Verification Required',
              description: 'Your email is not verified. Redirecting to verification page...',
              variant: 'destructive',
            });
            window.location.href = `/verify-otp?email=${encodeURIComponent(formData.email)}`;
            return;
          }
        } catch (e) {
          console.error('Failed to check verification status:', e);
        }

        // Standard error handling
        toast({
          title: 'Error',
          description: result.error.includes('Read more') ? 'Invalid email or password' : result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Logged in successfully',
        });
        const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
        window.location.href = callbackUrl;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Login failed',
        variant: 'destructive' as const,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <Input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Password</label>
          <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300">
            Forgot?
          </Link>
        </div>
        <Input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>

      <p className="text-center text-sm text-zinc-400">
        Don't have an account?{' '}
        <Link href="/signup" className="text-indigo-400 hover:text-indigo-300">
          Sign Up
        </Link>
      </p>
    </form>
  );
}
