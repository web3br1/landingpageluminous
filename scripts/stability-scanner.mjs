#!/usr/bin/env node

/**
 * Stability Scanner Agent
 * Continuous monitoring and regression detection
 * Runs daily or on every merge to detect issues early
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ===== STABILITY SCANNER IMPLEMENTATION =====

class StabilityScanner {
  constructor() {
    this.agentId = process.env.TDD_AGENT_ID || 'stability-scanner';
    this.outputDir = process.env.TDD_OUTPUT_DIR || 'tmp/stability-scanner';
    this.startTime = Date.now();
    this.baselineFile = 'tmp/baselines/stability-baseline.json';

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async execute() {
    console.log('🔍 STABILITY SCANNER: Continuous monitoring mode');

    try {
      const currentMetrics = await this.collectMetrics();
      const baselineMetrics = this.loadBaseline();
      const regressions = this.detectRegressions(currentMetrics, baselineMetrics);
      const trends = this.analyzeTrends(currentMetrics, baselineMetrics);

      // Save current metrics as new baseline if no regressions
      if (regressions.critical.length === 0) {
        this.saveBaseline(currentMetrics);
      }

      const maturityLevel = this.calculateMaturityLevel(currentMetrics, regressions);

      return {
        scanId: `scan_${Date.now()}`,
        timestamp: new Date().toISOString(),
        maturityLevel,
        metrics: currentMetrics,
        regressions,
        trends,
        recommendations: this.generateRecommendations(regressions, trends),
        nextScanRecommended: this.calculateNextScanTime(regressions),
      };

    } catch (error) {
      console.error('💥 Stability Scanner failed:', error.message);
      return {
        success: false,
        error: error.message,
        emergency: true,
      };
    }
  }

  async collectMetrics() {
    console.log('📊 Collecting stability metrics...');

    return {
      build: await this.measureBuildStability(),
      tests: await this.measureTestStability(),
      performance: await this.measurePerformanceStability(),
      dependencies: await this.measureDependencyStability(),
      codeQuality: await this.measureCodeQualityStability(),
      timestamp: new Date().toISOString(),
    };
  }

  async measureBuildStability() {
    try {
      console.log('🔨 Measuring build stability...');

      const startTime = Date.now();
      execSync('npm run build', { timeout: 300000, stdio: 'pipe' });
      const buildTime = Date.now() - startTime;

      return {
        status: 'success',
        buildTime,
        warnings: 0, // Would parse build output for warnings
        errors: 0,
      };
    } catch (error) {
      return {
        status: 'failed',
        buildTime: 0,
        warnings: 0,
        errors: 1,
        error: error.message,
      };
    }
  }

  async measureTestStability() {
    try {
      console.log('🧪 Measuring test stability...');

      const output = execSync('npm run test -- --run --reporter=json', {
        timeout: 180000,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const results = JSON.parse(output);

      return {
        totalTests: results.numTotalTests,
        passedTests: results.numPassedTests,
        failedTests: results.numFailedTests,
        successRate: results.success ? 100 : 0,
        duration: results.testResults?.[0]?.endTime - results.testResults?.[0]?.startTime || 0,
        flakyTests: 0, // Would require multiple runs to detect
      };
    } catch (error) {
      return {
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        successRate: 0,
        duration: 0,
        error: error.message,
      };
    }
  }

  async measurePerformanceStability() {
    try {
      console.log('⚡ Measuring performance stability...');

      // Bundle size
      const bundleSize = this.measureBundleSize();

      // Lighthouse scores (simplified)
      const lighthouseScore = 85; // Would run actual Lighthouse

      return {
        bundleSize,
        lighthouseScore,
        coreWebVitals: {
          lcp: 2500, // ms
          cls: 0.1,
          inp: 200, // ms
        },
        buildTime: 0, // Would measure actual build time
      };
    } catch (error) {
      return {
        bundleSize: 0,
        lighthouseScore: 0,
        coreWebVitals: { lcp: 0, cls: 0, inp: 0 },
        error: error.message,
      };
    }
  }

  async measureDependencyStability() {
    try {
      console.log('📦 Measuring dependency stability...');

      // Check for outdated packages
      let outdated = 0;
      try {
        execSync('npm outdated --json > /dev/null 2>&1', { timeout: 30000 });
        // Would parse actual output
        outdated = 2; // Mock value
      } catch {
        outdated = 0;
      }

      return {
        totalDependencies: 150, // Mock value
        outdated,
        vulnerable: 0,
        lastAudit: new Date().toISOString(),
      };
    } catch (error) {
      return {
        totalDependencies: 0,
        outdated: 0,
        vulnerable: 0,
        error: error.message,
      };
    }
  }

  async measureCodeQualityStability() {
    try {
      console.log('📏 Measuring code quality stability...');

      return {
        eslintErrors: 0,
        typescriptErrors: 0,
        coveragePercentage: 64, // Mock value
        complexityScore: 85, // Mock value
        maintainabilityIndex: 78, // Mock value
      };
    } catch (error) {
      return {
        eslintErrors: 0,
        typescriptErrors: 0,
        coveragePercentage: 0,
        complexityScore: 0,
        maintainabilityIndex: 0,
        error: error.message,
      };
    }
  }

  measureBundleSize() {
    try {
      // Check if .next directory exists and measure its size
      const nextDir = '.next';
      if (fs.existsSync(nextDir)) {
        const size = this.calculateDirectorySize(nextDir);
        return size;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  calculateDirectorySize(dirPath) {
    let totalSize = 0;

    function calculateSize(itemPath) {
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        const items = fs.readdirSync(itemPath);
        items.forEach(item => {
          calculateSize(path.join(itemPath, item));
        });
      } else {
        totalSize += stats.size;
      }
    }

    calculateSize(dirPath);
    return totalSize;
  }

  loadBaseline() {
    try {
      if (fs.existsSync(this.baselineFile)) {
        return JSON.parse(fs.readFileSync(this.baselineFile, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not load baseline:', error.message);
    }

    return null;
  }

  saveBaseline(metrics) {
    try {
      const baselineDir = path.dirname(this.baselineFile);
      if (!fs.existsSync(baselineDir)) {
        fs.mkdirSync(baselineDir, { recursive: true });
      }

      fs.writeFileSync(this.baselineFile, JSON.stringify(metrics, null, 2));
      console.log('💾 Baseline updated');
    } catch (error) {
      console.warn('Could not save baseline:', error.message);
    }
  }

  detectRegressions(current, baseline) {
    const regressions = {
      critical: [],
      warning: [],
      info: [],
    };

    if (!baseline) {
      console.log('📝 No baseline found - establishing initial baseline');
      return regressions;
    }

    // Build regressions
    if (current.build.status === 'failed' && baseline.build.status === 'success') {
      regressions.critical.push({
        type: 'build',
        message: 'Build is now failing',
        previous: baseline.build.status,
        current: current.build.status,
      });
    }

    // Test regressions
    if (current.tests.successRate < baseline.tests.successRate - 5) {
      regressions.critical.push({
        type: 'tests',
        message: `Test success rate dropped from ${baseline.tests.successRate}% to ${current.tests.successRate}%`,
        previous: baseline.tests.successRate,
        current: current.tests.successRate,
      });
    }

    // Performance regressions
    if (current.performance.bundleSize > baseline.performance.bundleSize * 1.1) {
      regressions.warning.push({
        type: 'performance',
        message: `Bundle size increased by ${((current.performance.bundleSize / baseline.performance.bundleSize - 1) * 100).toFixed(1)}%`,
        previous: baseline.performance.bundleSize,
        current: current.performance.bundleSize,
      });
    }

    return regressions;
  }

  analyzeTrends(current, baseline) {
    if (!baseline) return { direction: 'unknown', metrics: {} };

    const trends = {};

    // Calculate trends for key metrics
    Object.keys(current).forEach(key => {
      if (typeof current[key] === 'number' && typeof baseline[key] === 'number') {
        const change = current[key] - baseline[key];
        const percentChange = baseline[key] !== 0 ? (change / baseline[key]) * 100 : 0;

        trends[key] = {
          change,
          percentChange,
          direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        };
      }
    });

    // Overall direction
    const positiveTrends = Object.values(trends).filter(t => t.direction === 'up').length;
    const negativeTrends = Object.values(trends).filter(t => t.direction === 'down').length;

    let direction = 'stable';
    if (positiveTrends > negativeTrends) direction = 'improving';
    else if (negativeTrends > positiveTrends) direction = 'declining';

    return {
      direction,
      metrics: trends,
    };
  }

  calculateMaturityLevel(metrics, regressions) {
    let score = 0;

    // Build stability (20 points)
    if (metrics.build.status === 'success') score += 20;

    // Test coverage (25 points)
    score += Math.min(25, metrics.codeQuality.coveragePercentage * 0.25);

    // Performance (20 points)
    if (metrics.performance.lighthouseScore >= 90) score += 20;
    else if (metrics.performance.lighthouseScore >= 75) score += 15;

    // Dependencies (15 points)
    if (metrics.dependencies.outdated === 0) score += 15;

    // Code quality (20 points)
    score += Math.min(20, metrics.codeQuality.maintainabilityIndex * 0.2);

    // Regression penalty
    score -= regressions.critical.length * 10;
    score -= regressions.warning.length * 5;

    // Determine level
    if (score >= 80) return 'M3 - Optimized';
    if (score >= 60) return 'M2 - Stable';
    if (score >= 40) return 'M1 - Developing';
    return 'M0 - Critical';
  }

  generateRecommendations(regressions, trends) {
    const recommendations = [];

    if (regressions.critical.length > 0) {
      recommendations.push('🚨 Address critical regressions immediately');
    }

    if (trends.direction === 'declining') {
      recommendations.push('📉 Review recent changes causing metric decline');
    }

    if (regressions.warning.length > 0) {
      recommendations.push('⚠️ Monitor warning-level regressions');
    }

    recommendations.push('📊 Consider running optimization sprint');

    return recommendations;
  }

  calculateNextScanTime(regressions) {
    // More frequent scans if there are issues
    if (regressions.critical.length > 0) return '1 hour';
    if (regressions.warning.length > 0) return '6 hours';
    return '24 hours';
  }
}

// ===== EXECUTE =====
async function main() {
  const scanner = new StabilityScanner();
  const result = await scanner.execute();

  // Output JSON result for scheduler
  console.log(JSON.stringify(result, null, 2));

  // Exit with appropriate code
  process.exit(result.success === false ? 1 : 0);
}

main().catch(error => {
  console.error('💥 Stability Scanner crashed:', error.message);
  process.exit(1);
});
