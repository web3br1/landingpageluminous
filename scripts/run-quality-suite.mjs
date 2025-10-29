#!/usr/bin/env node

/**
 * Quality Assurance Suite Runner
 * Executes comprehensive QA tests including visual regression and critical paths
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const isCI = process.env.CI === 'true';

console.log('🎯 Starting Quality Assurance Suite...\n');

// Test results tracking
const results = {
  visual: { passed: false, duration: 0 },
  critical: { passed: false, duration: 0 },
  performance: { passed: false, duration: 0 },
  accessibility: { passed: false, duration: 0 },
};

function runCommand(command, description) {
  console.log(`🚀 ${description}...`);
  const startTime = Date.now();

  try {
    execSync(command, {
      stdio: 'inherit',
      timeout: 300000, // 5 minutes timeout
    });

    const duration = Date.now() - startTime;
    console.log(`✅ ${description} completed in ${duration}ms\n`);
    return { success: true, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ ${description} failed in ${duration}ms\n`);
    return { success: false, duration, error };
  }
}

// 1. Visual Regression Tests
console.log('🎨 PHASE 1: Visual Regression Testing');
const visualResult = runCommand(
  'npm run test:visual:regression',
  'Running visual regression tests'
);
results.visual = {
  passed: visualResult.success,
  duration: visualResult.duration
};

// 2. Critical Path E2E Tests
console.log('🚀 PHASE 2: Critical Path E2E Testing');
const criticalResult = runCommand(
  'npm run test:e2e:critical',
  'Running critical path E2E tests'
);
results.critical = {
  passed: criticalResult.success,
  duration: criticalResult.duration
};

// 3. Performance Tests
console.log('⚡ PHASE 3: Performance Testing');
const perfResult = runCommand(
  'npm run test:performance',
  'Running performance tests'
);
results.performance = {
  passed: perfResult.success,
  duration: perfResult.duration
};

// 4. Accessibility Tests
console.log('♿ PHASE 4: Accessibility Testing');
const a11yResult = runCommand(
  'npm run test:a11y',
  'Running accessibility tests'
);
results.accessibility = {
  passed: a11yResult.success,
  duration: a11yResult.duration
};

// 5. Load Testing
console.log('🔥 PHASE 5: Load Testing');
const loadResult = runCommand(
  'npx playwright test --project=load-testing --reporter=line',
  'Running load testing'
);
results.load = {
  passed: loadResult.success,
  duration: loadResult.duration
};

// 6. Cross-browser Testing
console.log('🌐 PHASE 6: Cross-browser Testing');
const crossBrowserResult = runCommand(
  'npx playwright test --project=cross-browser-testing --reporter=line',
  'Running cross-browser tests'
);
results.crossBrowser = {
  passed: crossBrowserResult.success,
  duration: crossBrowserResult.duration
};

// 7. I18n Testing
console.log('🌍 PHASE 7: I18n Testing');
const i18nResult = runCommand(
  'npx playwright test --project=i18n-testing --reporter=line',
  'Running i18n tests'
);
results.i18n = {
  passed: i18nResult.success,
  duration: i18nResult.duration
};

// 8. Network Conditions Testing
console.log('📡 PHASE 8: Network Conditions Testing');
const networkResult = runCommand(
  'npx playwright test --project=network-testing --reporter=line',
  'Running network conditions tests'
);
results.network = {
  passed: networkResult.success,
  duration: networkResult.duration
};

// 9. PWA Testing
console.log('📱 PHASE 9: PWA Testing');
const pwaResult = runCommand(
  'npx playwright test --project=pwa-testing --reporter=line',
  'Running PWA tests'
);
results.pwa = {
  passed: pwaResult.success,
  duration: pwaResult.duration
};

// 10. Analytics Testing
console.log('📊 PHASE 10: Analytics Testing');
const analyticsResult = runCommand(
  'npx playwright test --project=analytics-testing --reporter=line',
  'Running analytics tests'
);
results.analytics = {
  passed: analyticsResult.success,
  duration: analyticsResult.duration
};

// 11. API Testing
console.log('🔗 PHASE 11: API Testing');
const apiResult = runCommand(
  'npx playwright test --project=api-testing --reporter=line',
  'Running API contract tests'
);
results.api = {
  passed: apiResult.success,
  duration: apiResult.duration
};

// 12. Security Testing
console.log('🔒 PHASE 12: Security Testing');
const securityResult = runCommand(
  'npx playwright test --project=security-testing --reporter=line',
  'Running advanced security tests'
);
results.security = {
  passed: securityResult.success,
  duration: securityResult.duration
};

// 13. SEO Complete Testing
console.log('🔍 PHASE 13: SEO Complete Testing');
const seoResult = runCommand(
  'npx playwright test --project=seo-complete-testing --reporter=line',
  'Running complete SEO tests'
);
results.seo = {
  passed: seoResult.success,
  duration: seoResult.duration
};

// Generate summary report
console.log('📊 QUALITY ASSURANCE SUMMARY\n');
console.log('=' .repeat(50));

const totalTests = Object.keys(results).length;
const criticalTests = ['visual', 'critical', 'performance', 'accessibility'];
const additionalTests = ['load', 'crossBrowser', 'i18n', 'network', 'pwa', 'analytics', 'api', 'security', 'seo'];

const passedTests = Object.values(results).filter(r => r.passed).length;
const criticalPassed = criticalTests.filter(test => results[test]?.passed).length;
const additionalPassed = additionalTests.filter(test => results[test]?.passed).length;
const totalDuration = Object.values(results).reduce((sum, r) => sum + r.duration, 0);

Object.entries(results).forEach(([test, result]) => {
  const status = result.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${test.padEnd(15)} ${result.duration}ms`);
});

console.log('='.repeat(50));
console.log(`🎯 Critical: ${criticalPassed}/${criticalTests.length} suites passed`);
console.log(`➕ Additional: ${additionalPassed}/${additionalTests.length} suites passed`);
console.log(`📈 Overall: ${passedTests}/${totalTests} suites passed`);
console.log(`⏱️  Total duration: ${totalDuration}ms`);

// Generate detailed report
const reportPath = path.join(process.cwd(), 'quality-report.json');
const report = {
  timestamp: new Date().toISOString(),
  environment: isCI ? 'CI' : 'Local',
  results,
  summary: {
    totalSuites: totalTests,
    passedSuites: passedTests,
    failedSuites: totalTests - passedTests,
    criticalSuites: criticalTests.length,
    criticalPassed: criticalPassed,
    additionalSuites: additionalTests.length,
    additionalPassed: additionalPassed,
    totalDuration,
    successRate: Math.round((passedTests / totalTests) * 100),
    criticalSuccessRate: Math.round((criticalPassed / criticalTests.length) * 100),
  },
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`📄 Detailed report saved to: ${reportPath}`);

// Exit with appropriate code
const exitCode = passedTests === totalTests ? 0 : 1;
console.log(`\n🏁 Quality suite ${exitCode === 0 ? 'PASSED' : 'FAILED'}`);

process.exit(exitCode);
