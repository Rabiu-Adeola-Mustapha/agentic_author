import fs from 'fs';
import path from 'path';
import readline from 'readline';

interface LogEntry {
  timestamp?: string;
  level?: string;
  message?: string;
  agent?: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUSD?: number;
  duration?: number;
  toolCalls?: number;
  success?: boolean;
  error?: string;
}

/**
 * Analyze AI usage logs and generate statistics
 */
export class LogAnalyzer {
  private logsDir: string;

  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs');
  }

  /**
   * Read and parse AI usage log file
   */
  async analyzeAIUsage(): Promise<{
    totalCalls: number;
    totalTokens: number;
    totalCost: number;
    averageTokensPerCall: number;
    averageCostPerCall: number;
    modelBreakdown: Record<string, { calls: number; tokens: number; cost: number }>;
    agentBreakdown: Record<string, { calls: number; tokens: number; cost: number }>;
    topCostlyAgents: Array<{ agent: string; cost: number; calls: number }>;
  }> {
    const logFile = path.join(this.logsDir, 'ai-usage.log');

    if (!fs.existsSync(logFile)) {
      return {
        totalCalls: 0,
        totalTokens: 0,
        totalCost: 0,
        averageTokensPerCall: 0,
        averageCostPerCall: 0,
        modelBreakdown: {},
        agentBreakdown: {},
        topCostlyAgents: [],
      };
    }

    const fileStream = fs.createReadStream(logFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let totalCalls = 0;
    let totalTokens = 0;
    let totalCost = 0;
    const modelBreakdown: Record<string, { calls: number; tokens: number; cost: number }> = {};
    const agentBreakdown: Record<string, { calls: number; tokens: number; cost: number }> = {};

    for await (const line of rl) {
      try {
        const entry: LogEntry = JSON.parse(line);

        if (entry.totalTokens === undefined) continue;

        totalCalls++;
        totalTokens += entry.totalTokens || 0;
        totalCost += entry.estimatedCostUSD || 0;

        // Model breakdown
        if (entry.model) {
          if (!modelBreakdown[entry.model]) {
            modelBreakdown[entry.model] = { calls: 0, tokens: 0, cost: 0 };
          }
          modelBreakdown[entry.model].calls++;
          modelBreakdown[entry.model].tokens += entry.totalTokens || 0;
          modelBreakdown[entry.model].cost += entry.estimatedCostUSD || 0;
        }

        // Agent breakdown
        if (entry.agent) {
          if (!agentBreakdown[entry.agent]) {
            agentBreakdown[entry.agent] = { calls: 0, tokens: 0, cost: 0 };
          }
          agentBreakdown[entry.agent].calls++;
          agentBreakdown[entry.agent].tokens += entry.totalTokens || 0;
          agentBreakdown[entry.agent].cost += entry.estimatedCostUSD || 0;
        }
      } catch (error) {
        // Skip non-JSON lines
      }
    }

    // Find top costly agents
    const topCostlyAgents = Object.entries(agentBreakdown)
      .map(([agent, data]) => ({
        agent,
        cost: data.cost,
        calls: data.calls,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    return {
      totalCalls,
      totalTokens,
      totalCost: parseFloat(totalCost.toFixed(6)),
      averageTokensPerCall: Math.round(totalTokens / (totalCalls || 1)),
      averageCostPerCall: parseFloat((totalCost / (totalCalls || 1)).toFixed(6)),
      modelBreakdown,
      agentBreakdown,
      topCostlyAgents,
    };
  }

  /**
   * Get error statistics from error.log
   */
  async analyzeErrors(): Promise<{
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: string[];
  }> {
    const logFile = path.join(this.logsDir, 'error.log');

    if (!fs.existsSync(logFile)) {
      return {
        totalErrors: 0,
        errorsByType: {},
        recentErrors: [],
      };
    }

    const fileStream = fs.createReadStream(logFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let totalErrors = 0;
    const errorsByType: Record<string, number> = {};
    const recentErrors: string[] = [];

    for await (const line of rl) {
      if (line.includes('[ERROR]')) {
        totalErrors++;
        const match = line.match(/\[(.*?)\]/);
        if (match && match[1]) {
          errorsByType[match[1]] = (errorsByType[match[1]] || 0) + 1;
        }
        if (recentErrors.length < 5) {
          recentErrors.push(line);
        }
      }
    }

    return {
      totalErrors,
      errorsByType,
      recentErrors,
    };
  }

  /**
   * Generate a human-readable report
   */
  async generateReport(): Promise<string> {
    const aiUsage = await this.analyzeAIUsage();
    const errors = await this.analyzeErrors();

    const report = `
===========================================
        AI USAGE & LOGGING REPORT
===========================================

AI METRICS:
-----------
Total API Calls: ${aiUsage.totalCalls}
Total Tokens Used: ${aiUsage.totalTokens.toLocaleString()}
Total Estimated Cost: $${aiUsage.totalCost.toFixed(6)}
Average Tokens/Call: ${aiUsage.averageTokensPerCall}
Average Cost/Call: $${aiUsage.averageCostPerCall.toFixed(6)}

MODEL BREAKDOWN:
----------------
${Object.entries(aiUsage.modelBreakdown)
  .map(
    ([model, data]) => `
${model}:
  Calls: ${data.calls}
  Tokens: ${data.tokens.toLocaleString()}
  Cost: $${data.cost.toFixed(6)}
`
  )
  .join('')}

TOP AGENTS BY COST:
-------------------
${aiUsage.topCostlyAgents
  .map(
    (agent, idx) => `
${idx + 1}. ${agent.agent}
   Cost: $${agent.cost.toFixed(6)}
   Calls: ${agent.calls}
`
  )
  .join('')}

ERROR STATISTICS:
-----------------
Total Errors: ${errors.totalErrors}

Error Types:
${Object.entries(errors.errorsByType)
  .map(([type, count]) => `  ${type}: ${count}`)
  .join('\n')}

Recent Errors:
${errors.recentErrors.slice(0, 3).map((err) => `  ${err}`).join('\n')}

===========================================
`;

    return report;
  }

  /**
   * Print report to console
   */
  async printReport(): Promise<void> {
    const report = await this.generateReport();
    console.log(report);
  }

  /**
   * Save report to file
   */
  async saveReport(filename = 'log-report.txt'): Promise<void> {
    const report = await this.generateReport();
    const filepath = path.join(this.logsDir, filename);
    fs.writeFileSync(filepath, report);
    console.log(`Report saved to ${filepath}`);
  }
}

// CLI usage
if (require.main === module) {
  const analyzer = new LogAnalyzer();
  analyzer.printReport().catch(console.error);
}

export default LogAnalyzer;
