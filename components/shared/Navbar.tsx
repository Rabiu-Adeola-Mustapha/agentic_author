'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  // Simple logic to derive page title from pathname
  let pageTitle = 'Dashboard';
  if (pathname.includes('/projects/new')) {
    pageTitle = 'New Project';
  } else if (pathname.includes('/projects')) {
    pageTitle = 'Projects';
  } else if (pathname.includes('/billing')) {
    pageTitle = 'Billing';
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6">
      <h1 className="font-sora text-lg font-semibold text-zinc-100">
        {pageTitle}
      </h1>
      <Link
        href="/projects/new"
        className="flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
      >
        <Plus className="h-4 w-4" />
        New Project
      </Link>
    </header>
  );
}
