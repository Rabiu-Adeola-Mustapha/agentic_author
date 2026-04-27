#!/usr/bin/env ts-node
/**
 * Script to analyze logging and AI usage
 * Usage: npx ts-node scripts/analyze-logs.ts [--save]
 */

import LogAnalyzer from '../lib/log-analyzer';

async function main() {
  const analyzer = new LogAnalyzer();
  const saveReport = process.argv.includes('--save');

  console.log('Analyzing logs...\n');

  try {
    await analyzer.printReport();

    if (saveReport) {
      await analyzer.saveReport();
    }
  } catch (error) {
    console.error('Error analyzing logs:', error);
    process.exit(1);
  }
}

main();
