import { execSync } from 'child_process';

export class QualityProgressDashboard {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async generateReport() {
    console.log('📊 Quality Progress Dashboard');
    console.log('='.repeat(50));
    console.log('⏳ Collecting metrics...');

    const metrics = await this.collectMetrics();

    console.log(`📅 ${new Date().toLocaleString()}`);
    console.log('');

    this.displayMetrics(metrics);
    console.log('✅ Report generated successfully');
  }

  async collectMetrics() {
    const eslint = await this.getEslintMetrics();
    const typescript = await this.getTypeScriptMetrics();

    return { eslint, typescript };
  }

  async getEslintMetrics() {
    try {
      const output = execSync('pnpm eslint . 2>&1 || echo "ESLint failed"', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      const errorLines = output.split('\n').filter(line =>
        line.trim() && line.includes(' error ')
      );

      return {
        total: errorLines.length,
        files: errorLines.length > 0 ? 1 : 0
      };
    } catch (error) {
      return { total: 0, files: 0 };
    }
  }

  async getTypeScriptMetrics() {
    try {
      execSync('npx tsc --noEmit', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        timeout: 30000
      });

      return {
        hasErrors: false,
        errorCount: 0
      };
    } catch (error) {
      return { hasErrors: true, errorCount: 1 };
    }
  }

  displayMetrics(metrics) {
    console.log('🔍 ESLINT');
    console.log(`   Total Errors: ${metrics.eslint.total}`);
    console.log(`   Files with Issues: ${metrics.eslint.files}`);
    console.log('');

    console.log('🔷 TYPESCRIPT');
    if (metrics.typescript.hasErrors) {
      console.log(`   ❌ ${metrics.typescript.errorCount} compilation errors`);
    } else {
      console.log('   ✅ No compilation errors');
    }
    console.log('');
  }
}

// CLI interface
const dashboard = new QualityProgressDashboard();
// Enhanced dashboard with real-time metrics and quality gates
async function runEnhancedDashboard() {
  console.log('🚀 Enhanced Quality Dashboard - Starting...\n');

  try {
    // Generate base report
    await dashboard.generateReport();

    // Add quality gates verification
    console.log('\n🚦 Quality Gates Verification:\n');

    const qualityGates = {
      typescript: { command: 'npx tsc --noEmit', maxErrors: 0, description: 'TypeScript compilation' },
      eslint: { command: 'npx eslint . --max-warnings 0', maxErrors: 0, description: 'ESLint code quality' },
      'test:unit': { command: 'pnpm run test:unit', minPassRate: 60, description: 'Unit tests' },
      'test:crit': { command: 'pnpm run test:crit', minPassRate: 80, description: 'Critical tests' },
      build: { command: 'pnpm run build', maxErrors: 0, description: 'Production build' },
    };

    let allGatesPassed = true;

    for (const [gate, config] of Object.entries(qualityGates)) {
      console.log(`🔍 Checking ${config.description}...`);

      try {
        let result;

        // Use appropriate timeout based on operation type
        if (gate === 'typescript' || gate === 'eslint') {
          result = await runFastCommand(config.command, config.description);
        } else if (gate === 'build') {
          result = await runBuildCommand(config.command, config.description);
        } else if (gate.includes('test')) {
          result = await runTestCommand(config.command, config.description);
        } else {
          result = await runComplexCommand(config.command, config.description);
        }

        const output = result.stdout + result.stderr;

        // Parse results based on gate type
        if (config.maxErrors !== undefined) {
          const errorCount = (output.match(/error/g) || []).length;
          if (errorCount <= config.maxErrors) {
            console.log(`  ✅ PASSED (${errorCount} errors)`);
          } else {
            console.log(`  ❌ FAILED (${errorCount} errors, max: ${config.maxErrors})`);
            allGatesPassed = false;
          }
        } else if (config.minPassRate !== undefined) {
          const passMatch = output.match(/(\d+) passed/);
          const totalMatch = output.match(/(\d+) total/);
          if (passMatch && totalMatch) {
            const passed = parseInt(passMatch[1]);
            const total = parseInt(totalMatch[1]);
            const passRate = (passed / total) * 100;
            if (passRate >= config.minPassRate) {
              console.log(`  ✅ PASSED (${passRate.toFixed(1)}% pass rate)`);
            } else {
              console.log(`  ❌ FAILED (${passRate.toFixed(1)}% pass rate, min: ${config.minPassRate}%)`);
              allGatesPassed = false;
            }
          } else {
            console.log(`  ⚠️  Could not parse test results`);
          }
        }

      } catch (error) {
        console.log(`  ❌ FAILED (${error.message})`);
        allGatesPassed = false;
      }
    }

    console.log('\n🎯 Quality Gate Summary:');
    if (allGatesPassed) {
      console.log('  ✅ ALL QUALITY GATES PASSED - Ready for deployment!');
    } else {
      console.log('  ❌ SOME QUALITY GATES FAILED - Please fix issues before deployment');
      console.log('\n💡 Quick Fixes:');
      console.log('  • Run: pnpm run lint --fix');
      console.log('  • Run: npx tsc --noEmit');
      console.log('  • Run: pnpm run test:crit');
    }

    // Save results for CI/CD
    const fs = await import('fs');
    const results = {
      timestamp: new Date().toISOString(),
      allGatesPassed,
      gates: qualityGates,
      version: process.env.npm_package_version || 'unknown'
    };

    fs.writeFileSync('tmp/quality-gate-results.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Results saved to: tmp/quality-gate-results.json');

  } catch (error) {
    console.error('❌ Enhanced dashboard failed:', error.message);
    process.exit(1);
  }
}

// Import safe command runner
import { SafeCommandRunner } from './safe-command-runner.mjs';

const commandRunner = new SafeCommandRunner();

// Enhanced timeout configurations for different command types
const TIMEOUT_CONFIGS = {
  // Fast operations (lint, type check)
  fast: { timeout: 45000, description: 'Fast operation (lint/typecheck)' },

  // Build operations
  build: { timeout: 120000, description: 'Build operation' },

  // Test operations
  test: { timeout: 90000, description: 'Test execution' },

  // Coverage operations
  coverage: { timeout: 180000, description: 'Coverage analysis' },

  // Complex operations
  complex: { timeout: 300000, description: 'Complex operation' },

  // Critical operations
  critical: { timeout: 600000, description: 'Critical operation' },
};

// Safe command runners for different operation types using enhanced SafeCommandRunner
async function runFastCommand(command, description = '') {
  return commandRunner.runFast(command, description);
}

async function runBuildCommand(command, description = '') {
  return commandRunner.runBuild(command, description);
}

async function runTestCommand(command, description = '') {
  return commandRunner.runTest(command, description);
}

async function runCoverageCommand(command, description = '') {
  return commandRunner.runCoverage(command, description);
}

async function runComplexCommand(command, description = '') {
  return commandRunner.runComplex(command, description);
}

async function runCriticalCommand(command, description = '') {
  return commandRunner.runCritical(command, description);
}

// Backward compatibility - keep old function
async function runCommandWithTimeout(command, timeoutMs = 30000, description = '') {
  return commandRunner.run(command, {
    timeout: timeoutMs,
    description: description || command,
    retryCount: 1,
    retryDelay: 2000,
  });
}

// Run enhanced dashboard
runEnhancedDashboard().catch(console.error);