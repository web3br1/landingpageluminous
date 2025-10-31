#!/usr/bin/env node

/**
 * Cursor HUD - Heads-Up Display for TDD Loop Status
 * Shows real-time status of build, tests, coverage, and quality gates
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const HUD_CONFIG = {
  logFiles: {
    build: 'tmp/build.log',
    tests: 'tmp/test-results.json',
    coverage: 'coverage/coverage-summary.json',
    quality: 'tmp/ci-reports/latest-report.json'
  },
  colors: {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  }
};

class CursorHUD {
  constructor() {
    this.status = {
      build: 'unknown',
      tests: 'unknown',
      coverage: 'unknown',
      quality: 'unknown'
    };
    this.lastUpdate = new Date();
  }

  async update() {
    // Check build status
    this.status.build = await this.checkBuildStatus();

    // Check test status
    this.status.tests = await this.checkTestStatus();

    // Check coverage status
    this.status.coverage = await this.checkCoverageStatus();

    // Check quality gate status
    this.status.quality = await this.checkQualityStatus();

    this.lastUpdate = new Date();
  }

  async checkBuildStatus() {
    try {
      // Check if .next directory exists (build successful)
      if (fs.existsSync('.next')) {
        // Check for recent build log
        if (fs.existsSync(HUD_CONFIG.logFiles.build)) {
          const stats = fs.statSync(HUD_CONFIG.logFiles.build);
          const age = Date.now() - stats.mtime.getTime();
          if (age < 300000) { // 5 minutes
            return 'success';
          }
        }
        return 'success';
      }
      return 'failed';
    } catch {
      return 'unknown';
    }
  }

  async checkTestStatus() {
    try {
      if (fs.existsSync(HUD_CONFIG.logFiles.tests)) {
        const content = fs.readFileSync(HUD_CONFIG.logFiles.tests, 'utf8');
        const results = JSON.parse(content);

        const total = results.numTotalTests || 0;
        const failed = results.numFailedTests || 0;
        const successRate = total > 0 ? ((total - failed) / total) * 100 : 0;

        if (successRate >= 90) return 'success';
        if (successRate >= 75) return 'warning';
        return 'failed';
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async checkCoverageStatus() {
    try {
      if (fs.existsSync(HUD_CONFIG.logFiles.coverage)) {
        const content = fs.readFileSync(HUD_CONFIG.logFiles.coverage, 'utf8');
        const coverage = JSON.parse(content);

        const totalCoverage = coverage.total?.lines?.pct || 0;

        if (totalCoverage >= 80) return 'success';
        if (totalCoverage >= 60) return 'warning';
        return 'failed';
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async checkQualityStatus() {
    try {
      if (fs.existsSync(HUD_CONFIG.logFiles.quality)) {
        const content = fs.readFileSync(HUD_CONFIG.logFiles.quality, 'utf8');
        const report = JSON.parse(content);

        const score = report.summary?.efficiencyScore || 0;

        if (score >= 80) return 'success';
        if (score >= 60) return 'warning';
        return 'failed';
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async getAdaptiveSuggestions() {
    return new Promise((resolve) => {
      const child = spawn('node', ['scripts/hud-adaptive.mjs', 'insights'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        try {
          const insights = JSON.parse(output);
          resolve(insights);
        } catch (error) {
          resolve({ suggestions: [], adaptiveMode: false });
        }
      });

      child.on('error', () => {
        resolve({ suggestions: [], adaptiveMode: false });
      });
    });
  }

  async recordExecutionForAdaptive() {
    const execution = {
      build: this.status.build,
      tests: this.status.tests,
      coverage: this.status.coverage,
      quality: this.status.quality,
      overall: this.getOverallStatus()
    };

    const child = spawn('node', ['scripts/hud-adaptive.mjs', 'record', JSON.stringify(execution)], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    return new Promise((resolve) => {
      child.on('close', resolve);
    });
  }

  async render() {
    const { colors } = HUD_CONFIG;

    const statusIcons = {
      success: `${colors.green}✅${colors.reset}`,
      warning: `${colors.yellow}⚠️${colors.reset}`,
      failed: `${colors.red}❌${colors.reset}`,
      unknown: `${colors.cyan}❓${colors.reset}`
    };

    const statusLabels = {
      success: `${colors.green}OK${colors.reset}`,
      warning: `${colors.yellow}WARN${colors.reset}`,
      failed: `${colors.red}FAIL${colors.reset}`,
      unknown: `${colors.cyan}UNK${colors.reset}`
    };

    // Remove console.clear() for VSCode terminal compatibility
    console.log(''); // Add spacing
    console.log(`${colors.bright}${colors.cyan}🎯 CURSOR TDD HUD${colors.reset}`);
    console.log(`${colors.white}Last update: ${this.lastUpdate.toLocaleTimeString()}${colors.reset}`);
    console.log('');

    // Build Status
    console.log(`${colors.blue}🧱 Build${colors.reset}: ${statusIcons[this.status.build]} ${statusLabels[this.status.build]}`);

    // Tests Status
    console.log(`${colors.blue}🧪 Tests${colors.reset}: ${statusIcons[this.status.tests]} ${statusLabels[this.status.tests]}`);

    // Coverage Status
    console.log(`${colors.blue}📊 Coverage${colors.reset}: ${statusIcons[this.status.coverage]} ${statusLabels[this.status.coverage]}`);

    // Quality Gate Status
    console.log(`${colors.blue}🚦 Quality${colors.reset}: ${statusIcons[this.status.quality]} ${statusLabels[this.status.quality]}`);

    console.log('');
    console.log(`${colors.magenta}🎛️  Controls:${colors.reset}`);
    console.log(`  ${colors.white}⌘⇧R${colors.reset}: Build | ${colors.white}⌘⇧T${colors.reset}: Test Crit | ${colors.white}⌘⇧U${colors.reset}: Test Unit | ${colors.white}⌘⇧G${colors.reset}: Quality Gate`);
    console.log(`  ${colors.white}⌘⇧C${colors.reset}: Clean Hard | ${colors.white}⌘⇧E${colors.reset}: Smoke E2E | ${colors.white}⌘⇧S${colors.reset}: Test SSR`);

    // Overall status
    const overallStatus = this.getOverallStatus();
    console.log('');
    console.log(`${colors.bright}📈 Overall: ${statusIcons[overallStatus]} ${statusLabels[overallStatus]}${colors.reset}`);

    // Sistema adaptativo
    try {
      const adaptive = await this.getAdaptiveSuggestions();

      if (adaptive.adaptiveMode && adaptive.suggestions && adaptive.suggestions.length > 0) {
        console.log('');
        console.log(`${colors.magenta}🧠 Sistema Adaptativo:${colors.reset}`);
        adaptive.suggestions.slice(0, 2).forEach(suggestion => {
          console.log(`  ${suggestion}`);
        });
      }
    } catch (error) {
      // Silently ignore adaptive system errors
    }

    // Next recommended action
    const nextAction = this.getNextAction();
    if (nextAction) {
      console.log(`${colors.yellow}💡 Next: ${nextAction}${colors.reset}`);
    }

    // Registrar execução para aprendizado adaptativo
    try {
      await this.recordExecutionForAdaptive();
    } catch (error) {
      // Silently ignore recording errors
    }
  }

  getOverallStatus() {
    const statuses = Object.values(this.status);

    if (statuses.includes('failed')) return 'failed';
    if (statuses.includes('warning')) return 'warning';
    if (statuses.every(s => s === 'success')) return 'success';

    return 'unknown';
  }

  getNextAction() {
    if (this.status.build === 'failed') return 'Fix build errors first';
    if (this.status.tests === 'failed') return 'Run critical tests and fix failures';
    if (this.status.coverage === 'failed') return 'Improve test coverage';
    if (this.status.quality === 'failed') return 'Address quality gate issues';

    if (this.status.build === 'unknown') return 'Run build to get status';
    if (this.status.tests === 'unknown') return 'Run tests to get status';

    return 'System healthy - ready for development';
  }

  async watch() {
    await this.update();
    this.render();

    // Watch for file changes and update HUD
    const watchPaths = Object.values(HUD_CONFIG.logFiles);

    for (const watchPath of watchPaths) {
      try {
        if (!fs.existsSync(path.dirname(watchPath))) {
          fs.mkdirSync(path.dirname(watchPath), { recursive: true });
        }

        fs.watchFile(watchPath, { interval: 1000 }, async () => {
          await this.update();
          this.render();
        });
      } catch {
        // Ignore watch setup errors
      }
    }
  }

  async runOnce() {
    await this.update();
    this.render();
  }
}

// ===== CLI INTERFACE =====
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'show';

  const hud = new CursorHUD();

  switch (command) {
    case 'watch':
      console.log('Starting HUD watch mode... (Ctrl+C to exit)');
      await hud.watch();
      break;

    case 'show':
    default:
      await hud.runOnce();
      break;
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 HUD stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 HUD stopped');
  process.exit(0);
});

main().catch(error => {
  console.error('💥 HUD error:', error.message);
  process.exit(1);
});
