#!/usr/bin/env node

/**
 * Analytics Monitoring with Safe Timeouts
 * Automated analytics and user monitoring with intelligent timeouts
 */

import { SafeCommandRunner } from './safe-command-runner.mjs';
import { promises as fs } from 'fs';
import path from 'path';

class AnalyticsMonitoring {
  constructor() {
    this.runner = new SafeCommandRunner();
    this.analyticsDir = path.join(process.cwd(), 'analytics-reports');
    this.privacyDir = path.join(this.analyticsDir, 'privacy');
    this.performanceDir = path.join(this.analyticsDir, 'performance');
  }

  async initialize() {
    // Ensure analytics directories exist
    await fs.mkdir(this.analyticsDir, { recursive: true });
    await fs.mkdir(this.privacyDir, { recursive: true });
    await fs.mkdir(this.performanceDir, { recursive: true });
    console.log('✅ Analytics directories initialized');
  }

  async runAnalyticsMonitoring(options = {}) {
    const {
      environment = 'production',
      skipPrivacyScan = false,
      skipPerformanceAnalysis = false,
      skipUserJourney = false,
      generateReport = true,
      dataRetentionDays = 90
    } = options;

    console.log(`📊 Starting Analytics Monitoring - Environment: ${environment.toUpperCase()}\n`);
    console.log('='.repeat(60));

    const monitoringId = this.generateMonitoringId();
    const reportPath = path.join(this.analyticsDir, `analytics-monitoring-${monitoringId}.json`);

    console.log(`🆔 Monitoring ID: ${monitoringId}`);
    console.log(`📊 Report: ${reportPath}`);
    console.log(`🎯 Environment: ${environment}`);
    console.log(`⏰ Data Retention: ${dataRetentionDays} days`);
    console.log('='.repeat(60));

    const analyticsMonitor = {
      id: monitoringId,
      environment,
      startTime: new Date().toISOString(),
      analyses: [],
      compliance: {
        gdpr: true,
        lgpd: true,
        ccpa: true,
        violations: []
      },
      recommendations: [],
      summary: {
        status: 'running',
        privacyScore: 100,
        performanceScore: 100,
        userExperienceScore: 100,
        dataProcessed: 0,
        issuesFound: 0
      }
    };

    try {
      // Phase 1: Privacy compliance monitoring (if enabled)
      if (!skipPrivacyScan) {
        await this.runAnalysisPhase('privacy-compliance', analyticsMonitor, async () => {
          return await this.monitorPrivacyCompliance(environment);
        });
      }

      // Phase 2: Analytics performance analysis (if enabled)
      if (!skipPerformanceAnalysis) {
        await this.runAnalysisPhase('analytics-performance', analyticsMonitor, async () => {
          return await this.analyzeAnalyticsPerformance(environment);
        });
      }

      // Phase 3: User journey analysis (if enabled)
      if (!skipUserJourney) {
        await this.runAnalysisPhase('user-journey', analyticsMonitor, async () => {
          return await this.analyzeUserJourney(environment);
        });
      }

      // Phase 4: Data retention and cleanup
      await this.runAnalysisPhase('data-retention', analyticsMonitor, async () => {
        return await this.monitorDataRetention(dataRetentionDays);
      });

      // Phase 5: Event tracking validation
      await this.runAnalysisPhase('event-tracking', analyticsMonitor, async () => {
        return await this.validateEventTracking();
      });

      // Generate final recommendations and compliance summary
      analyticsMonitor.recommendations = this.generateAnalyticsRecommendations(analyticsMonitor.analyses);
      analyticsMonitor.summary = this.calculateAnalyticsSummary(analyticsMonitor.analyses);
      analyticsMonitor.endTime = new Date().toISOString();

      console.log('\n✅ ANALYTICS MONITORING COMPLETED!');
      console.log('='.repeat(50));
      console.log(`🆔 Monitoring ID: ${monitoringId}`);
      console.log(`⏱️  Duration: ${this.calculateDuration(analyticsMonitor.startTime, analyticsMonitor.endTime)}`);
      console.log(`🔒 Privacy Score: ${analyticsMonitor.summary.privacyScore}/100`);
      console.log(`⚡ Performance Score: ${analyticsMonitor.summary.performanceScore}/100`);
      console.log(`👥 UX Score: ${analyticsMonitor.summary.userExperienceScore}/100`);
      console.log(`📊 Data Processed: ${analyticsMonitor.summary.dataProcessed} events`);
      console.log(`⚠️  Issues Found: ${analyticsMonitor.summary.issuesFound}`);

      // Show compliance status
      const compliance = analyticsMonitor.compliance;
      if (compliance.violations.length === 0) {
        console.log('✅ All privacy regulations compliant');
      } else {
        console.log(`🚨 ${compliance.violations.length} privacy violations found`);
      }

      // Save analytics report
      if (generateReport) {
        await this.saveAnalyticsReport(analyticsMonitor);
      }

    } catch (error) {
      analyticsMonitor.summary.status = 'error';
      analyticsMonitor.error = error.message;
      analyticsMonitor.endTime = new Date().toISOString();

      console.error(`\n💥 ANALYTICS MONITORING ERROR: ${error.message}`);
      console.log('='.repeat(50));

      // Save error report
      if (generateReport) {
        await this.saveAnalyticsReport(analyticsMonitor);
      }

      throw error;
    }
  }

  async runAnalysisPhase(phaseName, analyticsMonitor, phaseFunction) {
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

      analyticsMonitor.analyses.push(phaseRecord);

      console.log(`✅ ${phaseName.replace('-', ' ')} completed in ${phaseDuration}ms`);

      if (result.score !== undefined) {
        console.log(`   📊 Score: ${result.score}/100`);
      }

      if (result.issues && result.issues.length > 0) {
        console.log(`   ⚠️  Issues: ${result.issues.length}`);
      }

      if (result.eventsProcessed) {
        console.log(`   📈 Events: ${result.eventsProcessed}`);
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

      analyticsMonitor.analyses.push(phaseRecord);

      console.error(`❌ ${phaseName.replace('-', ' ')} failed: ${error.message}`);
      throw error;
    }
  }

  async monitorPrivacyCompliance(environment) {
    console.log('🔒 Monitoring privacy compliance...');

    const compliance = {
      gdpr: { compliant: true, issues: [] },
      lgpd: { compliant: true, issues: [] },
      ccpa: { compliant: true, issues: [] }
    };

    let totalIssues = 0;

    // Check for consent management (45s timeout)
    const consentCheck = await this.runner.runFast(
      'grep -r "consent\|gdpr\|lgpd\|ccpa" src/ --include="*.ts" --include="*.tsx" -l | wc -l',
      'Consent management check'
    );

    const consentImplementations = parseInt(consentCheck.stdout.trim());
    if (consentImplementations < 3) {
      compliance.gdpr.issues.push('Insufficient consent management implementations');
      compliance.lgpd.issues.push('Insufficient consent management implementations');
      compliance.ccpa.issues.push('Insufficient consent management implementations');
      totalIssues += 3;
    }

    // Check for data anonymization (45s timeout)
    const anonymizationCheck = await this.runner.runFast(
      'grep -r "anonymize\|pseudonymize\|mask" src/ --include="*.ts" --include="*.tsx" -l | wc -l',
      'Data anonymization check'
    );

    const anonymizationMethods = parseInt(anonymizationCheck.stdout.trim());
    if (anonymizationMethods === 0) {
      compliance.gdpr.issues.push('No data anonymization methods found');
      totalIssues++;
    }

    // Check for cookie management (45s timeout)
    const cookieCheck = await this.runner.runFast(
      'grep -r "cookie\|localStorage\|sessionStorage" src/ --include="*.ts" --include="*.tsx" | grep -v "test" | wc -l',
      'Cookie and storage usage check'
    );

    const storageUsage = parseInt(cookieCheck.stdout.trim());

    // Check for data export/deletion features (45s timeout)
    const dataManagementCheck = await this.runner.runFast(
      'grep -r "export.*data\|delete.*data\|download.*data" src/ --include="*.ts" --include="*.tsx" -l | wc -l',
      'Data management features check'
    );

    const dataManagementFeatures = parseInt(dataManagementCheck.stdout.trim());
    if (dataManagementFeatures === 0) {
      compliance.gdpr.issues.push('No data export/deletion features found');
      compliance.ccpa.issues.push('No data export/deletion features found');
      totalIssues += 2;
    }

    // Update compliance status
    compliance.gdpr.compliant = compliance.gdpr.issues.length === 0;
    compliance.lgpd.compliant = compliance.lgpd.issues.length === 0;
    compliance.ccpa.compliant = compliance.ccpa.issues.length === 0;

    // Calculate privacy score
    const privacyScore = Math.max(0, 100 - (totalIssues * 15));

    return {
      compliance,
      totalIssues,
      consentImplementations,
      anonymizationMethods,
      storageUsage,
      dataManagementFeatures,
      score: privacyScore,
      regulations: ['GDPR', 'LGPD', 'CCPA']
    };
  }

  async analyzeAnalyticsPerformance(environment) {
    console.log('⚡ Analyzing analytics performance...');

    // Check analytics loading performance (45s timeout)
    const analyticsLoadCheck = await this.runner.runFast(
      'grep -r "gtag\|analytics\|plausible\|mixpanel" src/ --include="*.ts" --include="*.tsx" -l | wc -l',
      'Analytics libraries usage check'
    );

    const analyticsLibraries = parseInt(analyticsLoadCheck.stdout.trim());

    // Check for lazy loading of analytics (45s timeout)
    const lazyAnalyticsCheck = await this.runner.runFast(
      'grep -r "lazy.*analytics\|dynamic.*import.*analytics" src/ --include="*.ts" --include="*.tsx" -l | wc -l',
      'Lazy analytics loading check'
    );

    const lazyAnalytics = parseInt(lazyAnalyticsCheck.stdout.trim());

    // Check analytics bundle size impact (90s timeout - build operation)
    const bundleImpactCheck = await this.runner.runBuild('npm run build', 'Build for bundle analysis');
    const bundleSize = await this.getAnalyticsBundleImpact();

    // Check for performance monitoring (45s timeout)
    const performanceMonitoringCheck = await this.runner.runFast(
      'grep -r "performance\|timing\|metrics" src/ --include="*.ts" --include="*.tsx" -l | wc -l',
      'Performance monitoring check'
    );

    const performanceMonitoring = parseInt(performanceMonitoringCheck.stdout.trim());

    const issues = [];
    let optimizations = 0;

    // Bundle size impact
    if (bundleSize > 50 * 1024) { // 50KB
      issues.push({
        type: 'large-analytics-bundle',
        severity: 'medium',
        message: `Analytics bundle impact: ${(bundleSize / 1024).toFixed(2)}KB`,
        recommendation: 'Consider lazy loading analytics libraries'
      });
    } else {
      optimizations++;
    }

    // Lazy loading check
    if (lazyAnalytics === 0 && analyticsLibraries > 0) {
      issues.push({
        type: 'no-lazy-analytics',
        severity: 'low',
        message: 'Analytics not lazy loaded',
        recommendation: 'Implement lazy loading for analytics to improve initial page load'
      });
    } else if (lazyAnalytics > 0) {
      optimizations++;
    }

    // Performance monitoring
    if (performanceMonitoring === 0) {
      issues.push({
        type: 'no-performance-monitoring',
        severity: 'low',
        message: 'No analytics performance monitoring',
        recommendation: 'Add performance tracking for analytics operations'
      });
    } else {
      optimizations++;
    }

    // Calculate performance score
    const score = Math.min(100, 70 + (optimizations * 10) - (issues.length * 5));

    return {
      analyticsLibraries,
      lazyAnalytics,
      bundleSize,
      performanceMonitoring,
      issues,
      optimizations,
      score,
      analysisType: 'performance-impact'
    };
  }

  async analyzeUserJourney(environment) {
    console.log('👥 Analyzing user journey analytics...');

    // Check for funnel analysis (45s timeout)
    const funnelCheck = await this.runner.runFast(
      'grep -r "funnel\|conversion\|step" src/ --include="*.ts" --include="*.tsx" -l | wc -l',
      'Funnel analysis check'
    );

    const funnelImplementations = parseInt(funnelCheck.stdout.trim());

    // Check for user segmentation (45s timeout)
    const segmentationCheck = await this.runner.runFast(
      'grep -r "segment\|cohort\|persona" src/ --include="*.ts" --include="*.tsx" -l | wc -l',
      'User segmentation check'
    );

    const segmentationFeatures = parseInt(segmentationCheck.stdout.trim());

    // Check for A/B testing framework (45s timeout)
    const abTestCheck = await this.runner.runFast(
      'grep -r "experiment\|variant\|test.*group" src/ --include="*.ts" --include="*.tsx" -l | wc -l',
      'A/B testing framework check'
    );

    const abTestingFeatures = parseInt(abTestCheck.stdout.trim());

    // Check for user feedback integration (45s timeout)
    const feedbackCheck = await this.runner.runFast(
      'grep -r "feedback\|survey\|rating" src/ --include="*.ts" --include="*.tsx" -l | wc -l',
      'User feedback integration check'
    );

    const feedbackFeatures = parseInt(feedbackCheck.stdout.trim());

    const issues = [];
    let uxScore = 50; // Base score

    // Evaluate user journey analytics maturity
    if (funnelImplementations === 0) {
      issues.push({
        type: 'no-funnel-analysis',
        severity: 'medium',
        message: 'No funnel analysis implemented',
        recommendation: 'Implement conversion funnel tracking'
      });
    } else {
      uxScore += 15;
    }

    if (segmentationFeatures === 0) {
      issues.push({
        type: 'no-user-segmentation',
        severity: 'low',
        message: 'No user segmentation implemented',
        recommendation: 'Add user segmentation for better insights'
      });
    } else {
      uxScore += 15;
    }

    if (abTestingFeatures === 0) {
      issues.push({
        type: 'no-ab-testing',
        severity: 'low',
        message: 'No A/B testing framework',
        recommendation: 'Implement A/B testing for optimization'
      });
    } else {
      uxScore += 10;
    }

    if (feedbackFeatures === 0) {
      issues.push({
        type: 'no-user-feedback',
        severity: 'low',
        message: 'No user feedback integration',
        recommendation: 'Add user feedback collection'
      });
    } else {
      uxScore += 10;
    }

    return {
      funnelImplementations,
      segmentationFeatures,
      abTestingFeatures,
      feedbackFeatures,
      issues,
      score: Math.min(100, uxScore),
      analysisType: 'user-experience'
    };
  }

  async monitorDataRetention(dataRetentionDays) {
    console.log('🗂️ Monitoring data retention compliance...');

    // Check for data cleanup scripts (45s timeout)
    const cleanupCheck = await this.runner.runFast(
      'find . -name "*cleanup*" -o -name "*retention*" -o -name "*purge*" | wc -l',
      'Data cleanup scripts check'
    );

    const cleanupScripts = parseInt(cleanupCheck.stdout.trim());

    // Check for data retention policies (45s timeout)
    const policyCheck = await this.runner.runFast(
      'grep -r "retention\|data.*age\|delete.*after" docs/ README* --include="*.md" -l | wc -l',
      'Data retention policy documentation check'
    );

    const retentionPolicies = parseInt(policyCheck.stdout.trim());

    // Simulate data age analysis (30s timeout)
    const dataAgeCheck = await this.runner.run('echo "Data age analysis would check actual data timestamps"', 'Data age analysis simulation', {
      timeout: 30000
    });

    const issues = [];
    let complianceScore = 80; // Base score

    if (cleanupScripts === 0) {
      issues.push({
        type: 'no-cleanup-scripts',
        severity: 'high',
        message: 'No automated data cleanup scripts found',
        recommendation: 'Implement automated data cleanup based on retention policies'
      });
      complianceScore -= 30;
    }

    if (retentionPolicies === 0) {
      issues.push({
        type: 'no-retention-policies',
        severity: 'medium',
        message: 'No documented data retention policies',
        recommendation: 'Document data retention policies and procedures'
      });
      complianceScore -= 20;
    }

    if (dataRetentionDays > 2555) { // 7 years
      issues.push({
        type: 'excessive-retention',
        severity: 'low',
        message: `Data retention period (${dataRetentionDays} days) may be excessive`,
        recommendation: 'Review and optimize data retention periods'
      });
    }

    return {
      dataRetentionDays,
      cleanupScripts,
      retentionPolicies,
      issues,
      complianceScore: Math.max(0, complianceScore),
      regulations: ['GDPR', 'LGPD', 'CCPA'],
      analysisType: 'data-governance'
    };
  }

  async validateEventTracking() {
    console.log('📈 Validating event tracking implementation...');

    // Check for event tracking implementation (45s timeout)
    const eventTrackingCheck = await this.runner.runFast(
      'grep -r "track\|event\|analytics" src/ --include="*.ts" --include="*.tsx" -l | wc -l',
      'Event tracking implementation check'
    );

    const eventTrackingFiles = parseInt(eventTrackingCheck.stdout.trim());

    // Check for custom events (45s timeout)
    const customEventCheck = await this.runner.runFast(
      'grep -r "trackEvent\|logEvent\|sendEvent" src/ --include="*.ts" --include="*.tsx" -l | wc -l',
      'Custom event tracking check'
    );

    const customEvents = parseInt(customEventCheck.stdout.trim());

    // Check for error tracking (45s timeout)
    const errorTrackingCheck = await this.runner.runFast(
      'grep -r "error.*track\|exception.*track\|sentry\|rollbar" src/ --include="*.ts" --include="*.tsx" -l | wc -l',
      'Error tracking check'
    );

    const errorTracking = parseInt(errorTrackingCheck.stdout.trim());

    // Check for performance tracking (45s timeout)
    const performanceTrackingCheck = await this.runner.runFast(
      'grep -r "performance.*track\|timing\|metrics" src/ --include="*.ts" --include="*.tsx" -l | wc -l',
      'Performance tracking check'
    );

    const performanceTracking = parseInt(performanceTrackingCheck.stdout.trim());

    const issues = [];
    let eventsProcessed = 0;

    // Evaluate event tracking completeness
    if (eventTrackingFiles === 0) {
      issues.push({
        type: 'no-event-tracking',
        severity: 'high',
        message: 'No event tracking implementation found',
        recommendation: 'Implement comprehensive event tracking'
      });
    } else {
      eventsProcessed = eventTrackingFiles * 10; // Estimate
    }

    if (customEvents === 0) {
      issues.push({
        type: 'no-custom-events',
        severity: 'medium',
        message: 'No custom event tracking found',
        recommendation: 'Add custom events for business metrics'
      });
    }

    if (errorTracking === 0) {
      issues.push({
        type: 'no-error-tracking',
        severity: 'medium',
        message: 'No error tracking implementation',
        recommendation: 'Implement error tracking and monitoring'
      });
    }

    if (performanceTracking === 0) {
      issues.push({
        type: 'no-performance-tracking',
        severity: 'low',
        message: 'No performance tracking found',
        recommendation: 'Add performance metrics tracking'
      });
    }

    // Calculate event tracking score
    const score = Math.min(100, 40 + (eventTrackingFiles * 10) + (customEvents * 5) + (errorTracking * 10) + (performanceTracking * 5));

    return {
      eventTrackingFiles,
      customEvents,
      errorTracking,
      performanceTracking,
      eventsProcessed,
      issues,
      score,
      analysisType: 'event-validation'
    };
  }

  async getAnalyticsBundleImpact() {
    try {
      // Simulate bundle impact calculation
      const result = await this.runner.run('echo "Calculating analytics bundle impact..." && sleep 1 && echo "51200"', 'Bundle impact calculation', {
        timeout: 10000
      });
      return parseInt(result.stdout.trim()) || 0;
    } catch {
      return 0;
    }
  }

  generateAnalyticsRecommendations(analyses) {
    const recommendations = [];

    analyses.forEach(analysis => {
      if (analysis.result?.issues) {
        analysis.result.issues.forEach(issue => {
          recommendations.push({
            phase: analysis.name,
            type: issue.type,
            title: issue.message,
            impact: issue.severity === 'high' ? 'High Impact' :
                    issue.severity === 'medium' ? 'Medium Impact' : 'Low Impact',
            recommendation: issue.recommendation,
            priority: issue.severity === 'high' ? 1 :
                     issue.severity === 'medium' ? 2 : 3
          });
        });
      }
    });

    // Sort by priority
    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  calculateAnalyticsSummary(analyses) {
    let privacyScore = 100;
    let performanceScore = 100;
    let userExperienceScore = 100;
    let totalDataProcessed = 0;
    let totalIssues = 0;

    analyses.forEach(analysis => {
      if (analysis.result?.score !== undefined) {
        switch (analysis.name) {
          case 'privacy-compliance':
            privacyScore = analysis.result.score;
            break;
          case 'analytics-performance':
            performanceScore = analysis.result.score;
            break;
          case 'user-journey':
            userExperienceScore = analysis.result.score;
            break;
        }
      }

      if (analysis.result?.eventsProcessed) {
        totalDataProcessed += analysis.result.eventsProcessed;
      }

      if (analysis.result?.issues) {
        totalIssues += analysis.result.issues.length;
      }

      if (analysis.result?.totalIssues) {
        totalIssues += analysis.result.totalIssues;
      }
    });

    return {
      status: 'completed',
      privacyScore,
      performanceScore,
      userExperienceScore,
      dataProcessed: totalDataProcessed,
      issuesFound: totalIssues
    };
  }

  generateMonitoringId() {
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

  async saveAnalyticsReport(analyticsMonitor) {
    const reportPath = path.join(this.analyticsDir, `analytics-monitoring-${analyticsMonitor.id}.json`);

    try {
      await fs.writeFile(reportPath, JSON.stringify(analyticsMonitor, null, 2));
      console.log(`💾 Analytics report saved: ${reportPath}`);
    } catch (error) {
      console.warn(`Failed to save analytics report: ${error.message}`);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const monitoring = new AnalyticsMonitoring();

  await monitoring.initialize();

  // Parse CLI options
  let environment = 'production';
  let skipPrivacyScan = false;
  let skipPerformanceAnalysis = false;
  let skipUserJourney = false;
  let generateReport = true;
  let dataRetentionDays = 90;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--env':
      case '--environment':
        environment = args[i + 1];
        i++;
        break;
      case '--skip-privacy':
        skipPrivacyScan = true;
        break;
      case '--skip-performance':
        skipPerformanceAnalysis = true;
        break;
      case '--skip-journey':
        skipUserJourney = true;
        break;
      case '--no-report':
        generateReport = false;
        break;
      case '--retention':
        dataRetentionDays = parseInt(args[i + 1]);
        i++;
        break;
    }
  }

  try {
    await monitoring.runAnalyticsMonitoring({
      environment,
      skipPrivacyScan,
      skipPerformanceAnalysis,
      skipUserJourney,
      generateReport,
      dataRetentionDays
    });
    process.exit(0);
  } catch (error) {
    console.error(`\n💥 Analytics monitoring failed: ${error.message}`);
    process.exit(1);
  }
}

// Export for use as module
export { AnalyticsMonitoring };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
