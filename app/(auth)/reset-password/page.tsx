import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { Suspense } from 'react';

export const metadata = {
  title: 'Reset Password - Agentic Author',
  description: 'Reset your Agentic Author password',
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-sora font-bold mb-2">Reset Password</h1>
          <p className="text-zinc-400">Enter your new password below</p>
        </div>

        <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
