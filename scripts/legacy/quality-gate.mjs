#!/usr/bin/env node

/**
 * STATUS: LEGACY
 * NÃO USAR EM PRODUÇÃO
 * SUBSTITUÍDO POR ../official/quality-gate.mjs
 * OWNER: Quality Team
 * DATA DE QUARENTENA: 2025-10-31
 *
 * Original: Quality Gate Script
 * Runs comprehensive quality checks before deployment
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🚀 Starting Quality Gate Checks...\n');

// Quality gate configuration
const GATES = {
  typescript: {
    name: 'TypeScript Compilation',
    command: 'pnpm tsc --noEmit',
    required: true,
    timeout: 60000
  },
  linting: {
    name: 'ESLint Checks',
    command: 'pnpm eslint . --max-warnings 0',
    required: true,
    timeout: 60000
  },
  unitTests: {
    name: 'Unit Tests',
    command: 'pnpm test:vitest:unit',
    required: true,
    timeout: 120000,
    minCoverage: 70
  },
  contractTests: {
    name: 'Contract Tests',
    command: 'npx vitest run tests/contract/ --reporter=json',
    required: true,
    timeout: 60000
  },
  e2eTests: {
    name: 'E2E Tests (Fast)',
    command: 'pnpm test:fast',
    required: false, // Optional for now
    timeout: 180000
  },
  bundleAnalysis: {
    name: 'Bundle Analysis',
    command: 'pnpm bundle:check',
    required: true,
    timeout: 60000
  },
  lighthouse: {
    name: 'Lighthouse Performance',
    command: 'lhci autorun --config=lighthouserc.json',
    required: false, // Optional for development
    timeout: 300000
  }
};

let allPassed = true;
const results = [];

function runCommand(gateName, command, timeout) {
  console.log(`📋 Running: ${gateName}`);
  const startTime = Date.now();

  try {
    const result = execSync(command, {
      cwd: rootDir,
      timeout,
      stdio: 'pipe',
      encoding: 'utf8'
    });

    const duration = Date.now() - startTime;
    console.log(`✅ ${gateName} passed in ${duration}ms\n`);
    return { success: true, duration, output: result };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ ${gateName} failed in ${duration}ms`);
    console.log(`   Error: ${error.message}\n`);
    return { success: false, duration, error: error.message };
  }
}

function checkTestCoverage() {
  console.log('📊 Checking Test Coverage...');

  try {
    // Check if coverage report exists
    const coveragePath = join(rootDir, 'coverage', 'coverage-summary.json');
    if (!existsSync(coveragePath)) {
      console.log('⚠️  Coverage report not found, running tests with coverage...\n');
      runCommand('Coverage Generation', 'pnpm test:coverage', 180000);
    }

    if (existsSync(coveragePath)) {
      const coverage = JSON.parse(readFileSync(coveragePath, 'utf8'));
      const totalCoverage = coverage.total.lines.pct;

      console.log(`📈 Total Coverage: ${totalCoverage}%`);

      if (totalCoverage >= 70) {
        console.log('✅ Coverage meets minimum requirement (70%)\n');
        return { success: true, coverage: totalCoverage };
      } else {
        console.log(`❌ Coverage below minimum requirement (70%)\n`);
        return { success: false, coverage: totalCoverage };
      }
    } else {
      console.log('⚠️  Could not determine coverage\n');
      return { success: false, error: 'Coverage report not available' };
    }
  } catch (error) {
    console.log(`❌ Coverage check failed: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

// Run all quality gates
for (const [key, gate] of Object.entries(GATES)) {
  if (gate.required || process.env.RUN_ALL_GATES === 'true') {
    const result = runCommand(gate.name, gate.command, gate.timeout);
    results.push({
      gate: key,
      name: gate.name,
      ...result,
      required: gate.required
    });

    if (!result.success && gate.required) {
      allPassed = false;
    }
  }
}

// Check test coverage separately
const coverageResult = checkTestCoverage();
results.push({
  gate: 'coverage',
  name: 'Test Coverage',
  ...coverageResult,
  required: true
});

if (!coverageResult.success) {
  allPassed = false;
}

// Generate summary
console.log('='.repeat(60));
console.log('📊 QUALITY GATE SUMMARY');
console.log('='.repeat(60));

let requiredFailed = 0;
let optionalFailed = 0;

for (const result of results) {
  const status = result.success ? '✅' : '❌';
  const required = result.required ? '[REQUIRED]' : '[OPTIONAL]';
  console.log(`${status} ${result.name} ${required} - ${result.duration || 0}ms`);

  if (!result.success) {
    if (result.required) {
      requiredFailed++;
    } else {
      optionalFailed++;
    }
  }
}

console.log('\n' + '='.repeat(60));

if (allPassed) {
  console.log('🎉 ALL QUALITY GATES PASSED!');
  console.log('🚀 Ready for deployment');
  process.exit(0);
} else {
  console.log(`💥 QUALITY GATES FAILED!`);
  console.log(`   Required failures: ${requiredFailed}`);
  console.log(`   Optional failures: ${optionalFailed}`);
  console.log('\n🔧 Please fix the failed checks before deploying');

  // Show detailed errors for failed required gates
  console.log('\n📋 FAILED CHECKS DETAILS:');
  for (const result of results) {
    if (!result.success && result.required) {
      console.log(`\n❌ ${result.name}:`);
      if (result.error) {
        console.log(`   ${result.error}`);
      }
    }
  }

  process.exit(1);
}
