#!/usr/bin/env node

/**
 * Automated Quality Orchestrator
 * Executes complete quality pipeline with intelligent timeouts and reporting
 */

import { SafeCommandRunner } from './safe-command-runner.mjs';

// Quality pipeline configuration
const QUALITY_PIPELINE = {
  // Phase 1: Fast checks (parallel execution)
  fast: [
    {
      name: 'TypeScript Compilation',
      command: 'npx tsc --noEmit',
      timeout: 45000,
      description: 'TypeScript compilation check',
      critical: true
    },
    {
      name: 'ESLint Code Quality',
      command: 'npx eslint . --max-warnings 0',
      timeout: 45000,
      description: 'ESLint code quality check',
      critical: true
    }
  ],

  // Phase 2: Build checks (sequential)
  build: [
    {
      name: 'Production Build',
      command: 'npm run build',
      timeout: 120000,
      description: 'Production build verification',
      critical: true
    }
  ],

  // Phase 3: Test execution (parallel)
  test: [
    {
      name: 'Unit Tests',
      command: 'npm test',
      timeout: 90000,
      description: 'Unit test execution',
      critical: true
    },
    {
      name: 'Critical Tests',
      command: 'vitest run tests/unit/ tests/lib/ tests/utils/',
      timeout: 120000,
      description: 'Critical test execution',
      critical: true
    }
  ],

  // Phase 4: Coverage analysis (optional)
  coverage: [
    {
      name: 'Coverage Analysis',
      command: 'npm run test:coverage',
      timeout: 180000,
      description: 'Test coverage analysis',
      critical: false
    }
  ]
};

class QualityOrchestrator {
  constructor() {
    this.runner = new SafeCommandRunner();
    this.results = {
      startTime: null,
      endTime: null,
      phases: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      }
    };
  }

  async runPipeline(options = {}) {
    const {
      parallelFast = true,
      skipCoverage = false,
      failFast = false,
      verbose = true
    } = options;

    console.log('🚀 Starting Automated Quality Pipeline\n');
    console.log('=' .repeat(50));

    this.results.startTime = Date.now();

    try {
      // Phase 1: Fast checks
      await this.runPhase('fast', QUALITY_PIPELINE.fast, {
        parallel: parallelFast,
        failFast,
        verbose
      });

      // Check if we should continue after fast checks
      if (failFast && this.results.phases.fast.failed > 0) {
        throw new Error('Fast checks failed, stopping pipeline (fail-fast enabled)');
      }

      // Phase 2: Build checks
      await this.runPhase('build', QUALITY_PIPELINE.build, {
        parallel: false,
        failFast,
        verbose
      });

      // Phase 3: Test execution
      await this.runPhase('test', QUALITY_PIPELINE.test, {
        parallel: true,
        failFast,
        verbose
      });

      // Phase 4: Coverage (optional)
      if (!skipCoverage) {
        await this.runPhase('coverage', QUALITY_PIPELINE.coverage, {
          parallel: false,
          failFast: false, // Coverage failures don't stop pipeline
          verbose
        });
      }

      this.generateReport();

    } catch (error) {
      console.error(`\n💥 Pipeline failed: ${error.message}`);
      this.results.summary.failed++;
      this.generateReport();
      throw error;
    }
  }

  async runPhase(phaseName, checks, options = {}) {
    const { parallel = false, failFast = false, verbose = true } = options;

    if (verbose) {
      console.log(`\n📋 Phase: ${phaseName.toUpperCase()}`);
      console.log('-'.repeat(30));
    }

    this.results.phases[phaseName] = {
      checks: checks.length,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      results: []
    };

    const phaseStart = Date.now();

    if (parallel) {
      // Run checks in parallel
      const promises = checks.map(check => this.runCheck(check, phaseName, verbose));
      const results = await Promise.allSettled(promises);

      results.forEach((result, index) => {
        this.processCheckResult(result, checks[index], phaseName, failFast);
      });
    } else {
      // Run checks sequentially
      for (const check of checks) {
        try {
          const result = await this.runCheck(check, phaseName, verbose);
          this.processCheckResult({ status: 'fulfilled', value: result }, check, phaseName, failFast);
        } catch (error) {
          this.processCheckResult({ status: 'rejected', reason: error }, check, phaseName, failFast);
        }
      }
    }

    this.results.phases[phaseName].duration = Date.now() - phaseStart;

    if (verbose) {
      const phase = this.results.phases[phaseName];
      console.log(`\n📊 ${phaseName.toUpperCase()} Phase Complete:`);
      console.log(`   ✅ Passed: ${phase.passed}`);
      console.log(`   ❌ Failed: ${phase.failed}`);
      console.log(`   ⏱️  Duration: ${(phase.duration / 1000).toFixed(2)}s`);
    }
  }

  async runCheck(check, phaseName, verbose) {
    const startTime = Date.now();

    if (verbose) {
      console.log(`🔍 Running: ${check.name}`);
    }

    try {
      const result = await this.runner.run(check.command, {
        timeout: check.timeout,
        description: check.description,
        retryCount: check.critical ? 1 : 0,
        retryDelay: 2000
      });

      const duration = Date.now() - startTime;

      return {
        ...check,
        status: 'passed',
        duration,
        result
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      throw {
        ...check,
        status: 'failed',
        duration,
        error: error.message
      };
    }
  }

  processCheckResult(promiseResult, check, phaseName, failFast) {
    const phase = this.results.phases[phaseName];
    this.results.summary.total++;

    if (promiseResult.status === 'fulfilled') {
      phase.passed++;
      this.results.summary.passed++;
      phase.results.push({
        ...check,
        status: 'passed',
        duration: promiseResult.value.duration
      });
    } else {
      phase.failed++;
      this.results.summary.failed++;
      phase.results.push({
        ...check,
        status: 'failed',
        error: promiseResult.reason?.error || promiseResult.reason?.message || 'Unknown error',
        duration: promiseResult.reason?.duration || 0
      });

      if (failFast && check.critical) {
        throw new Error(`Critical check failed: ${check.name}`);
      }
    }
  }

  generateReport() {
    this.results.endTime = Date.now();
    this.results.summary.duration = this.results.endTime - this.results.startTime;

    console.log('\n' + '='.repeat(60));
    console.log('🎯 QUALITY PIPELINE EXECUTION REPORT');
    console.log('='.repeat(60));

    // Phase summaries
    Object.entries(this.results.phases).forEach(([phaseName, phase]) => {
      console.log(`\n📋 ${phaseName.toUpperCase()} PHASE:`);
      console.log(`   Checks: ${phase.checks}`);
      console.log(`   ✅ Passed: ${phase.passed}`);
      console.log(`   ❌ Failed: ${phase.failed}`);
      console.log(`   ⏱️  Duration: ${(phase.duration / 1000).toFixed(2)}s`);

      // Show failed checks
      const failed = phase.results.filter(r => r.status === 'failed');
      if (failed.length > 0) {
        console.log(`   🚨 Failed checks:`);
        failed.forEach(check => {
          console.log(`      - ${check.name}: ${check.error}`);
        });
      }
    });

    // Overall summary
    console.log('\n🏆 OVERALL SUMMARY:');
    console.log(`   Total Checks: ${this.results.summary.total}`);
    console.log(`   ✅ Passed: ${this.results.summary.passed}`);
    console.log(`   ❌ Failed: ${this.results.summary.failed}`);
    console.log(`   ⏱️  Total Duration: ${(this.results.summary.duration / 1000).toFixed(2)}s`);

    // Success rate
    const successRate = (this.results.summary.passed / this.results.summary.total * 100).toFixed(1);
    console.log(`   📊 Success Rate: ${successRate}%`);

    // Final status
    if (this.results.summary.failed === 0) {
      console.log('\n🎉 ALL QUALITY GATES PASSED! Pipeline successful.');
    } else {
      console.log(`\n💥 QUALITY PIPELINE FAILED: ${this.results.summary.failed} checks failed.`);
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const orchestrator = new QualityOrchestrator();

  // Parse CLI options
  const options = {};
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--sequential':
        options.parallelFast = false;
        break;
      case '--skip-coverage':
        options.skipCoverage = true;
        break;
      case '--fail-fast':
        options.failFast = true;
        break;
      case '--quiet':
        options.verbose = false;
        break;
    }
  }

  try {
    await orchestrator.runPipeline(options);
    process.exit(0);
  } catch (error) {
    console.error(`\n💥 Quality pipeline failed: ${error.message}`);
    process.exit(1);
  }
}

// Export for use as module
export { QualityOrchestrator };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
