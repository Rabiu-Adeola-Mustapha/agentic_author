'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, FileText, CreditCard, LogOut, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/projects', label: 'Projects', icon: FileText },
    { href: '/dashboard/metrics', label: 'Metrics', icon: BarChart3 },
    { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-900 h-screen sticky top-16 overflow-y-auto">
      <div className="p-6 space-y-8">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Account</p>
          <p className="text-sm font-medium truncate">{session?.user?.email}</p>
          <Badge className="mt-2 bg-indigo-600">
            {(session?.user as any)?.plan === 'pro' ? 'Pro' : 'Free'}
          </Badge>
        </div>

        <nav className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = link.href === '/dashboard' 
              ? pathname === '/dashboard' 
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => signOut({ redirectTo: '/' })}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
