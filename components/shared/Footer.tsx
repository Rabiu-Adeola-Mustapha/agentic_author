'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800 bg-zinc-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-indigo-500" />
              <span className="font-sora text-lg font-bold text-zinc-100">
                Agentic Author
              </span>
            </Link>
            <p className="text-zinc-400 text-sm">
              AI-powered long-form content generation for any category.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-zinc-100 mb-4 text-sm">Product</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#features"
                  className="text-zinc-400 hover:text-zinc-100 text-sm transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-zinc-400 hover:text-zinc-100 text-sm transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-zinc-400 hover:text-zinc-100 text-sm transition-colors"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h3 className="font-semibold text-zinc-100 mb-4 text-sm">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/signup"
                  className="text-zinc-400 hover:text-zinc-100 text-sm transition-colors"
                >
                  Sign Up
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-zinc-400 hover:text-zinc-100 text-sm transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/billing"
                  className="text-zinc-400 hover:text-zinc-100 text-sm transition-colors"
                >
                  Billing
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-zinc-100 mb-4 text-sm">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-zinc-400 hover:text-zinc-100 text-sm transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-zinc-400 hover:text-zinc-100 text-sm transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-500 text-sm">
            &copy; {currentYear} Agentic Author. All rights reserved.
          </p>
          <p className="text-zinc-500 text-sm">
            Built with ❤️ using AI
          </p>
        </div>
      </div>
    </footer>
  );
}
