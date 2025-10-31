#!/usr/bin/env node

/**
 * STATUS: LEGACY
 * NÃO USAR EM PRODUÇÃO
 * SUBSTITUÍDO POR ../official/ci-gate.mjs
 * OWNER: Quality Team
 * DATA DE QUARENTENA: 2025-10-31
 *
 * Original:  * CI Quality Gate Checker
 * Validates all quality gates before deployment
 * Mirrors GitHub Actions CI pipeline locally
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚦 CI Quality Gate Checker - Starting...\n');

const qualityGates = [
  {
    name: 'TypeScript Compilation',
    command: 'npx tsc --noEmit',
    check: (output) => {
      const errorCount = (output.match(/error/g) || []).length;
      return {
        passed: errorCount === 0,
        score: Math.max(0, 100 - (errorCount * 10)),
        details: `${errorCount} TypeScript errors`
      };
    },
    required: true,
    timeout: 60000
  },
  {
    name: 'ESLint Code Quality',
    command: 'npx eslint . --max-warnings 0',
    check: (output) => {
      const errorCount = (output.match(/✖/g) || []).length;
      const warningCount = (output.match(/⚠/g) || []).length;
      return {
        passed: errorCount === 0 && warningCount === 0,
        score: Math.max(0, 100 - (errorCount * 5) - (warningCount * 2)),
        details: `${errorCount} errors, ${warningCount} warnings`
      };
    },
    required: true,
    timeout: 120000
  },
  {
    name: 'Unit Tests',
    command: 'pnpm run test:unit -- --reporter=json',
    check: (output) => {
      try {
        const results = JSON.parse(output);
        const passed = results.testResults?.[0]?.assertionResults?.filter(r => r.status === 'passed').length || 0;
        const total = results.testResults?.[0]?.assertionResults?.length || 1;
        const passRate = (passed / total) * 100;

        return {
          passed: passRate >= 60,
          score: passRate,
          details: `${passed}/${total} tests passed (${passRate.toFixed(1)}%)`
        };
      } catch {
        return {
          passed: false,
          score: 0,
          details: 'Could not parse test results'
        };
      }
    },
    required: false,
    timeout: 300000
  },
  {
    name: 'Critical Tests',
    command: 'pnpm run test:crit -- --reporter=json',
    check: (output) => {
      try {
        const results = JSON.parse(output);
        const passed = results.testResults?.[0]?.assertionResults?.filter(r => r.status === 'passed').length || 0;
        const total = results.testResults?.[0]?.assertionResults?.length || 1;
        const passRate = (passed / total) * 100;

        return {
          passed: passRate >= 80,
          score: passRate,
          details: `${passed}/${total} critical tests passed (${passRate.toFixed(1)}%)`
        };
      } catch {
        return {
          passed: false,
          score: 0,
          details: 'Could not parse critical test results'
        };
      }
    },
    required: true,
    timeout: 300000
  },
  {
    name: 'Production Build',
    command: 'pnpm run build',
    check: (output) => {
      const errorCount = (output.match(/error/g) || []).length;
      const hasBuildError = output.includes('Build failed') || output.includes('ERROR');
      return {
        passed: !hasBuildError && errorCount === 0,
        score: hasBuildError ? 0 : 100,
        details: hasBuildError ? 'Build failed' : 'Build successful'
      };
    },
    required: true,
    timeout: 300000
  }
];

async function runQualityGates() {
  console.log('🎯 Running Quality Gates...\n');

  const results = [];
  let overallPassed = true;
  let totalScore = 0;

  for (const gate of qualityGates) {
    console.log(`🔍 ${gate.name}...`);

    try {
      const output = execSync(gate.command, {
        encoding: 'utf8',
        timeout: gate.timeout,
        maxBuffer: 1024 * 1024 * 10, // 10MB
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const result = gate.check(output);
      result.name = gate.name;
      result.required = gate.required;

      if (result.passed) {
        console.log(`  ✅ PASSED - ${result.details} (${result.score.toFixed(1)}/100)`);
      } else {
        console.log(`  ❌ FAILED - ${result.details} (${result.score.toFixed(1)}/100)`);
        if (gate.required) {
          overallPassed = false;
        }
      }

      results.push(result);
      totalScore += result.score;

    } catch (error) {
      console.log(`  ❌ FAILED - ${error.message} (0/100)`);
      results.push({
        name: gate.name,
        passed: false,
        score: 0,
        details: error.message,
        required: gate.required
      });

      if (gate.required) {
        overallPassed = false;
      }
    }
  }

  const averageScore = totalScore / qualityGates.length;

  console.log('\n' + '='.repeat(60));
  console.log('🎯 QUALITY GATE SUMMARY');
  console.log('='.repeat(60));

  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    const required = result.required ? '(Required)' : '(Optional)';
    console.log(`${status} ${result.name} ${required}: ${result.score.toFixed(1)}/100 - ${result.details}`);
  });

  console.log('\n📊 Overall Score:', averageScore.toFixed(1) + '/100');

  if (overallPassed) {
    console.log('✅ ALL REQUIRED QUALITY GATES PASSED');
    console.log('🚀 Ready for deployment!');
  } else {
    console.log('❌ REQUIRED QUALITY GATES FAILED');
    console.log('🛑 Deployment blocked - please fix issues above');

    console.log('\n💡 Quick Fix Commands:');
    console.log('  • pnpm run lint --fix          # Auto-fix ESLint issues');
    console.log('  • npx tsc --noEmit             # Check TypeScript errors');
    console.log('  • pnpm run test:crit           # Run critical tests');
    console.log('  • pnpm run build               # Test production build');
  }

  // Save results
  const reportData = {
    timestamp: new Date().toISOString(),
    overallPassed,
    averageScore: averageScore.toFixed(1),
    results,
    version: process.env.npm_package_version || 'unknown'
  };

  // Ensure tmp directory exists
  if (!fs.existsSync('tmp')) {
    fs.mkdirSync('tmp');
  }

  fs.writeFileSync('tmp/ci-quality-gate-results.json', JSON.stringify(reportData, null, 2));

  console.log('\n💾 Results saved to: tmp/ci-quality-gate-results.json');

  // Generate badge URL for README
  const badgeColor = averageScore >= 90 ? 'brightgreen' :
                    averageScore >= 70 ? 'yellow' :
                    averageScore >= 50 ? 'orange' : 'red';

  console.log(`\n🏷️  Quality Badge: https://img.shields.io/badge/Code%20Quality-${averageScore.toFixed(0)}%2F100-${badgeColor}`);

  // Exit with appropriate code
  process.exit(overallPassed ? 0 : 1);
}

// Run quality gates
runQualityGates().catch(error => {
  console.error('❌ Quality gate check failed:', error.message);
  process.exit(1);
});

