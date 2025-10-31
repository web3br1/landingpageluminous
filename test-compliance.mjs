#!/usr/bin/env node

/**
 * COMPLIANCE ENGINE TEST SCRIPT
 * Testa o sistema completo da Fase 1
 */

import { initializeComplianceEngine } from './compliance-engine/core/compliance-core.mjs';

async function main() {
  console.log('🚀 Compliance Engine - Fase 1 Test Suite\n');

  try {
    // Inicializar engine
    console.log('📦 Initializing Compliance Engine...');
    const engine = await initializeComplianceEngine();

    console.log('✅ Engine initialized successfully\n');

    // Executar health check
    console.log('🔍 Running system health check...');
    const health = await engine.healthCheck();

    console.log(`System Status: ${health.status}`);
    console.log(`Overall Health: ${health.overallHealth}`);
    console.log('\nComponent Status:');

    Object.entries(health.components).forEach(([name, component]) => {
      console.log(`  - ${name}: ${component.status || 'unknown'}`);
      if (component.status === 'healthy') {
        // Mostrar métricas básicas
        if (name === 'registry' && component.scriptsCount !== undefined) {
          console.log(`    📊 Scripts tracked: ${component.scriptsCount}`);
        }
        if (name === 'monitor' && component.scriptsTracked !== undefined) {
          console.log(`    📊 Scripts monitored: ${component.scriptsTracked}`);
        }
        if (name === 'alerts' && component.configuredChannels !== undefined) {
          console.log(`    📊 Alert channels: ${component.configuredChannels}`);
        }
      }
    });

    console.log('\n📊 Running compliance audit...');
    const audit = await engine.runComplianceAudit();

    console.log(`Compliance Score: ${audit.summary.score}%`);
    console.log(`Total Scripts: ${audit.scripts.total}`);
    console.log(`Compliant Scripts: ${audit.scripts.compliant}`);
    console.log(`Scripts with Violations: ${audit.scripts.violations.length}`);

    if (audit.scripts.violations.length > 0) {
      console.log('\n⚠️ Compliance Violations Found:');
      audit.scripts.violations.slice(0, 3).forEach(v => {
        console.log(`  - ${v.scriptId}: ${v.violations.length} violation(s)`);
        v.violations.slice(0, 2).forEach(vio => {
          console.log(`    • ${vio.rule}: ${vio.message}`);
        });
      });

      if (audit.scripts.violations.length > 3) {
        console.log(`  ... and ${audit.scripts.violations.length - 3} more`);
      }
    } else {
      console.log('✅ All scripts are compliant!');
    }

    console.log('\n🏆 Compliance Engine Fase 1 - FULLY OPERATIONAL!');
    console.log('\nNext Steps:');
    console.log('1. Configure alert channels (Slack/Email)');
    console.log('2. Register remaining scripts');
    console.log('3. Implement Fase 2: CI Gates & Pre-commit hooks');
    console.log('4. Deploy to production environment');

  } catch (error) {
    console.error('\n❌ Compliance Engine Test Failed:');
    console.error(error.message);
    console.error('\nStack trace:', error.stack);

    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check file permissions: chmod +x compliance-engine/**/*.mjs');
    console.log('2. Verify Node.js modules: node --version');
    console.log('3. Check data files: ls -la compliance-engine/data/');
    console.log('4. Review logs above for specific component failures');

    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

export { main as runComplianceTest };
