#!/usr/bin/env node

/**
 * Safe Command Runner with Timeouts
 * Executes commands with proper timeout handling and error recovery
 */

import { spawn } from 'child_process';
import { performance } from 'perf_hooks';

class SafeCommandRunner {
  constructor() {
    this.activeProcesses = new Set();
  }

  /**
   * Execute command with timeout and proper cleanup
   */
  async run(command, options = {}) {
    const {
      timeout = 30000,
      cwd = process.cwd(),
      env = { ...process.env },
      description = command,
      killSignal = 'SIGTERM',
      retryCount = 0,
      retryDelay = 1000,
    } = options;

    let lastError;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      if (attempt > 0) {
        console.log(`🔄 Retrying command (attempt ${attempt}/${retryCount}): ${description}`);
        await this.delay(retryDelay);
      }

      try {
        const result = await this.executeCommand(command, {
          timeout,
          cwd,
          env,
          description,
          killSignal,
        });

        return result;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️  Command attempt ${attempt + 1} failed: ${description}`);
        console.warn(`   Error: ${error.message}`);

        if (attempt < retryCount) {
          continue;
        }
      }
    }

    throw lastError;
  }

  async executeCommand(command, options) {
    return new Promise((resolve, reject) => {
      const { timeout, cwd, env, description, killSignal } = options;

      console.log(`🚀 Executing: ${description}`);
      console.log(`   Command: ${command}`);
      console.log(`   Timeout: ${timeout}ms`);
      console.log(`   CWD: ${cwd}`);

      const startTime = performance.now();
      let timeoutId;
      let childProcess;

      // Parse command and arguments
      const [cmd, ...args] = this.parseCommand(command);

      try {
        childProcess = spawn(cmd, args, {
          cwd,
          env,
          stdio: ['inherit', 'pipe', 'pipe'],
          shell: true,
        });

        this.activeProcesses.add(childProcess);

        let stdout = '';
        let stderr = '';

        // Handle stdout
        childProcess.stdout.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          process.stdout.write(output);
        });

        // Handle stderr
        childProcess.stderr.on('data', (data) => {
          const output = data.toString();
          stderr += output;
          process.stderr.write(output);
        });

        // Set up timeout
        timeoutId = setTimeout(() => {
          console.error(`⏰ Command timed out after ${timeout}ms: ${description}`);

          if (childProcess && !childProcess.killed) {
            console.log(`🛑 Sending ${killSignal} to process...`);
            childProcess.kill(killSignal);

            // Force kill after grace period
            setTimeout(() => {
              if (childProcess && !childProcess.killed) {
                console.log(`💀 Force killing process...`);
                childProcess.kill('SIGKILL');
              }
            }, 5000);
          }

          reject(new Error(`Command timed out: ${description}`));
        }, timeout);

        // Handle process completion
        childProcess.on('close', (code, signal) => {
          const duration = performance.now() - startTime;

          clearTimeout(timeoutId);
          this.activeProcesses.delete(childProcess);

          console.log(`✅ Command completed: ${description}`);
          console.log(`   Duration: ${duration.toFixed(2)}ms`);
          console.log(`   Exit code: ${code}`);
          console.log(`   Signal: ${signal || 'none'}`);

          if (code === 0) {
            resolve({
              code,
              signal,
              stdout,
              stderr,
              duration,
            });
          } else {
            const error = new Error(
              `Command failed with exit code ${code}: ${description}`
            );
            error.code = code;
            error.signal = signal;
            error.stdout = stdout;
            error.stderr = stderr;
            reject(error);
          }
        });

        // Handle spawn errors
        childProcess.on('error', (error) => {
          clearTimeout(timeoutId);
          this.activeProcesses.delete(childProcess);

          console.error(`❌ Command spawn error: ${description}`);
          console.error(`   Error: ${error.message}`);

          reject(new Error(`Command spawn failed: ${description} - ${error.message}`));
        });

      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        if (childProcess) this.activeProcesses.delete(childProcess);

        reject(new Error(`Command setup failed: ${description} - ${error.message}`));
      }
    });
  }

  parseCommand(command) {
    // Simple command parsing - can be enhanced for complex cases
    return command.split(' ').filter(arg => arg.length > 0);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Helper methods for common operations with optimized timeouts
   */
  async runFast(command, description = '') {
    return this.run(command, {
      timeout: 45000,
      description: description || 'Fast operation (lint/typecheck)',
      retryCount: 1,
      retryDelay: 1000
    });
  }

  async runBuild(command, description = '') {
    return this.run(command, {
      timeout: 120000,
      description: description || 'Build operation',
      retryCount: 1,
      retryDelay: 2000
    });
  }

  async runTest(command, description = '') {
    return this.run(command, {
      timeout: 90000,
      description: description || 'Test execution',
      retryCount: 1,
      retryDelay: 1500
    });
  }

  async runCoverage(command, description = '') {
    return this.run(command, {
      timeout: 180000,
      description: description || 'Coverage analysis',
      retryCount: 0 // No retry for coverage (expensive)
    });
  }

  async runComplex(command, description = '') {
    return this.run(command, {
      timeout: 300000,
      description: description || 'Complex operation',
      retryCount: 0 // No retry for complex operations
    });
  }

  async runCritical(command, description = '') {
    return this.run(command, {
      timeout: 600000,
      description: description || 'Critical operation',
      retryCount: 2, // Extra retry for critical operations
      retryDelay: 3000
    });
  }

  /**
   * Clean up all active processes
   */
  cleanup() {
    console.log(`🧹 Cleaning up ${this.activeProcesses.size} active processes...`);

    for (const process of this.activeProcesses) {
      if (!process.killed) {
        try {
          console.log(`🛑 Terminating process ${process.pid}...`);
          process.kill('SIGTERM');

          // Force kill after grace period
          setTimeout(() => {
            if (!process.killed) {
              console.log(`💀 Force killing process ${process.pid}...`);
              process.kill('SIGKILL');
            }
          }, 5000);
        } catch (error) {
          console.warn(`Failed to kill process ${process.pid}: ${error.message}`);
        }
      }
    }

    this.activeProcesses.clear();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️  Received SIGINT, cleaning up...');
  const runner = global.commandRunner;
  if (runner) {
    runner.cleanup();
  }
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Received SIGTERM, cleaning up...');
  const runner = global.commandRunner;
  if (runner) {
    runner.cleanup();
  }
  process.exit(143);
});

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node safe-command-runner.mjs <command> [options]');
    console.error('Options:');
    console.error('  --timeout <ms>    Command timeout in milliseconds (default: 30000)');
    console.error('  --retry <count>   Number of retries on failure (default: 0)');
    console.error('  --description <text> Description for logging');
    process.exit(1);
  }

  const runner = new SafeCommandRunner();
  global.commandRunner = runner;

  let command = '';
  let timeout = 30000;
  let retryCount = 0;
  let description = '';

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--timeout' && i + 1 < args.length) {
      timeout = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--retry' && i + 1 < args.length) {
      retryCount = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--description' && i + 1 < args.length) {
      description = args[i + 1];
      i++;
    } else if (!command) {
      command = arg;
    } else {
      command += ' ' + arg;
    }
  }

  if (!command) {
    console.error('❌ No command specified');
    process.exit(1);
  }

  try {
    const result = await runner.run(command, {
      timeout,
      retryCount,
      description: description || command,
    });

    console.log(`\n🎉 Command completed successfully!`);
    console.log(`📊 Exit code: ${result.code}`);
    console.log(`⏱️  Duration: ${result.duration.toFixed(2)}ms`);

    process.exit(0);
  } catch (error) {
    console.error(`\n💥 Command failed: ${error.message}`);

    if (error.code) {
      console.error(`📊 Exit code: ${error.code}`);
    }

    if (error.stdout) {
      console.log('📤 Stdout:', error.stdout.slice(-500));
    }

    if (error.stderr) {
      console.error('📥 Stderr:', error.stderr.slice(-500));
    }

    process.exit(error.code || 1);
  }
}

// Export for use as module
export { SafeCommandRunner };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
