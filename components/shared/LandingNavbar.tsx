'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export function LandingNavbar() {
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Sparkles className="h-6 w-6 text-indigo-500" />
          <span className="font-sora text-lg font-bold text-zinc-100">
            Agentic Author
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-zinc-300 hover:text-zinc-100 transition-colors text-sm font-medium"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-zinc-300 hover:text-zinc-100 transition-colors text-sm font-medium"
          >
            How it Works
          </a>
          <a
            href="#pricing"
            className="text-zinc-300 hover:text-zinc-100 transition-colors text-sm font-medium"
          >
            Pricing
          </a>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          {session ? (
            <Link href="/dashboard">
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button size="sm" variant="ghost" className="text-zinc-300 hover:text-zinc-100">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  Start Free
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
