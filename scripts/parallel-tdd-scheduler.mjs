#!/usr/bin/env node

/**
 * Parallel TDD Scheduler - Multi-Agent Orchestration System
 * Executes War-Room, Stability Scanner, and Optimization Sprint in parallel
 * with intelligent concurrency control and consolidated reporting
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
const sleep = promisify(setTimeout);

// ===== CONFIGURATION =====
const CONFIG = {
  maxConcurrency: 2, // Maximum parallel executions
  niceLevels: {
    'war-room': -10, // High priority for critical fixes
    'stability-scanner': 0, // Normal priority for monitoring
    'optimization-sprint': 5, // Lower priority for improvements
  },
  timeouts: {
    'war-room': 30 * 60 * 1000, // 30 minutes
    'stability-scanner': 15 * 60 * 1000, // 15 minutes
    'optimization-sprint': 20 * 60 * 1000, // 20 minutes
  },
  retryAttempts: 2,
  outputDir: 'tmp/parallel-tdd',
  logFile: 'tmp/parallel-tdd/scheduler.log',
};

// ===== AGENTS DEFINITION =====
const AGENTS = {
  'war-room': {
    name: 'War-Room TDD',
    description: 'Critical fixes and stabilization',
    script: 'scripts/war-room-tdd.mjs',
    priority: 'high',
    trigger: 'manual', // Only run when explicitly requested
  },
  'stability-scanner': {
    name: 'Stability Scanner',
    description: 'Continuous monitoring and regression detection',
    script: 'scripts/stability-scanner.mjs',
    priority: 'normal',
    trigger: 'scheduled', // Run daily or on merges
  },
  'optimization-sprint': {
    name: 'Optimization Sprint',
    description: 'Incremental improvements and performance gains',
    script: 'scripts/optimization-sprint.mjs',
    priority: 'low',
    trigger: 'background', // Run continuously in background
  },
};

// ===== UTILITY FUNCTIONS =====
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

  console.log(logEntry.trim());

  // Ensure log directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  fs.appendFileSync(CONFIG.logFile, logEntry);
}

function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function createOutputDirs(agentId) {
  const agentDir = path.join(CONFIG.outputDir, agentId);
  const timestamp = getTimestamp();
  const runDir = path.join(agentDir, timestamp);

  fs.mkdirSync(runDir, { recursive: true });

  return {
    agentDir,
    runDir,
    logFile: path.join(runDir, 'execution.log'),
    reportFile: path.join(runDir, 'report.json'),
    statusFile: path.join(runDir, 'status.json'),
  };
}

// ===== EXECUTION ENGINE =====
class AgentExecutor {
  constructor(agentId, agentConfig) {
    this.agentId = agentId;
    this.config = agentConfig;
    this.running = false;
    this.attempts = 0;
  }

  async execute(maxRetries = CONFIG.retryAttempts) {
    const dirs = createOutputDirs(this.agentId);
    const startTime = Date.now();

    log(`🚀 Starting ${this.config.name} (${this.agentId})`, 'info');

    // Update status
    this.updateStatus(dirs, 'running', { startTime });

    try {
      const result = await this.runWithTimeout(dirs);
      const duration = Date.now() - startTime;

      if (result.success) {
        log(`✅ ${this.config.name} completed successfully in ${duration}ms`, 'success');
        this.updateStatus(dirs, 'completed', { duration, result: result.data });
        return { success: true, duration, result: result.data, dirs };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      log(`❌ ${this.config.name} failed after ${duration}ms: ${error.message}`, 'error');

      this.attempts++;
      if (this.attempts < maxRetries) {
        log(`🔄 Retrying ${this.config.name} (attempt ${this.attempts + 1}/${maxRetries})`, 'warn');
        await sleep(2000); // Wait 2 seconds before retry
        return this.execute(maxRetries - 1);
      } else {
        this.updateStatus(dirs, 'failed', { duration, error: error.message });
        return { success: false, duration, error: error.message, dirs };
      }
    }
  }

  async runWithTimeout(dirs) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout after ${CONFIG.timeouts[this.agentId]}ms`));
      }, CONFIG.timeouts[this.agentId]);

      // Check if script exists
      if (!fs.existsSync(this.config.script)) {
        clearTimeout(timeout);
        resolve({
          success: false,
          error: `Script not found: ${this.config.script}`
        });
        return;
      }

      // Execute with nice priority
      const niceLevel = CONFIG.niceLevels[this.agentId] || 0;
      const command = process.platform === 'win32'
        ? `node ${this.config.script}`
        : `nice -n ${niceLevel} node ${this.config.script}`;

      log(`Executing: ${command}`, 'debug');

      const child = spawn(command, [], {
        shell: true,
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          TDD_AGENT_ID: this.agentId,
          TDD_OUTPUT_DIR: dirs.runDir,
        }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        log(`[${this.agentId}] ${data.toString().trim()}`, 'debug');
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        log(`[${this.agentId}] ERROR: ${data.toString().trim()}`, 'warn');
      });

      child.on('close', (code) => {
        clearTimeout(timeout);

        // Save output to files
        fs.writeFileSync(dirs.logFile, `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`);

        if (code === 0) {
          // Try to parse JSON output
          try {
            const result = JSON.parse(stdout.trim() || '{}');
            resolve({ success: true, data: result });
          } catch {
            resolve({ success: true, data: { output: stdout.trim() } });
          }
        } else {
          resolve({
            success: false,
            error: `Exit code ${code}: ${stderr.trim() || 'Unknown error'}`
          });
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        resolve({ success: false, error: error.message });
      });
    });
  }

  updateStatus(dirs, status, data) {
    const statusData = {
      agentId: this.agentId,
      name: this.config.name,
      status,
      timestamp: new Date().toISOString(),
      attempts: this.attempts,
      ...data,
    };

    fs.writeFileSync(dirs.statusFile, JSON.stringify(statusData, null, 2));
  }
}

// ===== SCHEDULER =====
class TDDParallelScheduler {
  constructor() {
    this.executors = new Map();
    this.results = new Map();
    this.startTime = Date.now();

    // Initialize executors
    Object.entries(AGENTS).forEach(([agentId, config]) => {
      this.executors.set(agentId, new AgentExecutor(agentId, config));
    });
  }

  async schedule(requestedAgents = null) {
    log('🎯 Starting Parallel TDD Scheduler', 'info');
    log(`📊 Max concurrency: ${CONFIG.maxConcurrency}`, 'info');

    // Filter agents to run
    const agentsToRun = requestedAgents
      ? requestedAgents.filter(id => this.executors.has(id))
      : Array.from(this.executors.keys());

    log(`🎯 Executing agents: ${agentsToRun.join(', ')}`, 'info');

    // Execute in controlled concurrency
    const results = await this.executeWithConcurrency(agentsToRun);

    // Generate consolidated report
    const report = this.generateConsolidatedReport(results);

    // Save report
    this.saveReport(report);

    log('🎉 Parallel TDD Scheduler completed', 'success');
    log(`📊 Overall efficiency score: ${report.summary.efficiencyScore}`, 'info');

    return report;
  }

  async executeWithConcurrency(agentIds) {
    const results = new Map();
    const running = new Set();
    const queue = [...agentIds];

    while (queue.length > 0 || running.size > 0) {
      // Start new agents if under concurrency limit
      while (running.size < CONFIG.maxConcurrency && queue.length > 0) {
        const agentId = queue.shift();
        const executor = this.executors.get(agentId);

        if (executor) {
          running.add(agentId);

          // Execute asynchronously
          executor.execute().then(result => {
            results.set(agentId, result);
            running.delete(agentId);
            log(`🏁 Agent ${agentId} finished`, 'info');
          }).catch(error => {
            log(`💥 Agent ${agentId} crashed: ${error.message}`, 'error');
            results.set(agentId, { success: false, error: error.message });
            running.delete(agentId);
          });
        }
      }

      // Wait a bit before checking again
      await sleep(100);
    }

    // Wait for all to complete
    while (running.size > 0) {
      await sleep(500);
    }

    return results;
  }

  generateConsolidatedReport(results) {
    const totalDuration = Date.now() - this.startTime;
    const successful = Array.from(results.values()).filter(r => r.success).length;
    const total = results.size;

    // Calculate efficiency metrics
    const efficiencyMetrics = this.calculateEfficiencyMetrics(results);

    const report = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      agents: Object.fromEntries(
        Array.from(results.entries()).map(([id, result]) => [
          id,
          {
            name: AGENTS[id].name,
            success: result.success,
            duration: result.duration,
            error: result.error || null,
            outputDir: result.dirs?.runDir || null,
          }
        ])
      ),
      summary: {
        totalAgents: total,
        successfulAgents: successful,
        failedAgents: total - successful,
        successRate: total > 0 ? (successful / total * 100).toFixed(1) : '0',
        totalDuration,
        efficiencyScore: efficiencyMetrics.score,
        maturityTrend: efficiencyMetrics.trend,
      },
      efficiency: efficiencyMetrics,
      recommendations: this.generateRecommendations(results),
    };

    return report;
  }

  calculateEfficiencyMetrics(results) {
    let totalDuration = 0;
    let successfulDuration = 0;
    let coverageGain = 0;
    let perfImprovements = 0;

    for (const [agentId, result] of results) {
      if (result.success) {
        totalDuration += result.duration;
        successfulDuration += result.duration;

        // Extract metrics from result data
        if (result.result) {
          if (result.result.coverage_gain_estimated) {
            coverageGain += result.result.coverage_gain_estimated;
          }
          if (result.result.perf_improvements) {
            perfImprovements += result.result.perf_improvements;
          }
        }
      }
    }

    // Calculate efficiency score (0-100)
    const successRate = results.size > 0 ? Array.from(results.values()).filter(r => r.success).length / results.size : 0;
    const efficiencyScore = Math.round((successRate * 60) + (coverageGain * 0.2) + (perfImprovements * 0.2));

    // Determine trend
    let trend = 'steady';
    if (efficiencyScore > 80) trend = 'up';
    else if (efficiencyScore < 50) trend = 'down';

    return {
      score: Math.min(100, Math.max(0, efficiencyScore)),
      trend,
      metrics: {
        coverageGain,
        perfImprovements,
        avgDuration: totalDuration / Math.max(1, results.size),
      },
    };
  }

  generateRecommendations(results) {
    const recommendations = [];

    const failedAgents = Array.from(results.entries())
      .filter(([, result]) => !result.success)
      .map(([id]) => id);

    if (failedAgents.length > 0) {
      recommendations.push(`🔴 Fix failed agents: ${failedAgents.join(', ')}`);
    }

    // Check for performance issues
    const slowAgents = Array.from(results.entries())
      .filter(([, result]) => result.duration > 300000) // 5 minutes
      .map(([id]) => id);

    if (slowAgents.length > 0) {
      recommendations.push(`⏱️ Optimize slow agents: ${slowAgents.join(', ')}`);
    }

    // General recommendations
    recommendations.push('📊 Review efficiency metrics and adjust priorities');
    recommendations.push('🔄 Consider increasing concurrency if agents are waiting');

    return recommendations;
  }

  saveReport(report) {
    const reportFile = path.join(CONFIG.outputDir, `consolidated-report-${getTimestamp()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    log(`📄 Consolidated report saved: ${reportFile}`, 'info');

    // Also save latest report
    const latestFile = path.join(CONFIG.outputDir, 'latest-report.json');
    fs.writeFileSync(latestFile, JSON.stringify(report, null, 2));
  }
}

// ===== CLI INTERFACE =====
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'run';

  switch (command) {
    case 'run':
      const requestedAgents = args.slice(1).length > 0 ? args.slice(1) : null;
      const scheduler = new TDDParallelScheduler();
      await scheduler.schedule(requestedAgents);
      break;

    case 'list':
      log('Available TDD Agents:', 'info');
      Object.entries(AGENTS).forEach(([id, config]) => {
        log(`  ${id}: ${config.name} - ${config.description}`, 'info');
      });
      break;

    case 'status':
      const latestReportFile = path.join(CONFIG.outputDir, 'latest-report.json');
      if (fs.existsSync(latestReportFile)) {
        const report = JSON.parse(fs.readFileSync(latestReportFile, 'utf8'));
        log('Latest Execution Status:', 'info');
        log(`  Efficiency Score: ${report.summary.efficiencyScore}`, 'info');
        log(`  Success Rate: ${report.summary.successRate}%`, 'info');
        log(`  Trend: ${report.summary.maturityTrend}`, 'info');
      } else {
        log('No previous execution found', 'warn');
      }
      break;

    default:
      log('Usage:', 'info');
      log('  node parallel-tdd-scheduler.mjs run [agent1 agent2 ...]  # Run specific agents or all', 'info');
      log('  node parallel-tdd-scheduler.mjs list                       # List available agents', 'info');
      log('  node parallel-tdd-scheduler.mjs status                     # Show latest status', 'info');
      process.exit(1);
  }
}

// ===== ERROR HANDLING =====
process.on('uncaughtException', (error) => {
  log(`💥 Uncaught exception: ${error.message}`, 'error');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 Unhandled rejection: ${reason}`, 'error');
  process.exit(1);
});

// ===== EXECUTE =====
main().catch(error => {
  log(`💥 Scheduler failed: ${error.message}`, 'error');
  process.exit(1);
});
