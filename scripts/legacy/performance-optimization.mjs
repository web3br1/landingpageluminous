#!/usr/bin/env node

/**
 * STATUS: LEGACY
 * NÃO USAR EM PRODUÇÃO
 * SUBSTITUÍDO POR ../official/perf-monitor.mjs
 * OWNER: Quality Team
 * DATA DE QUARENTENA: 2025-10-31
 *
 * Original:
 * Performance Optimization with Safe Timeouts
 * Automated performance monitoring and optimization with intelligent timeouts
 */

import { SafeCommandRunner } from './safe-command-runner.mjs';
import { promises as fs } from 'fs';
import path from 'path';

class PerformanceOptimization {
  constructor() {
    this.runner = new SafeCommandRunner();
    this.performanceDir = path.join(process.cwd(), 'performance-reports');
    this.baselineFile = path.join(this.performanceDir, 'performance-baseline.json');
  }

  async initialize() {
    // Ensure performance directories exist
    await fs.mkdir(this.performanceDir, { recursive: true });
    console.log('✅ Performance directories initialized');
  }

  async runPerformanceOptimization(options = {}) {
    const {
      environment = 'development',
      skipBundleAnalysis = false,
      skipCoreWebVitals = false,
      skipLazyLoading = false,
      generateReport = true,
      compareBaseline = true
    } = options;

    console.log(`⚡ Starting Performance Optimization - Environment: ${environment.toUpperCase()}\n`);
    console.log('='.repeat(60));

    const optimizationId = this.generateOptimizationId();
    const reportPath = path.join(this.performanceDir, `performance-optimization-${optimizationId}.json`);

    console.log(`🆔 Optimization ID: ${optimizationId}`);
    console.log(`📊 Report: ${reportPath}`);
    console.log(`🎯 Environment: ${environment}`);
    console.log('='.repeat(60));

    const optimization = {
      id: optimizationId,
      environment,
      startTime: new Date().toISOString(),
      analyses: [],
      recommendations: [],
      summary: {
        status: 'running',
        score: 0,
        issuesFound: 0,
        optimizationsApplied: 0
      }
    };

    try {
      // Phase 1: Bundle analysis (if enabled)
      if (!skipBundleAnalysis) {
        await this.runAnalysisPhase('bundle-analysis', optimization, async () => {
          return await this.analyzeBundle(environment);
        });
      }

      // Phase 2: Core Web Vitals analysis (if enabled)
      if (!skipCoreWebVitals) {
        await this.runAnalysisPhase('core-web-vitals', optimization, async () => {
          return await this.analyzeCoreWebVitals(environment);
        });
      }

      // Phase 3: Lazy loading optimization (if enabled)
      if (!skipLazyLoading) {
        await this.runAnalysisPhase('lazy-loading', optimization, async () => {
          return await this.optimizeLazyLoading();
        });
      }

      // Phase 4: Image optimization
      await this.runAnalysisPhase('image-optimization', optimization, async () => {
        return await this.optimizeImages();
      });

      // Phase 5: Code splitting analysis
      await this.runAnalysisPhase('code-splitting', optimization, async () => {
        return await this.analyzeCodeSplitting();
      });

      // Generate final recommendations
      optimization.recommendations = this.generateRecommendations(optimization.analyses);
      optimization.summary = this.calculateOptimizationSummary(optimization.analyses);
      optimization.endTime = new Date().toISOString();

      console.log('\n✅ PERFORMANCE OPTIMIZATION COMPLETED!');
      console.log('='.repeat(50));
      console.log(`🆔 Optimization ID: ${optimizationId}`);
      console.log(`⏱️  Duration: ${this.calculateDuration(optimization.startTime, optimization.endTime)}`);
      console.log(`📊 Performance Score: ${optimization.summary.score}/100`);
      console.log(`🔧 Issues Found: ${optimization.summary.issuesFound}`);
      console.log(`✨ Optimizations Applied: ${optimization.summary.optimizationsApplied}`);

      // Show top recommendations
      if (optimization.recommendations.length > 0) {
        console.log('\n🎯 TOP RECOMMENDATIONS:');
        optimization.recommendations.slice(0, 3).forEach((rec, index) => {
          console.log(`${index + 1}. ${rec.title} (${rec.impact})`);
        });
      }

      // Save optimization report
      if (generateReport) {
        await this.saveOptimizationReport(optimization);
      }

      // Update baseline if better
      if (compareBaseline && optimization.summary.score > await this.getCurrentBaselineScore()) {
        await this.updateBaseline(optimization);
        console.log('🎯 New performance baseline established!');
      }

    } catch (error) {
      optimization.summary.status = 'error';
      optimization.error = error.message;
      optimization.endTime = new Date().toISOString();

      console.error(`\n💥 PERFORMANCE OPTIMIZATION FAILED: ${error.message}`);
      console.log('='.repeat(50));

      // Save error report
      if (generateReport) {
        await this.saveOptimizationReport(optimization);
      }

      throw error;
    }
  }

  async runAnalysisPhase(phaseName, optimization, phaseFunction) {
    const phaseStart = Date.now();
    console.log(`\n🔍 Phase: ${phaseName.replace('-', ' ').toUpperCase()}`);
    console.log('-'.repeat(40));

    try {
      const result = await phaseFunction();

      const phaseDuration = Date.now() - phaseStart;
      const phaseRecord = {
        name: phaseName,
        status: 'completed',
        duration: phaseDuration,
        result,
        timestamp: new Date().toISOString()
      };

      optimization.analyses.push(phaseRecord);

      console.log(`✅ ${phaseName.replace('-', ' ')} completed in ${phaseDuration}ms`);

      if (result.score !== undefined) {
        console.log(`   📊 Score: ${result.score}/100`);
      }

      if (result.issues && result.issues.length > 0) {
        console.log(`   ⚠️  Issues: ${result.issues.length}`);
      }

    } catch (error) {
      const phaseDuration = Date.now() - phaseStart;
      const phaseRecord = {
        name: phaseName,
        status: 'failed',
        duration: phaseDuration,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      optimization.analyses.push(phaseRecord);

      console.error(`❌ ${phaseName.replace('-', ' ')} failed: ${error.message}`);
      throw error;
    }
  }

  async analyzeBundle(environment) {
    console.log('📦 Analyzing bundle size and composition...');

    // Build production bundle for analysis (120s timeout)
    const buildResult = await this.runner.runBuild('npm run build', 'Production build for analysis');
    if (buildResult.code !== 0) {
      throw new Error('Build failed - cannot analyze bundle');
    }

    // Analyze bundle size (30s timeout)
    const bundleStats = await this.runner.run('npx webpack-bundle-analyzer dist/static/js/*.js --json || echo "{}"', 'Bundle analysis', {
      timeout: 30000
    });

    let bundleSize = 0;
    let chunks = 0;
    let largestChunk = 0;

    try {
      const stats = JSON.parse(bundleStats.stdout);

      // Calculate total bundle size
      if (stats.assets) {
        bundleSize = stats.assets.reduce((total, asset) => total + (asset.size || 0), 0);
        chunks = stats.assets.length;
        largestChunk = Math.max(...stats.assets.map(asset => asset.size || 0));
      }
    } catch {
      // Fallback: use file sizes
      const distFiles = await this.getDistFileSizes();
      bundleSize = distFiles.total;
      chunks = distFiles.count;
      largestChunk = distFiles.largest;
    }

    // Analyze bundle composition
    const issues = [];

    if (bundleSize > 2 * 1024 * 1024) { // 2MB
      issues.push({
        type: 'bundle-size',
        severity: 'high',
        message: `Bundle size too large: ${(bundleSize / 1024 / 1024).toFixed(2)}MB`,
        recommendation: 'Implement code splitting and lazy loading'
      });
    }

    if (largestChunk > 1024 * 1024) { // 1MB
      issues.push({
        type: 'large-chunk',
        severity: 'medium',
        message: `Largest chunk too big: ${(largestChunk / 1024 / 1024).toFixed(2)}MB`,
        recommendation: 'Split large components or libraries'
      });
    }

    if (chunks > 20) {
      issues.push({
        type: 'too-many-chunks',
        severity: 'low',
        message: `Too many chunks: ${chunks}`,
        recommendation: 'Consider consolidating small chunks'
      });
    }

    // Calculate bundle score
    let score = 100;
    if (bundleSize > 3 * 1024 * 1024) score -= 30;
    else if (bundleSize > 2 * 1024 * 1024) score -= 20;
    else if (bundleSize > 1 * 1024 * 1024) score -= 10;

    if (largestChunk > 2 * 1024 * 1024) score -= 20;
    else if (largestChunk > 1024 * 1024) score -= 10;

    return {
      bundleSize,
      chunks,
      largestChunk,
      issues,
      score: Math.max(0, score),
      analysisType: 'webpack-bundle-analyzer'
    };
  }

  async analyzeCoreWebVitals(environment) {
    console.log('📊 Analyzing Core Web Vitals...');

    // Start local server for testing (60s timeout)
    const serverStart = await this.runner.run('npm run dev > /dev/null 2>&1 & echo $!', 'Start dev server', {
      timeout: 60000
    });

    const serverPid = serverStart.stdout.trim();

    try {
      // Wait for server to start (10s)
      await this.runner.run('sleep 10', 'Wait for server startup', { timeout: 10000 });

      // Run Lighthouse audit (90s timeout)
      const lighthouseResult = await this.runner.runTest(
        `npx lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-results.json || echo '{"error": "Lighthouse failed"}'`,
        'Lighthouse Core Web Vitals audit'
      );

      let metrics = {};
      let score = 0;

      try {
        const lighthouseData = JSON.parse(lighthouseResult.stdout || '{"error": "No data"}');

        if (lighthouseData.categories) {
          metrics = {
            performance: lighthouseData.categories.performance?.score * 100 || 0,
            accessibility: lighthouseData.categories.accessibility?.score * 100 || 0,
            bestPractices: lighthouseData.categories['best-practices']?.score * 100 || 0,
            seo: lighthouseData.categories.seo?.score * 100 || 0
          };

          // Core Web Vitals specific metrics
          if (lighthouseData.audits) {
            metrics.lcp = lighthouseData.audits['largest-contentful-paint']?.numericValue || 0;
            metrics.fid = lighthouseData.audits['max-potential-fid']?.numericValue || 0;
            metrics.cls = lighthouseData.audits['cumulative-layout-shift']?.numericValue || 0;
          }

          // Calculate overall score
          score = Math.round((metrics.performance + metrics.accessibility + metrics.bestPractices + metrics.seo) / 4);
        }
      } catch {
        // Lighthouse failed
        metrics.error = 'Lighthouse analysis failed';
      }

      // Analyze Core Web Vitals
      const issues = [];

      if (metrics.lcp > 2500) {
        issues.push({
          type: 'lcp-slow',
          severity: 'high',
          message: `LCP too slow: ${metrics.lcp}ms (target: <2500ms)`,
          recommendation: 'Optimize largest contentful paint element'
        });
      }

      if (metrics.cls > 0.1) {
        issues.push({
          type: 'cls-high',
          severity: 'high',
          message: `CLS too high: ${metrics.cls} (target: <0.1)`,
          recommendation: 'Fix layout shifts by reserving space for dynamic content'
        });
      }

      if (metrics.fid > 100) {
        issues.push({
          type: 'fid-slow',
          severity: 'medium',
          message: `FID too slow: ${metrics.fid}ms (target: <100ms)`,
          recommendation: 'Reduce JavaScript execution time'
        });
      }

      return {
        metrics,
        issues,
        score,
        tool: 'lighthouse'
      };

    } finally {
      // Cleanup: kill dev server
      if (serverPid) {
        try {
          await this.runner.run(`kill ${serverPid} 2>/dev/null || true`, 'Kill dev server', {
            timeout: 10000
          });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }

  async optimizeLazyLoading() {
    console.log('🚀 Optimizing lazy loading implementation...');

    // Analyze current lazy loading usage (45s timeout)
    const lazyAnalysis = await this.runner.runFast(
      'grep -r "lazy\|Suspense\|React.lazy" src/ --include="*.tsx" --include="*.ts" -l | wc -l',
      'Lazy loading usage analysis'
    );

    const lazyComponents = parseInt(lazyAnalysis.stdout.trim());

    // Analyze bundle splitting (60s timeout)
    const splitAnalysis = await this.runner.run('grep -r "import(" src/ --include="*.tsx" --include="*.ts" -l | wc -l', 'Dynamic import analysis', {
      timeout: 60000
    });

    const dynamicImports = parseInt(splitAnalysis.stdout.trim());

    // Analyze route-based code splitting
    const routeAnalysis = await this.runner.runFast(
      'find src -name "*route*" -o -name "*page*" | grep -E "\\.(tsx|ts)$" | wc -l',
      'Route-based splitting analysis'
    );

    const routes = parseInt(routeAnalysis.stdout.trim());

    const issues = [];
    let optimizations = 0;

    // Check lazy loading coverage
    const lazyCoverage = lazyComponents / Math.max(routes, 1);
    if (lazyCoverage < 0.5) {
      issues.push({
        type: 'low-lazy-coverage',
        severity: 'medium',
        message: `Low lazy loading coverage: ${(lazyCoverage * 100).toFixed(1)}% of routes`,
        recommendation: 'Implement lazy loading for more route components'
      });
    } else {
      optimizations++;
    }

    // Check dynamic imports
    if (dynamicImports < 3) {
      issues.push({
        type: 'few-dynamic-imports',
        severity: 'low',
        message: `Few dynamic imports found: ${dynamicImports}`,
        recommendation: 'Consider more aggressive code splitting'
      });
    } else {
      optimizations++;
    }

    // Calculate optimization score
    const score = Math.min(100, 60 + (lazyCoverage * 20) + (dynamicImports * 5) + (routes * 2));

    return {
      lazyComponents,
      dynamicImports,
      routes,
      lazyCoverage,
      issues,
      optimizations,
      score: Math.round(score)
    };
  }

  async optimizeImages() {
    console.log('🖼️ Optimizing image usage and loading...');

    // Analyze image files (45s timeout)
    const imageAnalysis = await this.runner.runFast(
      'find public src -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" -o -name "*.svg" | wc -l',
      'Image file count'
    );

    const totalImages = parseInt(imageAnalysis.stdout.trim());

    // Analyze image sizes (90s timeout)
    const sizeAnalysis = await this.runner.run('find public src -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" | xargs du -sh 2>/dev/null | sort -hr | head -10', 'Large image analysis', {
      timeout: 90000
    });

    const largeImages = sizeAnalysis.stdout.trim().split('\n').filter(line => line.trim());

    // Analyze Next.js Image component usage (45s timeout)
    const nextImageUsage = await this.runner.runFast(
      'grep -r "<Image\|next/image" src/ --include="*.tsx" --include="*.ts" -l | wc -l',
      'Next.js Image component usage'
    );

    const nextImageComponents = parseInt(nextImageUsage.stdout.trim());

    // Analyze lazy loading images
    const lazyImageUsage = await this.runner.runFast(
      'grep -r "loading.*lazy\|priority" src/ --include="*.tsx" --include="*.ts" -l | wc -l',
      'Lazy loading image attributes'
    );

    const optimizedImages = parseInt(lazyImageUsage.stdout.trim());

    const issues = [];
    let optimizations = 0;

    // Check for large images
    const largeImageCount = largeImages.filter(img => {
      const size = img.split('\t')[0];
      const sizeNum = parseFloat(size);
      return sizeNum > 500; // >500KB
    }).length;

    if (largeImageCount > 0) {
      issues.push({
        type: 'large-images',
        severity: 'medium',
        message: `${largeImageCount} images larger than 500KB found`,
        recommendation: 'Compress and optimize large images'
      });
    }

    // Check Next.js Image usage
    const imageUsageRatio = nextImageComponents / Math.max(totalImages, 1);
    if (imageUsageRatio < 0.8) {
      issues.push({
        type: 'low-next-image-usage',
        severity: 'medium',
        message: `Low Next.js Image usage: ${(imageUsageRatio * 100).toFixed(1)}%`,
        recommendation: 'Replace img tags with Next.js Image component'
      });
    } else {
      optimizations++;
    }

    // Check optimization attributes
    if (optimizedImages < nextImageComponents * 0.5) {
      issues.push({
        type: 'missing-optimization-attrs',
        severity: 'low',
        message: 'Many images missing optimization attributes',
        recommendation: 'Add loading="lazy" and priority attributes where appropriate'
      });
    } else {
      optimizations++;
    }

    const score = Math.min(100, 70 + (imageUsageRatio * 20) + (optimizedImages / Math.max(nextImageComponents, 1) * 10));

    return {
      totalImages,
      nextImageComponents,
      optimizedImages,
      largeImages: largeImageCount,
      issues,
      optimizations,
      score: Math.round(score)
    };
  }

  async analyzeCodeSplitting() {
    console.log('🔀 Analyzing code splitting effectiveness...');

    // Analyze webpack chunks after build (60s timeout)
    const chunkAnalysis = await this.runner.run('ls -la dist/static/js/ | wc -l', 'Webpack chunk count', {
      timeout: 60000
    });

    const chunkCount = parseInt(chunkAnalysis.stdout.trim());

    // Analyze vendor vs app chunks
    const vendorAnalysis = await this.runner.run('ls -la dist/static/js/* | grep -E "(vendor|lib)" | wc -l', 'Vendor chunk analysis', {
      timeout: 30000
    });

    const vendorChunks = parseInt(vendorAnalysis.stdout.trim());

    // Analyze route chunks
    const routeAnalysis = await this.runner.run('ls -la dist/static/js/* | grep -E "(route|page)" | wc -l', 'Route chunk analysis', {
      timeout: 30000
    });

    const routeChunks = parseInt(routeAnalysis.stdout.trim());

    const issues = [];
    let optimizations = 0;

    // Evaluate chunk strategy
    if (chunkCount < 3) {
      issues.push({
        type: 'insufficient-splitting',
        severity: 'medium',
        message: `Insufficient code splitting: only ${chunkCount} chunks`,
        recommendation: 'Implement more aggressive code splitting'
      });
    } else {
      optimizations++;
    }

    if (vendorChunks === 0) {
      issues.push({
        type: 'missing-vendor-split',
        severity: 'low',
        message: 'No vendor library separation detected',
        recommendation: 'Configure webpack to split vendor libraries'
      });
    } else {
      optimizations++;
    }

    if (routeChunks === 0) {
      issues.push({
        type: 'missing-route-split',
        severity: 'medium',
        message: 'No route-based code splitting detected',
        recommendation: 'Implement route-based code splitting'
      });
    } else {
      optimizations++;
    }

    // Calculate splitting score
    const score = Math.min(100, 50 + (chunkCount * 5) + (vendorChunks * 10) + (routeChunks * 15));

    return {
      totalChunks: chunkCount,
      vendorChunks,
      routeChunks,
      issues,
      optimizations,
      score: Math.round(score)
    };
  }

  generateRecommendations(analyses) {
    const recommendations = [];

    analyses.forEach(analysis => {
      if (analysis.result?.issues) {
        analysis.result.issues.forEach(issue => {
          recommendations.push({
            phase: analysis.name,
            type: issue.type,
            title: issue.message,
            impact: issue.severity === 'high' ? 'High Impact' : issue.severity === 'medium' ? 'Medium Impact' : 'Low Impact',
            recommendation: issue.recommendation,
            priority: issue.severity === 'high' ? 1 : issue.severity === 'medium' ? 2 : 3
          });
        });
      }
    });

    // Sort by priority and impact
    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  calculateOptimizationSummary(analyses) {
    let totalScore = 0;
    let totalIssues = 0;
    let totalOptimizations = 0;
    let validAnalyses = 0;

    analyses.forEach(analysis => {
      if (analysis.result?.score !== undefined) {
        totalScore += analysis.result.score;
        validAnalyses++;
      }

      if (analysis.result?.issues) {
        totalIssues += analysis.result.issues.length;
      }

      if (analysis.result?.optimizations !== undefined) {
        totalOptimizations += analysis.result.optimizations;
      }
    });

    const averageScore = validAnalyses > 0 ? Math.round(totalScore / validAnalyses) : 0;

    return {
      status: 'completed',
      score: averageScore,
      issuesFound: totalIssues,
      optimizationsApplied: totalOptimizations,
      analysesCompleted: analyses.length
    };
  }

  async getDistFileSizes() {
    try {
      const result = await this.runner.run('find dist -name "*.js" -exec du -b {} + 2>/dev/null | sort -n | tail -1', 'Get largest JS file', {
        timeout: 20000
      });

      const largestSize = parseInt(result.stdout.trim().split('\t')[0]) || 0;

      // Get total size
      const totalResult = await this.runner.run('du -b dist 2>/dev/null | tail -1', 'Get total dist size', {
        timeout: 20000
      });

      const totalSize = parseInt(totalResult.stdout.trim().split('\t')[0]) || 0;

      // Count files
      const countResult = await this.runner.run('find dist -name "*.js" | wc -l', 'Count JS files', {
        timeout: 10000
      });

      const fileCount = parseInt(countResult.stdout.trim()) || 0;

      return {
        total: totalSize,
        largest: largestSize,
        count: fileCount
      };
    } catch {
      return { total: 0, largest: 0, count: 0 };
    }
  }

  async getCurrentBaselineScore() {
    try {
      const baselineData = await fs.readFile(this.baselineFile, 'utf8');
      const baseline = JSON.parse(baselineData);
      return baseline.summary?.score || 0;
    } catch {
      return 0;
    }
  }

  async updateBaseline(optimization) {
    try {
      await fs.writeFile(this.baselineFile, JSON.stringify(optimization, null, 2));
      console.log('✅ Performance baseline updated');
    } catch (error) {
      console.warn('Failed to update baseline:', error.message);
    }
  }

  generateOptimizationId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  calculateDuration(startTime, endTime) {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const duration = end - start;
    return `${Math.floor(duration / 1000)}s`;
  }

  async saveOptimizationReport(optimization) {
    const reportPath = path.join(this.performanceDir, `performance-optimization-${optimization.id}.json`);

    try {
      await fs.writeFile(reportPath, JSON.stringify(optimization, null, 2));
      console.log(`💾 Performance report saved: ${reportPath}`);
    } catch (error) {
      console.warn(`Failed to save performance report: ${error.message}`);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const optimization = new PerformanceOptimization();

  await optimization.initialize();

  // Parse CLI options
  let environment = 'development';
  let skipBundleAnalysis = false;
  let skipCoreWebVitals = false;
  let skipLazyLoading = false;
  let generateReport = true;
  let compareBaseline = true;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--env':
      case '--environment':
        environment = args[i + 1];
        i++;
        break;
      case '--skip-bundle':
        skipBundleAnalysis = true;
        break;
      case '--skip-cwv':
        skipCoreWebVitals = true;
        break;
      case '--skip-lazy':
        skipLazyLoading = true;
        break;
      case '--no-report':
        generateReport = false;
        break;
      case '--no-baseline':
        compareBaseline = false;
        break;
    }
  }

  try {
    await optimization.runPerformanceOptimization({
      environment,
      skipBundleAnalysis,
      skipCoreWebVitals,
      skipLazyLoading,
      generateReport,
      compareBaseline
    });
    process.exit(0);
  } catch (error) {
    console.error(`\n💥 Performance optimization failed: ${error.message}`);
    process.exit(1);
  }
}

// Export for use as module
export { PerformanceOptimization };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}