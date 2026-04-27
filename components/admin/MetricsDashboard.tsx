'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';

interface MetricsData {
  timestamp: string;
  session: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    totalTokens: number;
    totalCost: number;
    averageTokensPerCall: number;
    averageCostPerCall: number;
  };
  allTime: {
    totalCalls: number;
    totalTokens: number;
    totalCost: number;
    averageTokensPerCall: number;
    averageCostPerCall: number;
    modelBreakdown: Record<string, { calls: number; tokens: number; cost: number }>;
    agentBreakdown: Record<string, { calls: number; tokens: number; cost: number }>;
    topCostlyAgents: Array<{ agent: string; cost: number; calls: number }>;
  };
  errors: {
    totalErrors: number;
    errorsByType: Record<string, number>;
  };
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/metrics');

      if (!res.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await res.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const resetMetrics = async () => {
    if (!confirm('Reset session metrics? This cannot be undone.')) return;

    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/metrics', { method: 'POST' });

      if (!res.ok) {
        throw new Error('Failed to reset metrics');
      }

      await fetchMetrics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <h2 className="text-2xl font-bold">Metrics & Monitoring</h2>
        <p className="text-zinc-400">Loading metrics...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-8 space-y-4">
        <h2 className="text-2xl font-bold">Metrics & Monitoring</h2>
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-400">{error || 'Failed to load metrics'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const successRate = metrics.session.totalCalls > 0
    ? Math.round((metrics.session.successfulCalls / metrics.session.totalCalls) * 100)
    : 0;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Metrics & Monitoring</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Last updated: {new Date(metrics.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {process.env.NODE_ENV !== 'production' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={resetMetrics}
              disabled={refreshing}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Session Metrics */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          <h3 className="text-xl font-semibold">Current Session</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-sm">Total API Calls</p>
              <p className="text-3xl font-bold mt-2">{metrics.session.totalCalls}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-sm">Success Rate</p>
              <p className="text-3xl font-bold mt-2">{successRate}%</p>
              <p className="text-xs text-zinc-500 mt-1">
                {metrics.session.successfulCalls}/{metrics.session.totalCalls}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-sm">Total Tokens</p>
              <p className="text-3xl font-bold mt-2">
                {(metrics.session.totalTokens / 1000).toFixed(1)}K
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-sm">Estimated Cost</p>
              <p className="text-3xl font-bold mt-2">
                ${metrics.session.totalCost.toFixed(4)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Avg: ${metrics.session.averageCostPerCall.toFixed(4)}/call
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* All-Time Metrics */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">All-Time Statistics</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-sm">Total API Calls</p>
              <p className="text-3xl font-bold mt-2">{metrics.allTime.totalCalls}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-sm">Total Tokens</p>
              <p className="text-3xl font-bold mt-2">
                {(metrics.allTime.totalTokens / 1000000).toFixed(2)}M
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-sm">Total Cost</p>
              <p className="text-3xl font-bold mt-2">
                ${metrics.allTime.totalCost.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-sm">Avg Cost/Call</p>
              <p className="text-3xl font-bold mt-2">
                ${metrics.allTime.averageCostPerCall.toFixed(4)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Model Breakdown */}
      {Object.keys(metrics.allTime.modelBreakdown).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Model Breakdown</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(metrics.allTime.modelBreakdown).map(([model, data]) => (
              <Card key={model}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{model}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Calls</span>
                      <span className="font-semibold">{data.calls}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Tokens</span>
                      <span className="font-semibold">{(data.tokens / 1000).toFixed(1)}K</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Cost</span>
                      <span className="font-semibold text-green-400">
                        ${data.cost.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Top Costly Agents */}
      {metrics.allTime.topCostlyAgents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Top Agents by Cost</h3>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {metrics.allTime.topCostlyAgents.map((agent, idx) => (
                  <div key={agent.agent} className="flex items-center justify-between pb-4 border-b last:pb-0 last:border-b-0">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center rounded-full p-0">
                        {idx + 1}
                      </Badge>
                      <div>
                        <p className="font-semibold">{agent.agent}</p>
                        <p className="text-xs text-zinc-400">{agent.calls} calls</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-green-400">
                      ${agent.cost.toFixed(4)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Statistics */}
      {metrics.errors.totalErrors > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Error Statistics</h3>

          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-semibold">Total Errors</p>
                    <p className="text-2xl font-bold text-red-400">
                      {metrics.errors.totalErrors}
                    </p>
                  </div>
                </div>

                {Object.keys(metrics.errors.errorsByType).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-red-500/20 space-y-2">
                    <p className="text-sm text-zinc-400">Error Types:</p>
                    {Object.entries(metrics.errors.errorsByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="text-zinc-400">{type}</span>
                        <span className="font-semibold text-red-400">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
