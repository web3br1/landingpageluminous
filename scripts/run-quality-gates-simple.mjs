#!/usr/bin/env node

/**
 * Simple Quality Gates Runner
 * Inline implementation for quick testing
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('🚀 Simple Quality Gates Runner\n');

// Quality gate configurations
const GATES = {
  typescript: {
    name: 'TypeScript Compilation',
    command: 'pnpm tsc --noEmit',
    required: true,
  },
  linting: {
    name: 'ESLint Checks',
    command: 'pnpm eslint . --max-warnings 0',
    required: true,
  },
  bundleCheck: {
    name: 'Bundle Budget Check',
    command: 'pnpm bundle:check',
    required: false,
  },
};

async function runQualityGates() {
  const results = [];
  let allPassed = true;

  for (const [key, gate] of Object.entries(GATES)) {
    console.log(`📋 Running: ${gate.name}`);

    const startTime = Date.now();

    try {
      execSync(gate.command, {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 60000,
      });
      const duration = Date.now() - startTime;

      console.log(`✅ ${gate.name} passed in ${duration}ms\n`);
      results.push({ gate: key, name: gate.name, success: true, duration, required: gate.required });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ ${gate.name} failed in ${duration}ms`);
      console.log(`   Error: ${error.message}\n`);

      results.push({
        gate: key,
        name: gate.name,
        success: false,
        duration,
        error: error.message,
        required: gate.required
      });

      if (gate.required) {
        allPassed = false;
      }
    }
  }

  // Generate summary
  console.log('='.repeat(60));
  console.log('📊 QUALITY GATES SUMMARY');
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
}

runQualityGates().catch(error => {
  console.error('Script execution failed:', error);
  process.exit(1);
});
