import { Navbar } from '@/components/shared/Navbar';
import OtpForm from '@/components/auth/OtpForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyOtpPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Verify Email</CardTitle>
            <CardDescription>Enter the 6-digit code sent to your email</CardDescription>
          </CardHeader>
          <CardContent>
            <OtpForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
