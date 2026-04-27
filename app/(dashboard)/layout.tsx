'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  if (status === 'loading') {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1">{children}</div>
      </div>
    </main>
  );
}
