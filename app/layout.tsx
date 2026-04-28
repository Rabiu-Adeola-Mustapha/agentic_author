import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Agentic Author - AI-Powered Content Generation',
  description:
    'Create books, screenplays, academic theses, articles, and educational content with our multi-agent AI pipeline.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="bg-zinc-950 text-zinc-100">
        <SessionProvider>{children}</SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
