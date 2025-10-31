#!/usr/bin/env node

/**
 * STATUS: LEGACY
 * NÃO USAR EM PRODUÇÃO
 * SUBSTITUÍDO POR ../official/ci-gate.mjs
 * OWNER: Quality Team
 * DATA DE QUARENTENA: 2025-10-31
 *
 * Original:  * CI Quality Gate Script v2 - M1→M2 Transition
 *
 * Comprehensive quality validation for CI/CD pipelines.
 * Runs all tests, coverage analysis, and maturity assessment.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class CIQualityGate {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.results = {
      tests: { passed: false, data: null },
      coverage: { passed: false, data: null },
      maturity: { passed: false, data: null },
      linting: { passed: false, data: null }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️ ',
      success: '✅',
      warning: '⚠️ ',
      error: '❌'
    }[type] || 'ℹ️ ';

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async run() {
    this.log('Starting CI Quality Gate validation (M1→M2)...', 'info');

    try {
      // 1. Run unit tests
      await this.runUnitTests();

      // 2. Run SSR tests
      await this.runSSRTtests();

      // 3. Run integration tests (subset)
      await this.runIntegrationTests();

      // 4. Generate coverage report
      await this.generateCoverage();

      // 5. Run maturity analysis
      await this.runMaturityAnalysis();

      // 6. Run linting
      await this.runLinting();

      // 7. Generate final report
      this.generateReport();

      // Exit with appropriate code
      const hasErrors = this.errors.length > 0;
      const hasCriticalWarnings = this.warnings.some(w => w.includes('CRITICAL'));

      if (hasErrors || hasCriticalWarnings) {
        this.log('Quality gate FAILED', 'error');
        process.exit(1);
      } else {
        this.log('Quality gate PASSED', 'success');
        process.exit(0);
      }

    } catch (error) {
      this.log(`Quality gate failed with error: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async runUnitTests() {
    this.log('Running unit tests...', 'info');

    try {
      const output = execSync('npm run test:unit', {
        encoding: 'utf8',
        timeout: 300000, // 5 minutes
        maxBuffer: 1024 * 1024 * 10 // 10MB
      });

      this.results.tests.passed = !output.includes('failed') || output.includes('Test Files  0 failed');
      this.results.tests.data = this.parseTestOutput(output);

      if (this.results.tests.passed) {
        this.log(`Unit tests passed: ${this.results.tests.data.passed}/${this.results.tests.data.total}`, 'success');
      } else {
        this.errors.push(`Unit tests failed: ${this.results.tests.data.failed} failed`);
        this.log(`Unit tests failed: ${this.results.tests.data.failed} failed`, 'error');
      }
    } catch (error) {
      this.errors.push(`Unit tests execution failed: ${error.message}`);
      this.log(`Unit tests execution failed: ${error.message}`, 'error');
    }
  }

  async runSSRTtests() {
    this.log('Running SSR tests...', 'info');

    try {
      const output = execSync('npm run test:ssr', {
        encoding: 'utf8',
        timeout: 180000, // 3 minutes
        maxBuffer: 1024 * 1024 * 5
      });

      const ssrPassed = !output.includes('failed') || output.includes('Test Files  0 failed');

      if (ssrPassed) {
        this.log('SSR tests passed', 'success');
      } else {
        this.warnings.push('SSR tests had failures');
        this.log('SSR tests had failures', 'warning');
      }
    } catch (error) {
      this.warnings.push(`SSR tests execution failed: ${error.message}`);
      this.log(`SSR tests execution failed: ${error.message}`, 'warning');
    }
  }

  async runIntegrationTests() {
    this.log('Running integration tests (subset)...', 'info');

    try {
      // Run only critical integration tests for CI speed
      const output = execSync('npm run test:vitest:integration', {
        encoding: 'utf8',
        timeout: 240000, // 4 minutes
        maxBuffer: 1024 * 1024 * 5
      });

      const integrationPassed = !output.includes('failed') || output.includes('Test Files  0 failed');

      if (integrationPassed) {
        this.log('Integration tests passed', 'success');
      } else {
        this.warnings.push('Integration tests had failures');
        this.log('Integration tests had failures', 'warning');
      }
    } catch (error) {
      this.warnings.push(`Integration tests execution failed: ${error.message}`);
      this.log(`Integration tests execution failed: ${error.message}`, 'warning');
    }
  }

  async generateCoverage() {
    this.log('Generating coverage report...', 'info');

    try {
      execSync('npm run coverage:gaps', {
        encoding: 'utf8',
        timeout: 120000, // 2 minutes
        maxBuffer: 1024 * 1024 * 5
      });

      // Check if coverage file was generated
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        const total = coverage.total || {};
        const avgCoverage = ((total.lines?.pct || 0) + (total.functions?.pct || 0) +
                            (total.branches?.pct || 0) + (total.statements?.pct || 0)) / 4;

        this.results.coverage.passed = avgCoverage >= 30; // Minimum threshold
        this.results.coverage.data = { average: avgCoverage, total };

        if (this.results.coverage.passed) {
          this.log(`Coverage generated: ${avgCoverage.toFixed(1)}%`, 'success');
        } else {
          this.warnings.push(`Low coverage: ${avgCoverage.toFixed(1)}% (minimum: 30%)`);
          this.log(`Low coverage: ${avgCoverage.toFixed(1)}%`, 'warning');
        }
      } else {
        this.warnings.push('Coverage file not generated');
        this.log('Coverage file not generated', 'warning');
      }
    } catch (error) {
      this.warnings.push(`Coverage generation failed: ${error.message}`);
      this.log(`Coverage generation failed: ${error.message}`, 'warning');
    }
  }

  async runMaturityAnalysis() {
    this.log('Running maturity analysis...', 'info');

    try {
      const output = execSync('node scripts/analyze-maturity.js --target M1', {
        encoding: 'utf8',
        timeout: 60000, // 1 minute
        maxBuffer: 1024 * 1024 * 2
      });

      // Check if maturity analysis passed (exit code would be checked by execSync)
      const maturityPassed = !output.includes('M0') || output.includes('M1') || output.includes('M2') || output.includes('M3');

      this.results.maturity.passed = maturityPassed;
      this.results.maturity.data = output;

      if (maturityPassed) {
        this.log('Maturity analysis passed', 'success');
      } else {
        this.errors.push('Maturity analysis failed - below minimum standards');
        this.log('Maturity analysis failed', 'error');
      }
    } catch (error) {
      this.errors.push(`Maturity analysis failed: ${error.message}`);
      this.log(`Maturity analysis failed: ${error.message}`, 'error');
    }
  }

  async runLinting() {
    this.log('Running linting checks...', 'info');

    try {
      execSync('npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0', {
        encoding: 'utf8',
        timeout: 120000, // 2 minutes
        maxBuffer: 1024 * 1024 * 5
      });

      this.results.linting.passed = true;
      this.log('Linting passed', 'success');
    } catch (error) {
      this.errors.push(`Linting failed: ${error.message}`);
      this.log(`Linting failed: ${error.message}`, 'error');
    }
  }

  parseTestOutput(output) {
    // Simple parsing of test output
    const lines = output.split('\n');
    let total = 0, passed = 0, failed = 0;

    lines.forEach(line => {
      if (line.includes('Tests')) {
        const match = line.match(/(\d+)\s*(passed|failed)/g);
        if (match) {
          match.forEach(m => {
            const numMatch = m.match(/(\d+)/);
            const typeMatch = m.match(/(passed|failed)/);
            if (numMatch && typeMatch) {
              const num = parseInt(numMatch[1]);
              if (typeMatch[1] === 'passed') passed = num;
              else if (typeMatch[1] === 'failed') failed = num;
            }
          });
        }
      }
    });

    total = passed + failed;
    return { total, passed, failed };
  }

  generateReport() {
    this.log('Generating quality gate report...', 'info');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.errors.length === 0,
        errors: this.errors.length,
        warnings: this.warnings.length
      },
      results: this.results,
      errors: this.errors,
      warnings: this.warnings
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'quality-gate-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 QUALITY GATE REPORT');
    console.log('='.repeat(60));

    console.log(`Tests: ${this.results.tests.passed ? '✅' : '❌'} (${this.results.tests.data?.passed || 0}/${this.results.tests.data?.total || 0})`);
    console.log(`Coverage: ${this.results.coverage.passed ? '✅' : '⚠️'} (${this.results.coverage.data?.average?.toFixed(1) || 0}%)`);
    console.log(`Maturity: ${this.results.maturity.passed ? '✅' : '❌'}`);
    console.log(`Linting: ${this.results.linting.passed ? '✅' : '❌'}`);

    if (this.errors.length > 0) {
      console.log(`\n❌ ERRORS (${this.errors.length}):`);
      this.errors.forEach(error => console.log(`   • ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    console.log(`\n📄 Full report saved to: ${reportPath}`);
    console.log('='.repeat(60));
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const gate = new CIQualityGate();
  gate.run().catch(error => {
    console.error('Fatal error in quality gate:', error);
    process.exit(1);
  });
}

export default CIQualityGate;

