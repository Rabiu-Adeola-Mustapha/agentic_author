'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Sparkles,
  LayoutDashboard,
  FolderOpen,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderOpen },
    { name: 'Billing', href: '/billing', icon: CreditCard },
  ];

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-60 flex-col border-r border-zinc-800 bg-zinc-900">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-500" />
          <span className="font-sora text-lg font-bold text-zinc-100">
            Agentic Author
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-l-4 border-indigo-500 bg-indigo-500/20 text-indigo-100'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-300'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-4">
        {status === 'loading' ? (
          <div className="flex animate-pulse flex-col space-y-2">
            <div className="h-4 w-3/4 rounded bg-zinc-800" />
            <div className="h-8 w-full rounded bg-zinc-800" />
          </div>
        ) : session?.user ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-2">
              <span className="truncate text-sm font-medium text-zinc-300" title={session.user.email || ''}>
                {session.user.email}
              </span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold',
                  (session.user as any).plan === 'pro'
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'bg-zinc-800 text-zinc-400'
                )}
              >
                {(session.user as any).plan === 'pro' ? 'Pro' : 'Free'}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
