import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata = {
  title: 'Forgot Password - Agentic Author',
  description: 'Reset your Agentic Author password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-sora font-bold mb-2">Forgot Password?</h1>
          <p className="text-zinc-400">Enter your email to receive a password reset link</p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  );
}
