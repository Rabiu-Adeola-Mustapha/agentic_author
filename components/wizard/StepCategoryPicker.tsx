'use client';

import { useWizardStore } from '@/store/wizard.store';
import { CATEGORY_CONFIG } from '@/lib/config/category-config';
import { ContentCategory } from '@/types';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_EXAMPLES: Record<ContentCategory, string[]> = {
  book: ['Sci-fi thriller about a rogue AI', 'Memoir of growing up in Lagos', 'A guide to modern investing'],
  screenplay: ['Action movie in a cyberpunk city', 'Romantic comedy set in a bakery', 'A documentary about street food'],
  thesis: ['Impact of microfinance in rural areas', 'Machine learning in early cancer detection', 'Post-colonial themes in 20th century literature'],
  journal: ['Review of recent CRISPR advancements', 'Case study on urban heat islands', 'Economic analysis of universal basic income'],
  educational: ['Introduction to Python programming', 'A guide to Renaissance art history', 'Financial literacy for high schoolers'],
  article: ['Top 10 travel destinations for 2025', 'How to negotiate your salary', 'The rise of remote work culture'],
  social_media: ['A Twitter thread on productivity hacks', 'An engaging LinkedIn post about leadership', 'Instagram captions for a product launch'],
};

export function StepCategoryPicker() {
  const category = useWizardStore((state) => state.category);
  const setCategory = useWizardStore((state) => state.setCategory);

  const categories = Object.entries(CATEGORY_CONFIG) as [ContentCategory, typeof CATEGORY_CONFIG[ContentCategory]][];

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="mb-6">
        <h2 className="font-sora text-2xl font-bold text-zinc-100">What are you writing?</h2>
        <p className="mt-2 text-zinc-400">Select a content format to tailor the generation pipeline.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map(([key, config]) => {
          const isSelected = category === key;

          return (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={cn(
                'relative flex flex-col items-start rounded-xl border p-5 text-left transition-all duration-150',
                isSelected
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
              )}
            >
              {isSelected && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm">
                  <Check className="h-4 w-4" />
                </div>
              )}
              
              <span className="mb-3 text-4xl">{config.icon}</span>
              
              <h3 className="font-sora mb-1 text-lg font-semibold text-zinc-100">
                {config.label}
              </h3>
              
              <p className="mb-4 text-sm text-zinc-400 line-clamp-2">
                {config.description}
              </p>

              <div className="mt-auto w-full rounded-md bg-zinc-950/50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Examples
                </p>
                <ul className="space-y-1.5">
                  {CATEGORY_EXAMPLES[key].map((example, i) => (
                    <li key={i} className="flex items-start text-xs text-zinc-400">
                      <span className="mr-2 text-zinc-600">•</span>
                      <span className="line-clamp-1">{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
