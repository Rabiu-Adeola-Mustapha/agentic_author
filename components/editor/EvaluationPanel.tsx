'use client';

import { useState } from 'react';
import { SerializedEvaluation } from '@/types';
import { ChevronDown, ChevronUp, Lightbulb, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface EvaluationPanelProps {
  evaluation: SerializedEvaluation;
}

export function EvaluationPanel({ evaluation }: EvaluationPanelProps) {
  const [showIssues, setShowIssues] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { score, alignmentScore, qualityScore, issues, suggestions, passedThreshold } = evaluation;

  // Determine colors based on score
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-emerald-400';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreStrokeColor = (score: number) => {
    if (score >= 90) return '#10b981'; // emerald-500
    if (score >= 70) return '#34d399'; // emerald-400
    if (score >= 50) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  // SVG Circle calculations
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl overflow-hidden mt-6">
      {passedThreshold && (
        <div className="bg-emerald-500/10 px-6 py-3 border-b border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center justify-center">
          ✨ Your content passed the quality threshold
        </div>
      )}

      <div className="p-6 md:p-8">
        <h2 className="font-sora text-xl font-bold text-zinc-100 mb-8">Quality Evaluation</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Overall Score */}
          <div className="flex flex-col items-center justify-center p-4 border border-zinc-800 rounded-xl bg-zinc-900/50">
            <div className="relative w-32 h-32 flex items-center justify-center mb-2">
              {/* Background Circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-zinc-800"
                />
                {/* Progress Circle */}
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke={getScoreStrokeColor(score)}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className={cn("text-3xl font-sora font-bold", getScoreColor(score))}>
                  {score}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Out of 100</span>
              </div>
            </div>
            <span className={cn(
              "font-medium text-sm mt-2",
              passedThreshold ? "text-emerald-400" : "text-yellow-500"
            )}>
              {passedThreshold ? "Passed" : "Needs Work"}
            </span>
          </div>

          {/* Sub Scores */}
          <div className="md:col-span-2 flex flex-col justify-center space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-zinc-300">Topic Alignment</span>
                <span className="text-zinc-500">{alignmentScore}/100</span>
              </div>
              <Progress 
                value={alignmentScore} 
                className="h-2 bg-zinc-800" 
                indicatorClassName={getScoreBgColor(alignmentScore)} 
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-zinc-300">Writing Quality</span>
                <span className="text-zinc-500">{qualityScore}/100</span>
              </div>
              <Progress 
                value={qualityScore} 
                className="h-2 bg-zinc-800" 
                indicatorClassName={getScoreBgColor(qualityScore)} 
              />
            </div>
          </div>
        </div>

        {/* Issues List */}
        {issues && issues.length > 0 && (
          <div className="border-t border-zinc-800 pt-6">
            <button 
              onClick={() => setShowIssues(!showIssues)}
              className="flex w-full items-center justify-between font-medium text-zinc-100 hover:text-red-400 transition-colors"
            >
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Issues Found ({issues.length})
              </span>
              {showIssues ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {showIssues && (
              <ul className="mt-4 space-y-3 animate-in fade-in duration-200">
                {issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-zinc-400">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Suggestions List */}
        {suggestions && suggestions.length > 0 && (
          <div className="border-t border-zinc-800 pt-6 mt-6">
            <button 
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="flex w-full items-center justify-between font-medium text-zinc-100 hover:text-indigo-400 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-indigo-400" />
                Suggestions ({suggestions.length})
              </span>
              {showSuggestions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {showSuggestions && (
              <ul className="mt-4 space-y-3 animate-in fade-in duration-200">
                {suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
