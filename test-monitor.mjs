#!/usr/bin/env node

// Test do usage monitor
import { getUsageMonitor } from './compliance-engine/core/usage-monitor.mjs';

async function main() {
  console.log('🧪 Testing Usage Monitor...');

  try {
    const monitor = getUsageMonitor();
    console.log('✅ Monitor instance created');

    await monitor.start();
    console.log('✅ Monitor started');

    // Simular uma execução
    await monitor.trackExecution('quality-gate', {
      context: 'local',
      success: true,
      duration: 1500,
      user: 'test-user',
      runAuthority: 'system',
      policyVersion: '1.0.0'
    });
    console.log('✅ Execution tracked');

    const stats = await monitor.getUsageStats('quality-gate');
    console.log('📊 Usage stats:', stats ? {
      executions: stats.totalExecutions,
      successRate: stats.successRate,
      lastExecution: stats.lastExecution
    } : 'No stats');

    const unused = await monitor.getUnusedScripts(30);
    console.log('📊 Unused scripts:', unused);

    const health = await monitor.healthCheck();
    console.log('🏥 Health check:', health);

    await monitor.stop();
    console.log('✅ Monitor stopped');

  } catch (error) {
    console.error('❌ Monitor test failed:', error.message);
    console.error(error.stack);
  }
}

main().catch(console.error);
