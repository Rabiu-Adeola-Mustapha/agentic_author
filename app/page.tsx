'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LandingNavbar } from '@/components/shared/LandingNavbar';
import { Footer } from '@/components/shared/Footer';
import { CheckCircle2, XCircle, Zap, Rocket, BookOpen, Clapperboard, FileText, Newspaper, GraduationCap } from 'lucide-react';

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

const stats = [
  { number: '7', label: 'Content Categories' },
  { number: '60K+', label: 'Words Per Project' },
  { number: '6', label: 'Step AI Pipeline' },
];

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <LandingNavbar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <Badge className="mb-6 bg-indigo-950 text-indigo-300 border border-indigo-500/30">
            ✨ AI-Powered Long-Form Content Generation
          </Badge>

          <h1 className="text-5xl md:text-7xl font-sora font-bold mb-6 bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-200 bg-clip-text text-transparent">
            Write anything.
            <br />
            Research everything.
            <br />
            Publish with confidence.
          </h1>

          <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Multi-agent AI pipeline for generating long-form content across seven categories.
            From books to screenplays, theses, articles, educational content, and social media.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            {session ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                  Go to Dashboard <Rocket className="ml-2 w-4 h-4" />
                </Button>
              </Link>
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

      {/* Stats Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat, i) => (
            <div key={i}>
              <p className="text-4xl md:text-5xl font-sora font-bold text-indigo-400 mb-2">
                {stat.number}
              </p>
              <p className="text-zinc-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories / Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-sora font-bold mb-4">What can you create?</h2>
          <p className="text-zinc-400">Choose from five powerful content categories</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Object.entries(CATEGORY_CONFIG) as [ContentCategory, typeof CATEGORY_CONFIG[ContentCategory]][]).map(([key, cat]) => (
            <Card key={key} className="group hover:border-indigo-600 hover:bg-zinc-900/50 transition-all border-l-4 border-l-transparent hover:border-l-indigo-600">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-indigo-950 flex items-center justify-center text-2xl mb-4 group-hover:bg-indigo-900 transition-colors">
                  {cat.icon}
                </div>
                <CardTitle className="text-xl">{cat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">{cat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-sora font-bold mb-4">How it works</h2>
          <p className="text-zinc-400">Six intelligent steps to create amazing content</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step) => (
            <Card key={step.number} className="hover:border-indigo-600/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-sora font-bold text-sm">
                    {step.number}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-400">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-sora font-bold mb-4">Simple pricing</h2>
          <p className="text-zinc-400">Choose the perfect plan for your needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <Card className="border-zinc-700 hover:border-zinc-600 transition-colors">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Get started with limited generations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-4xl font-bold">$0</div>
                <p className="text-sm text-zinc-400">/month</p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">2 generations per day</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Up to 3,000 words per project</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Web search research</span>
                </li>
                <li className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-zinc-400">No PDF/DOCX export</span>
                </li>
              </ul>

              <Link href="/signup">
                <Button className="w-full" variant="outline">Get Started</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-indigo-600 bg-gradient-to-br from-zinc-900 to-indigo-950 hover:border-indigo-500 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between mb-3">
                <CardTitle>Pro</CardTitle>
                <Badge className="bg-indigo-600">Popular</Badge>
              </div>
              <CardDescription>Unlimited content creation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-4xl font-bold">₦50,000</div>
                <p className="text-sm text-zinc-400">/month</p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Unlimited generations</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Up to 60,000 words per project</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Advanced web research</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">PDF & DOCX export</span>
                </li>
              </ul>

              <Link href="/signup">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Upgrade to Pro</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-zinc-900 border border-indigo-500/20 p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-transparent opacity-50"></div>

          <div className="relative">
            <h2 className="text-4xl font-sora font-bold mb-4">Ready to start writing?</h2>
            <p className="text-lg text-zinc-300 mb-8">
              Create your first document in minutes. No credit card required.
            </p>

            {!session && (
              <Link href="/signup">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                  Create Free Account <Rocket className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
