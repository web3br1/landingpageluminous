#!/usr/bin/env node

/**
 * Security Automation with Safe Timeouts
 * Automated security scanning and compliance checks with intelligent timeouts
 */

import { SafeCommandRunner } from './safe-command-runner.mjs';
import { promises as fs } from 'fs';
import path from 'path';

class SecurityAutomation {
  constructor() {
    this.runner = new SafeCommandRunner();
    this.securityDir = path.join(process.cwd(), 'security-reports');
    this.vulnerabilityDb = path.join(this.securityDir, 'vulnerabilities.json');
    this.complianceDb = path.join(this.securityDir, 'compliance.json');
  }

  async initialize() {
    // Ensure security directories exist
    await fs.mkdir(this.securityDir, { recursive: true });
    console.log('✅ Security directories initialized');
  }

  async runSecurityPipeline(options = {}) {
    const {
      environment = 'development',
      skipDependencyScan = false,
      skipCodeScan = false,
      skipComplianceCheck = false,
      failOnHighSeverity = true,
      generateReport = true
    } = options;

    console.log(`🔒 Starting Security Pipeline - Environment: ${environment.toUpperCase()}\n`);
    console.log('='.repeat(60));

    const scanId = this.generateScanId();
    const reportPath = path.join(this.securityDir, `security-scan-${scanId}.json`);

    console.log(`🆔 Scan ID: ${scanId}`);
    console.log(`📊 Report: ${reportPath}`);
    console.log(`🎯 Environment: ${environment}`);
    console.log(`🚨 Fail on High: ${failOnHighSeverity}`);
    console.log('='.repeat(60));

    const securityScan = {
      id: scanId,
      environment,
      startTime: new Date().toISOString(),
      scans: [],
      summary: {
        totalVulnerabilities: 0,
        highSeverity: 0,
        mediumSeverity: 0,
        lowSeverity: 0,
        complianceScore: 100,
        status: 'running'
      }
    };

    try {
      // Phase 1: Dependency vulnerability scanning (if enabled)
      if (!skipDependencyScan) {
        await this.runScanPhase('dependency-scan', securityScan, async () => {
          return await this.scanDependencies(environment);
        });
      }

      // Phase 2: Code security scanning (if enabled)
      if (!skipCodeScan) {
        await this.runScanPhase('code-scan', securityScan, async () => {
          return await this.scanCodeSecurity();
        });
      }

      // Phase 3: Compliance checks (if enabled)
      if (!skipComplianceCheck) {
        await this.runScanPhase('compliance-check', securityScan, async () => {
          return await this.checkCompliance(environment);
        });
      }

      // Phase 4: Runtime security checks
      await this.runScanPhase('runtime-security', securityScan, async () => {
        return await this.checkRuntimeSecurity();
      });

      // Calculate final summary
      securityScan.summary = this.calculateSecuritySummary(securityScan.scans);
      securityScan.endTime = new Date().toISOString();

      // Check if we should fail the pipeline
      const shouldFail = failOnHighSeverity && securityScan.summary.highSeverity > 0;

      if (shouldFail) {
        securityScan.summary.status = 'failed';
        console.error(`\n🚨 SECURITY SCAN FAILED: ${securityScan.summary.highSeverity} high severity vulnerabilities found`);
        console.log('='.repeat(60));

        // Save failed scan report
        if (generateReport) {
          await this.saveSecurityReport(securityScan);
        }

        throw new Error(`${securityScan.summary.highSeverity} high severity security issues found`);
      }

      securityScan.summary.status = 'passed';
      console.log('\n✅ SECURITY SCAN PASSED!');
      console.log('='.repeat(40));
      console.log(`🆔 Scan ID: ${scanId}`);
      console.log(`⏱️  Duration: ${this.calculateDuration(securityScan.startTime, securityScan.endTime)}`);
      console.log(`🎯 Vulnerabilities: ${securityScan.summary.totalVulnerabilities}`);
      console.log(`🚨 High Severity: ${securityScan.summary.highSeverity}`);
      console.log(`⚠️  Medium Severity: ${securityScan.summary.mediumSeverity}`);
      console.log(`ℹ️  Low Severity: ${securityScan.summary.lowSeverity}`);

      // Save successful scan report
      if (generateReport) {
        await this.saveSecurityReport(securityScan);
      }

    } catch (error) {
      securityScan.summary.status = 'error';
      securityScan.error = error.message;
      securityScan.endTime = new Date().toISOString();

      console.error(`\n💥 SECURITY SCAN ERROR: ${error.message}`);
      console.log('='.repeat(40));

      // Save error scan report
      if (generateReport) {
        await this.saveSecurityReport(securityScan);
      }

      throw error;
    }
  }

  async runScanPhase(phaseName, securityScan, phaseFunction) {
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

      securityScan.scans.push(phaseRecord);

      console.log(`✅ ${phaseName.replace('-', ' ')} completed in ${phaseDuration}ms`);

      if (result.vulnerabilities) {
        console.log(`   📊 Found ${result.vulnerabilities.length} issues`);
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

      securityScan.scans.push(phaseRecord);

      console.error(`❌ ${phaseName.replace('-', ' ')} failed: ${error.message}`);
      throw error;
    }
  }

  async scanDependencies(environment) {
    console.log('🔍 Scanning dependencies for vulnerabilities...');

    // Check if npm audit is available (45s timeout)
    const auditCheck = await this.runner.runFast('npm audit --dry-run --json || echo "{}"', 'NPM audit check');

    let vulnerabilities = [];
    let auditScore = 100;

    try {
      const auditResult = JSON.parse(auditCheck.stdout);

      if (auditResult.vulnerabilities) {
        vulnerabilities = Object.values(auditResult.vulnerabilities).map(vuln => ({
          package: vuln.name,
          severity: vuln.severity,
          title: vuln.title,
          url: vuln.url,
          recommendation: vuln.recommendation || 'Update to latest version'
        }));

        // Calculate audit score
        const total = vulnerabilities.length;
        const high = vulnerabilities.filter(v => v.severity === 'high').length;
        const moderate = vulnerabilities.filter(v => v.severity === 'moderate').length;

        auditScore = Math.max(0, 100 - (high * 20) - (moderate * 10));
      }
    } catch (parseError) {
      console.warn('⚠️  Could not parse npm audit results');
    }

    // Check for outdated packages (60s timeout)
    const outdatedCheck = await this.runner.run('npm outdated --json || echo "{}"', 'Outdated packages check', {
      timeout: 60000
    });

    let outdatedPackages = {};
    try {
      outdatedPackages = JSON.parse(outdatedCheck.stdout);
    } catch {
      // Ignore parse errors
    }

    return {
      vulnerabilities,
      auditScore,
      outdatedPackages: Object.keys(outdatedPackages).length,
      totalPackages: await this.getPackageCount(),
      scanTool: 'npm audit'
    };
  }

  async scanCodeSecurity() {
    console.log('🔍 Scanning code for security issues...');

    // Run ESLint security rules (60s timeout)
    const eslintSecurity = await this.runner.run('npx eslint . --format=json --config .eslintrc.security.json || echo "[]"', 'ESLint security scan', {
      timeout: 60000
    });

    let securityIssues = [];
    try {
      const eslintResults = JSON.parse(eslintSecurity.stdout);

      securityIssues = eslintResults.flatMap(result =>
        result.messages
          .filter(msg => msg.ruleId && (
            msg.ruleId.includes('security') ||
            msg.ruleId.includes('xss') ||
            msg.ruleId.includes('injection') ||
            msg.ruleId.includes('eval')
          ))
          .map(msg => ({
            file: result.filePath,
            line: msg.line,
            column: msg.column,
            rule: msg.ruleId,
            message: msg.message,
            severity: msg.severity === 2 ? 'high' : msg.severity === 1 ? 'medium' : 'low'
          }))
      );
    } catch (parseError) {
      console.warn('⚠️  Could not parse ESLint security results');
    }

    // Check for secrets in code (90s timeout)
    const secretScan = await this.runner.runTest(
      'npx secretlint "**/*.{js,ts,tsx,jsx,json,md}" --format=json || echo "[]"',
      'Secret scanning'
    );

    let secretIssues = [];
    try {
      const secrets = JSON.parse(secretScan.stdout);
      secretIssues = secrets.map(secret => ({
        file: secret.filePath,
        line: secret.range[0][0],
        type: secret.message,
        severity: 'high',
        recommendation: 'Remove or rotate secret'
      }));
    } catch {
      // Secretlint might not be available
    }

    // Combine all code security issues
    const allIssues = [...securityIssues, ...secretIssues];

    return {
      vulnerabilities: allIssues,
      filesScanned: await this.getCodeFileCount(),
      toolsUsed: ['ESLint', 'Secretlint'],
      scanCoverage: 'source code'
    };
  }

  async checkCompliance(environment) {
    console.log('🔍 Checking compliance requirements...');

    const complianceChecks = {
      gdpr: await this.checkGDPRCompliance(),
      securityHeaders: await this.checkSecurityHeaders(),
      dependencyLicenses: await this.checkDependencyLicenses(),
      codeStandards: await this.checkCodeStandards()
    };

    // Calculate compliance score
    const totalChecks = Object.keys(complianceChecks).length;
    const passedChecks = Object.values(complianceChecks).filter(check => check.passed).length;
    const complianceScore = Math.round((passedChecks / totalChecks) * 100);

    return {
      checks: complianceChecks,
      complianceScore,
      environment,
      standardsChecked: ['GDPR', 'Security Headers', 'Licenses', 'Code Standards']
    };
  }

  async checkGDPRCompliance() {
    console.log('🔒 Checking GDPR compliance...');

    // Check for GDPR-related files and configurations
    const gdprFiles = [
      'privacy-policy.md',
      'terms-of-service.md',
      'cookie-policy.md',
      'gdpr-compliance.md'
    ];

    let filesPresent = 0;
    for (const file of gdprFiles) {
      try {
        await fs.access(file);
        filesPresent++;
      } catch {
        // File not found
      }
    }

    // Check for consent management in code
    const consentCheck = await this.runner.runFast(
      'grep -r "consent\|gdpr\|lgpd" src/ lib/ --include="*.ts" --include="*.tsx" -l | wc -l',
      'GDPR consent code check'
    );

    const hasConsentCode = parseInt(consentCheck.stdout.trim()) > 0;

    const passed = filesPresent >= 2 && hasConsentCode;
    const score = Math.round(((filesPresent / gdprFiles.length) * 0.6 + (hasConsentCode ? 0.4 : 0)) * 100);

    return {
      passed,
      score,
      filesPresent,
      totalFiles: gdprFiles.length,
      hasConsentCode,
      recommendations: passed ? [] : [
        'Add privacy policy and terms of service',
        'Implement consent management in code'
      ]
    };
  }

  async checkSecurityHeaders() {
    console.log('🔒 Checking security headers configuration...');

    // Check for security headers in Next.js config or middleware
    const configCheck = await this.runner.runFast(
      'grep -r "security\|headers\|csp\|xss" next.config.* middleware.* --include="*.ts" --include="*.js" -l | wc -l',
      'Security headers configuration check'
    );

    const hasSecurityConfig = parseInt(configCheck.stdout.trim()) > 0;

    // Check for HTTPS enforcement
    const httpsCheck = await this.runner.runFast(
      'grep -r "https\|ssl\|tls" next.config.* --include="*.ts" --include="*.js" -l | wc -l',
      'HTTPS enforcement check'
    );

    const hasHttpsConfig = parseInt(httpsCheck.stdout.trim()) > 0;

    const passed = hasSecurityConfig && hasHttpsConfig;

    return {
      passed,
      hasSecurityConfig,
      hasHttpsConfig,
      recommendations: passed ? [] : [
        'Configure security headers in Next.js config',
        'Enforce HTTPS in production'
      ]
    };
  }

  async checkDependencyLicenses() {
    console.log('🔒 Checking dependency licenses...');

    // Check for license compliance (90s timeout)
    const licenseCheck = await this.runner.run('npx license-checker --json || echo "{}"', 'License compliance check', {
      timeout: 90000
    });

    let licenseIssues = [];
    try {
      const licenses = JSON.parse(licenseCheck.stdout);
      const restrictedLicenses = ['GPL', 'LGPL', 'MS-PL', 'BSD-4-Clause'];

      Object.entries(licenses).forEach(([packageName, info]) => {
        if (restrictedLicenses.some(restricted => info.licenses?.includes(restricted))) {
          licenseIssues.push({
            package: packageName,
            license: info.licenses,
            severity: 'high',
            recommendation: 'Consider alternative package or verify license compatibility'
          });
        }
      });
    } catch {
      // License checker might not be available
    }

    const passed = licenseIssues.length === 0;

    return {
      passed,
      licenseIssues,
      packagesChecked: Object.keys(JSON.parse(licenseCheck.stdout || '{}')).length,
      recommendations: passed ? [] : ['Review and replace packages with restricted licenses']
    };
  }

  async checkCodeStandards() {
    console.log('🔒 Checking code standards compliance...');

    // Check for TypeScript strict mode
    const tsconfigCheck = await this.runner.runFast(
      'grep -q "strict.*true" tsconfig.json && echo "strict" || echo "not-strict"',
      'TypeScript strict mode check'
    );

    const hasStrictMode = tsconfigCheck.stdout.includes('strict');

    // Check for Prettier configuration
    const prettierCheck = await this.runner.runFast(
      'test -f .prettierrc* && echo "prettier" || echo "no-prettier"',
      'Prettier configuration check'
    );

    const hasPrettier = prettierCheck.stdout.includes('prettier');

    const passed = hasStrictMode && hasPrettier;

    return {
      passed,
      hasStrictMode,
      hasPrettier,
      recommendations: passed ? [] : [
        hasStrictMode ? null : 'Enable TypeScript strict mode',
        hasPrettier ? null : 'Add Prettier configuration'
      ].filter(Boolean)
    };
  }

  async checkRuntimeSecurity() {
    console.log('🔍 Checking runtime security...');

    // Check for environment variable exposure
    const envCheck = await this.runner.runFast(
      'grep -r "process\.env\." src/ lib/ --include="*.ts" --include="*.tsx" -l | head -10 | wc -l',
      'Environment variable exposure check'
    );

    const envUsageCount = parseInt(envCheck.stdout.trim());

    // Check for console.log in production code
    const consoleCheck = await this.runner.runFast(
      'grep -r "console\." src/ lib/ --include="*.ts" --include="*.tsx" -l | grep -v "\.test\." | head -10 | wc -l',
      'Console statements in production code'
    );

    const consoleUsageCount = parseInt(consoleCheck.stdout.trim());

    const issues = [];

    if (envUsageCount > 20) { // Arbitrary threshold
      issues.push({
        type: 'environment-exposure',
        severity: 'medium',
        description: `${envUsageCount} environment variable accesses found`,
        recommendation: 'Ensure sensitive env vars are not logged or exposed'
      });
    }

    if (consoleUsageCount > 0) {
      issues.push({
        type: 'console-logging',
        severity: 'low',
        description: `${consoleUsageCount} console statements found in production code`,
        recommendation: 'Remove or replace console statements with proper logging'
      });
    }

    return {
      vulnerabilities: issues,
      envVariableAccess: envUsageCount,
      consoleStatements: consoleUsageCount,
      scanType: 'static analysis'
    };
  }

  async getPackageCount() {
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      return Object.keys(deps).length;
    } catch {
      return 0;
    }
  }

  async getCodeFileCount() {
    try {
      const result = await this.runner.runFast(
        'find src lib -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | wc -l',
        'Code file count'
      );
      return parseInt(result.stdout.trim());
    } catch {
      return 0;
    }
  }

  calculateSecuritySummary(scans) {
    let totalVulnerabilities = 0;
    let highSeverity = 0;
    let mediumSeverity = 0;
    let lowSeverity = 0;
    let complianceScore = 100;

    scans.forEach(scan => {
      if (scan.result?.vulnerabilities) {
        totalVulnerabilities += scan.result.vulnerabilities.length;

        scan.result.vulnerabilities.forEach(vuln => {
          switch (vuln.severity) {
            case 'high':
            case 'critical':
              highSeverity++;
              break;
            case 'medium':
            case 'moderate':
              mediumSeverity++;
              break;
            case 'low':
            case 'info':
              lowSeverity++;
              break;
          }
        });
      }

      if (scan.result?.complianceScore !== undefined) {
        complianceScore = Math.min(complianceScore, scan.result.complianceScore);
      }
    });

    return {
      totalVulnerabilities,
      highSeverity,
      mediumSeverity,
      lowSeverity,
      complianceScore,
      status: 'calculated'
    };
  }

  generateScanId() {
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

  async saveSecurityReport(securityScan) {
    const reportPath = path.join(this.securityDir, `security-scan-${securityScan.id}.json`);

    try {
      await fs.writeFile(reportPath, JSON.stringify(securityScan, null, 2));
      console.log(`💾 Security report saved: ${reportPath}`);
    } catch (error) {
      console.warn(`Failed to save security report: ${error.message}`);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const automation = new SecurityAutomation();

  await automation.initialize();

  // Parse CLI options
  let environment = 'development';
  let skipDependencyScan = false;
  let skipCodeScan = false;
  let skipComplianceCheck = false;
  let failOnHighSeverity = true;
  let generateReport = true;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--env':
      case '--environment':
        environment = args[i + 1];
        i++;
        break;
      case '--skip-deps':
        skipDependencyScan = true;
        break;
      case '--skip-code':
        skipCodeScan = true;
        break;
      case '--skip-compliance':
        skipComplianceCheck = true;
        break;
      case '--no-fail-high':
        failOnHighSeverity = false;
        break;
      case '--no-report':
        generateReport = false;
        break;
    }
  }

  try {
    await automation.runSecurityPipeline({
      environment,
      skipDependencyScan,
      skipCodeScan,
      skipComplianceCheck,
      failOnHighSeverity,
      generateReport
    });
    process.exit(0);
  } catch (error) {
    console.error(`\n💥 Security pipeline failed: ${error.message}`);
    process.exit(1);
  }
}

// Export for use as module
export { SecurityAutomation };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
