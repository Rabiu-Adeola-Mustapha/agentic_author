'use client';

import Link from 'next/link';
import { SubscriptionPlan } from '@/types';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface UsageStatsProps {
  dailyCount: number;
  plan: SubscriptionPlan;
}

export function UsageStats({ dailyCount, plan }: UsageStatsProps) {
  const FREE_LIMIT = 2;
  const isFree = plan === 'free';
  const isAtLimit = isFree && dailyCount >= FREE_LIMIT;
  
  const progressValue = isFree ? Math.min((dailyCount / FREE_LIMIT) * 100, 100) : 100;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-100">Daily Generations</h3>
        {isAtLimit && (
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-400">
            Limit reached
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Progress 
          value={progressValue} 
          className={cn(
            "h-2",
            isAtLimit ? "bg-red-950 [&>div]:bg-red-500" : "[&>div]:bg-indigo-500"
          )}
        />
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">
            {isFree ? `${dailyCount} / ${FREE_LIMIT}` : `${dailyCount} / ∞`}
          </span>
          {isFree && (
            <Link 
              href="/billing" 
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Upgrade to Pro
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
