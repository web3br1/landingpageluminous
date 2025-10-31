#!/usr/bin/env node

/**
 * STATUS: LEGACY
 * NÃO USAR EM PRODUÇÃO
 * SUBSTITUÍDO POR ../official/ci-gate.mjs
 * OWNER: Quality Team
 * DATA DE QUARENTENA: 2025-10-31
 *
 * Original:  * Run Quality Gates Script
 * CLI tool to execute quality gates for CI/CD
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

async function main() {
  console.log('🚀 Quality Gates Runner\n');

  try {
    // Dynamic import to avoid module resolution issues
    const { QualityGateRunner } = await import('../lib/quality-gates/runner.ts');

    // Get PR data from environment or arguments
    const prData = getPRData();

    // Run quality gates
    const runner = new QualityGateRunner();
    const results = await runner.runAllGates(prData);
    const report = await runner.generateReport(prData, results);

    // Output results
    console.log('\n📊 QUALITY GATES REPORT');
    console.log('='.repeat(50));

    console.log(`Overall Status: ${report.overall.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Score: ${report.overall.score}/100`);
    console.log(`Duration: ${report.overall.duration}ms`);
    console.log(`Gates Run: ${results.length}`);

    console.log('\n📋 GATE RESULTS:');
    report.gates.forEach(gate => {
      const status = gate.success ? '✅' : '❌';
      const required = gate.required ? '[REQUIRED]' : '[OPTIONAL]';
      console.log(`${status} ${gate.name} ${required} - ${gate.duration}ms`);
    });

    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => console.log(`• ${rec}`));
    }

    if (report.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      report.criticalIssues.forEach(issue => console.log(`• ${issue}`));
    }

    // Exit with appropriate code
    process.exit(report.overall.passed ? 0 : 1);

  } catch (error) {
    console.error('💥 Quality Gates execution failed:', error.message);
    process.exit(1);
  }
}

function getPRData() {
  // Get PR data from environment variables or git
  const prId = process.env.PR_NUMBER || process.env.GITHUB_PR_NUMBER || 'local';
  const branch = process.env.GITHUB_HEAD_REF || 'local-branch';
  const baseBranch = process.env.GITHUB_BASE_REF || 'main';
  const author = process.env.GITHUB_ACTOR || 'local-user';
  const commitSha = process.env.GITHUB_SHA || 'local-commit';

  // Get changed files
  let files = [];
  try {
    const output = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' });
    files = output.trim().split('\n').filter(Boolean);
  } catch {
    files = ['package.json', 'lib/quality-gates/']; // Fallback
  }

  // Calculate basic metrics
  const changedLines = files.reduce((sum, file) => {
    try {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      return sum + content.split('\n').length;
    } catch {
      return sum;
    }
  }, 0);

  return {
    id: prId,
    title: `PR #${prId}`,
    author,
    branch,
    baseBranch,
    files,
    changedLines,
    commitSha,
    repository: process.env.GITHUB_REPOSITORY || 'landing-page',
  };
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(error => {
  console.error('Script execution failed:', error);
  process.exit(1);
});

