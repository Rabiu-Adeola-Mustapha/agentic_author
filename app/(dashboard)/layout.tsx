import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { Sidebar } from '@/components/shared/Sidebar';
import { Navbar } from '@/components/shared/Navbar';
import { SessionProvider } from '@/components/providers/SessionProvider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <Sidebar />
        <div className="ml-60 flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
