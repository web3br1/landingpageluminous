#!/usr/bin/env node

/**
 * Continuous Quality Monitor
 * Monitors code quality metrics over time with intelligent timeouts
 * Maintains historical data and trends analysis
 */

import { SafeCommandRunner } from './safe-command-runner.mjs';
import { promises as fs } from 'fs';
import path from 'path';

class ContinuousQualityMonitor {
  constructor() {
    this.runner = new SafeCommandRunner();
    this.metricsDir = path.join(process.cwd(), 'quality-metrics');
    this.historyFile = path.join(this.metricsDir, 'quality-history.json');
    this.currentMetrics = null;
    this.baselineMetrics = null;
  }

  async initialize() {
    // Ensure metrics directory exists
    try {
      await fs.mkdir(this.metricsDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create metrics directory:', error.message);
    }

    // Load baseline and history
    await this.loadBaseline();
    await this.loadHistory();
  }

  async runContinuousMonitoring(options = {}) {
    const {
      interval = 300000, // 5 minutes default
      maxRuns = 10, // Stop after 10 runs
      saveHistory = true,
      compareBaseline = true
    } = options;

    console.log('🔍 Starting Continuous Quality Monitoring\n');
    console.log('=' .repeat(50));
    console.log(`📊 Interval: ${(interval / 1000 / 60).toFixed(1)} minutes`);
    console.log(`🎯 Max Runs: ${maxRuns}`);
    console.log(`💾 Save History: ${saveHistory}`);
    console.log(`📈 Compare Baseline: ${compareBaseline}`);
    console.log('='.repeat(50));

    let runCount = 0;

    const monitoringLoop = async () => {
      runCount++;
      console.log(`\n🚀 Run ${runCount}/${maxRuns} - ${new Date().toISOString()}`);

      try {
        // Collect current metrics with appropriate timeouts
        const metrics = await this.collectQualityMetrics();
        this.currentMetrics = metrics;

        // Save metrics if enabled
        if (saveHistory) {
          await this.saveMetricsToHistory(metrics);
        }

        // Compare with baseline if enabled
        if (compareBaseline && this.baselineMetrics) {
          await this.compareWithBaseline(metrics);
        }

        // Display summary
        this.displayMetricsSummary(metrics);

        // Check if we should continue
        if (runCount >= maxRuns) {
          console.log('\n🏁 Continuous monitoring completed (max runs reached)');
          return;
        }

        // Schedule next run
        console.log(`⏰ Next run in ${(interval / 1000 / 60).toFixed(1)} minutes...`);
        setTimeout(monitoringLoop, interval);

      } catch (error) {
        console.error(`❌ Monitoring run ${runCount} failed:`, error.message);

        if (runCount >= maxRuns) {
          console.log('\n🏁 Continuous monitoring stopped due to errors');
          return;
        }

        // Continue even on errors, but with shorter interval for debugging
        console.log('⏰ Retrying in 30 seconds...');
        setTimeout(monitoringLoop, 30000);
      }
    };

    // Start monitoring
    await monitoringLoop();
  }

  async collectQualityMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      duration: 0,
      checks: {}
    };

    const startTime = Date.now();

    try {
      // TypeScript compilation check (45s timeout)
      console.log('🔍 Checking TypeScript compilation...');
      metrics.checks.typescript = await this.checkTypeScriptCompilation();

      // ESLint check (45s timeout)
      console.log('🔍 Checking ESLint...');
      metrics.checks.eslint = await this.checkESLint();

      // Build check (120s timeout)
      console.log('🔍 Checking build...');
      metrics.checks.build = await this.checkBuild();

      // Test check (90s timeout)
      console.log('🔍 Checking tests...');
      metrics.checks.tests = await this.checkTests();

      // Performance metrics
      metrics.checks.performance = await this.collectPerformanceMetrics();

      metrics.duration = Date.now() - startTime;
      metrics.status = this.calculateOverallStatus(metrics.checks);

    } catch (error) {
      metrics.error = error.message;
      metrics.status = 'error';
      metrics.duration = Date.now() - startTime;
    }

    return metrics;
  }

  async checkTypeScriptCompilation() {
    try {
      const result = await this.runner.runFast('npx tsc --noEmit --pretty', 'TypeScript compilation check');

      const errorCount = (result.stdout + result.stderr).match(/error/g)?.length || 0;
      const warningCount = (result.stdout + result.stderr).match(/warning/g)?.length || 0;

      return {
        status: errorCount === 0 ? 'passed' : 'failed',
        errors: errorCount,
        warnings: warningCount,
        duration: result.duration,
        output: result.stdout.slice(-500) + result.stderr.slice(-500)
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        duration: 0
      };
    }
  }

  async checkESLint() {
    try {
      const result = await this.runner.runFast('npx eslint . --max-warnings 0 --format=json', 'ESLint check');

      let errorCount = 0;
      let warningCount = 0;

      try {
        const eslintResults = JSON.parse(result.stdout);
        eslintResults.forEach(file => {
          errorCount += file.errorCount || 0;
          warningCount += file.warningCount || 0;
        });
      } catch (parseError) {
        // Fallback: count from stderr
        const output = result.stdout + result.stderr;
        errorCount = (output.match(/error/g) || []).length;
        warningCount = (output.match(/warning/g) || []).length;
      }

      return {
        status: errorCount === 0 ? 'passed' : 'failed',
        errors: errorCount,
        warnings: warningCount,
        duration: result.duration
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        duration: 0
      };
    }
  }

  async checkBuild() {
    try {
      const result = await this.runner.runBuild('npm run build', 'Build check');

      const hasErrors = result.stderr.includes('error') || result.stderr.includes('Error');
      const hasWarnings = result.stderr.includes('warning') || result.stderr.includes('Warning');

      return {
        status: hasErrors ? 'failed' : 'passed',
        hasErrors,
        hasWarnings,
        duration: result.duration,
        output: result.stderr.slice(-1000)
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        duration: 0
      };
    }
  }

  async checkTests() {
    try {
      const result = await this.runner.runTest('npm test', 'Test execution check');

      const passed = (result.stdout + result.stderr).match(/(\d+) passed/)?.[1] || 0;
      const failed = (result.stdout + result.stderr).match(/(\d+) failed/)?.[1] || 0;
      const total = (result.stdout + result.stderr).match(/(\d+) total/)?.[1] || 0;

      const passRate = total > 0 ? (parseInt(passed) / parseInt(total)) * 100 : 0;

      return {
        status: failed === '0' ? 'passed' : 'failed',
        passed: parseInt(passed),
        failed: parseInt(failed),
        total: parseInt(total),
        passRate: Math.round(passRate * 100) / 100,
        duration: result.duration
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        duration: 0
      };
    }
  }

  async collectPerformanceMetrics() {
    const metrics = {};

    try {
      // Bundle size approximation
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      metrics.bundleSize = packageJson.version || 'unknown';

      // File count approximation
      const srcFiles = await this.countFiles('src', ['.ts', '.tsx', '.js', '.jsx']);
      const libFiles = await this.countFiles('lib', ['.ts', '.tsx', '.js', '.jsx']);
      const totalFiles = srcFiles + libFiles;

      metrics.fileCount = {
        src: srcFiles,
        lib: libFiles,
        total: totalFiles
      };

    } catch (error) {
      metrics.error = error.message;
    }

    return metrics;
  }

  async countFiles(dir, extensions) {
    try {
      const files = await fs.readdir(dir, { recursive: true });
      return files.filter(file => extensions.some(ext => file.endsWith(ext))).length;
    } catch {
      return 0;
    }
  }

  calculateOverallStatus(checks) {
    const criticalChecks = ['typescript', 'build'];
    const allChecks = Object.values(checks);

    // If any critical check failed, overall status is failed
    const criticalFailed = criticalChecks.some(check =>
      checks[check]?.status === 'failed' || checks[check]?.status === 'error'
    );

    if (criticalFailed) {
      return 'failed';
    }

    // If all checks passed, status is passed
    const allPassed = allChecks.every(check => check.status === 'passed');

    if (allPassed) {
      return 'passed';
    }

    // Otherwise, status is warning
    return 'warning';
  }

  displayMetricsSummary(metrics) {
    console.log('\n📊 Quality Metrics Summary:');
    console.log('='.repeat(40));

    Object.entries(metrics.checks).forEach(([checkName, checkData]) => {
      const status = checkData.status;
      const duration = checkData.duration ? `${checkData.duration}ms` : 'N/A';

      let statusIcon = '❓';
      if (status === 'passed') statusIcon = '✅';
      else if (status === 'failed') statusIcon = '❌';
      else if (status === 'error') statusIcon = '💥';

      console.log(`${statusIcon} ${checkName}: ${status} (${duration})`);

      // Show details for failed checks
      if (status === 'failed' || status === 'error') {
        if (checkData.errors !== undefined) {
          console.log(`   Errors: ${checkData.errors}`);
        }
        if (checkData.warnings !== undefined) {
          console.log(`   Warnings: ${checkData.warnings}`);
        }
        if (checkData.error) {
          console.log(`   Error: ${checkData.error}`);
        }
      }

      // Show test results
      if (checkData.passRate !== undefined) {
        console.log(`   Pass Rate: ${checkData.passRate}% (${checkData.passed}/${checkData.total})`);
      }
    });

    console.log(`\n🏆 Overall Status: ${metrics.status?.toUpperCase()}`);
    console.log(`⏱️  Total Duration: ${metrics.duration}ms`);
  }

  async compareWithBaseline(currentMetrics) {
    if (!this.baselineMetrics) {
      console.log('⚠️  No baseline metrics available for comparison');
      return;
    }

    console.log('\n📈 Baseline Comparison:');
    console.log('-'.repeat(30));

    const baseline = this.baselineMetrics.checks;
    const current = currentMetrics.checks;

    // Compare ESLint errors
    if (baseline.eslint && current.eslint) {
      const errorDiff = current.eslint.errors - baseline.eslint.errors;
      const trend = errorDiff > 0 ? '📈' : errorDiff < 0 ? '📉' : '➡️';
      console.log(`${trend} ESLint Errors: ${baseline.eslint.errors} → ${current.eslint.errors} (${errorDiff > 0 ? '+' : ''}${errorDiff})`);
    }

    // Compare test pass rate
    if (baseline.tests && current.tests) {
      const rateDiff = current.tests.passRate - baseline.tests.passRate;
      const trend = rateDiff > 0 ? '📈' : rateDiff < 0 ? '📉' : '➡️';
      console.log(`${trend} Test Pass Rate: ${baseline.tests.passRate}% → ${current.tests.passRate}% (${rateDiff > 0 ? '+' : ''}${rateDiff.toFixed(1)}%)`);
    }
  }

  async loadBaseline() {
    try {
      const baselinePath = path.join(this.metricsDir, 'baseline.json');
      const baselineData = await fs.readFile(baselinePath, 'utf8');
      this.baselineMetrics = JSON.parse(baselineData);
      console.log('✅ Baseline metrics loaded');
    } catch (error) {
      console.log('ℹ️  No baseline metrics found (this is normal for first run)');
    }
  }

  async loadHistory() {
    try {
      const historyData = await fs.readFile(this.historyFile, 'utf8');
      this.history = JSON.parse(historyData);
      console.log(`✅ History loaded (${this.history.length} entries)`);
    } catch (error) {
      this.history = [];
      console.log('ℹ️  No history found (starting fresh)');
    }
  }

  async saveMetricsToHistory(metrics) {
    try {
      this.history.push(metrics);

      // Keep only last 100 entries
      if (this.history.length > 100) {
        this.history = this.history.slice(-100);
      }

      await fs.writeFile(this.historyFile, JSON.stringify(this.history, null, 2));
      console.log('💾 Metrics saved to history');
    } catch (error) {
      console.warn('Failed to save metrics to history:', error.message);
    }
  }

  async setBaseline() {
    try {
      const metrics = await this.collectQualityMetrics();
      const baselinePath = path.join(this.metricsDir, 'baseline.json');
      await fs.writeFile(baselinePath, JSON.stringify(metrics, null, 2));
      this.baselineMetrics = metrics;
      console.log('🎯 Baseline metrics set successfully');
    } catch (error) {
      console.error('Failed to set baseline:', error.message);
    }
  }

  getHistorySummary() {
    if (!this.history || this.history.length === 0) {
      return { message: 'No history available' };
    }

    const recent = this.history.slice(-10); // Last 10 runs
    const avgDuration = recent.reduce((sum, run) => sum + run.duration, 0) / recent.length;

    const statusCounts = recent.reduce((counts, run) => {
      counts[run.status] = (counts[run.status] || 0) + 1;
      return counts;
    }, {});

    return {
      totalRuns: this.history.length,
      recentRuns: recent.length,
      avgDuration: Math.round(avgDuration),
      statusDistribution: statusCounts,
      latestRun: recent[recent.length - 1]
    };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const monitor = new ContinuousQualityMonitor();

  await monitor.initialize();

  if (args.includes('--set-baseline')) {
    console.log('🎯 Setting quality baseline...');
    await monitor.setBaseline();
    process.exit(0);
  }

  if (args.includes('--history')) {
    const summary = monitor.getHistorySummary();
    console.log('📚 Quality History Summary:');
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  }

  // Parse monitoring options
  const options = {};
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--interval':
        options.interval = parseInt(args[i + 1]) * 1000; // Convert to ms
        i++;
        break;
      case '--max-runs':
        options.maxRuns = parseInt(args[i + 1]);
        i++;
        break;
      case '--no-save':
        options.saveHistory = false;
        break;
      case '--no-baseline':
        options.compareBaseline = false;
        break;
    }
  }

  // Start continuous monitoring
  await monitor.runContinuousMonitoring(options);
}

// Export for use as module
export { ContinuousQualityMonitor };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
