'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/shared/Navbar';
import { BookOpen, Clapperboard, FileText, Newspaper, GraduationCap, Zap, Target, Rocket } from 'lucide-react';

import { CATEGORY_CONFIG } from '@/lib/config/category-config';
import { ContentCategory } from '@/types';

const steps = [
  { number: 1, title: 'Structured Questions', description: 'Answer a guided, adaptive questionnaire about your project goals' },
  { number: 2, title: 'Prompt Generation', description: 'AI builds a comprehensive master prompt tailored to your needs' },
  { number: 3, title: 'Plan Structure', description: 'AI creates a detailed outline and content strategy' },
  { number: 4, title: 'Web Research', description: 'AI gathers real-world sources and key insights' },
  { number: 5, title: 'Content Writing', description: 'AI writes your document section by section' },
  { number: 6, title: 'Evaluate Quality', description: 'AI scores the output and suggests improvements' },
];

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navbar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-sora font-bold mb-6 bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-200 bg-clip-text text-transparent">
            Write anything.
            <br />
            Research everything.
            <br />
            Publish with confidence.
          </h1>
          <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
            Multi-agent AI pipeline for generating long-form content across five categories.
            From books to screenplays, theses to articles, and educational materials.
          </p>
          <div className="flex gap-4 justify-center">
            {session ? (
              <>
                <Link href="/dashboard">
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                    Go to Dashboard <Rocket className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                    Start Free <Zap className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-sora font-bold text-center mb-12">What can you create?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Object.entries(CATEGORY_CONFIG) as [ContentCategory, typeof CATEGORY_CONFIG[ContentCategory]][]).map(([key, cat]) => (
            <Card key={key} className="hover:border-indigo-600 transition-colors">
              <CardHeader>
                <div className="text-4xl mb-4">{cat.icon}</div>
                <CardTitle className="text-xl">{cat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">{cat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-sora font-bold text-center mb-12">How it works</h2>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {steps.map((step, i) => (
            <div key={i} className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center font-sora font-bold">
                  {step.number}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block flex-1 h-1 bg-indigo-600 mx-2"></div>
                )}
              </div>
              <h3 className="font-sora font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-zinc-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-sora font-bold text-center mb-12">Simple pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Get started with limited generations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">$0<span className="text-sm text-zinc-400">/month</span></div>
              <ul className="space-y-2 text-sm">
                <li>✓ 2 generations per day</li>
                <li>✓ Up to 3,000 words per project</li>
                <li>✓ Web search research</li>
                <li>✗ No export (PDF/DOCX)</li>
              </ul>
              <Link href="/signup">
                <Button className="w-full" variant="outline">Get Started</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-indigo-600 bg-gradient-to-br from-zinc-900 to-indigo-950">
            <CardHeader>
              <Badge className="w-fit">Popular</Badge>
              <CardTitle>Pro</CardTitle>
              <CardDescription>Unlimited content creation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">₦50,000<span className="text-sm text-zinc-400">/month</span></div>
              <ul className="space-y-2 text-sm">
                <li>✓ Unlimited generations</li>
                <li>✓ Up to 60,000 words per project</li>
                <li>✓ Advanced web research</li>
                <li>✓ PDF & DOCX export</li>
              </ul>
              <Link href="/signup">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Upgrade to Pro</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-900 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-zinc-400 text-sm">
            <p>&copy; 2024 Agentic Author. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
