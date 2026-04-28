'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';

interface ProfileData {
  email: string;
  createdAt: string;
  subscription: {
    plan: 'free' | 'pro';
    status: 'active' | 'inactive';
    expiresAt?: string;
  };
  payments: Array<{
    reference: string;
    amount: number;
    currency: string;
    plan: string;
    createdAt: string;
    status: string;
  }>;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Password changed successfully',
        });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const error = await res.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to change password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-4xl font-sora font-bold mb-2">Settings</h1>
        <p className="text-zinc-400">Manage your account and billing</p>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-400 cursor-not-allowed"
            />
            <p className="text-xs text-zinc-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Member Since</label>
            <input
              type="text"
              value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ''}
              disabled
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-400 cursor-not-allowed"
            />
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
                placeholder="Enter new password (min 8 characters)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
                placeholder="Confirm new password"
              />
            </div>

            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={changingPassword}
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Your current plan and expiration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Current Plan</p>
              <p className="text-lg font-semibold capitalize">{profile?.subscription.plan}</p>
            </div>
            <Badge
              className={
                profile?.subscription.plan === 'pro'
                  ? 'bg-indigo-600'
                  : 'bg-zinc-700'
              }
            >
              {profile?.subscription.status}
            </Badge>
          </div>

          {profile?.subscription.plan === 'pro' && profile?.subscription.expiresAt && (
            <div className="border-t border-zinc-700 pt-4">
              <p className="text-sm text-zinc-400">Expires On</p>
              <p className="text-lg font-semibold">
                {new Date(profile.subscription.expiresAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your past payments and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.payments && profile.payments.length > 0 ? (
            <div className="space-y-3">
              {profile.payments.map((payment) => (
                <div
                  key={payment.reference}
                  className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg border border-zinc-700"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium">
                        Upgrade to {payment.plan === 'pro' ? 'Pro' : 'Free'}
                      </p>
                      <p className="text-sm text-zinc-400">
                        Ref: {payment.reference}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ₦{(payment.amount / 100).toLocaleString()}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-zinc-600 mb-2" />
              <p className="text-zinc-400">No billing history yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
