#!/usr/bin/env node

/**
 * COMPLIANCE ENGINE INITIALIZER
 * Script de inicialização e teste do sistema
 */

import { initializeComplianceEngine } from './core/compliance-core.mjs';

async function main() {
  console.log('🚀 Compliance Engine - Initialization Test\n');

  try {
    // Inicializar engine
    const engine = await initializeComplianceEngine();

    console.log('✅ Engine initialized successfully\n');

    // Executar health check
    console.log('🔍 Running health check...');
    const health = await engine.healthCheck();
    console.log('Health Status:', health.overallHealth);
    console.log('Components:');
    Object.entries(health.components).forEach(([name, status]) => {
      console.log(`  - ${name}: ${status.status}`);
    });

    console.log('\n📊 Running compliance audit...');
    const audit = await engine.runComplianceAudit();
    console.log(`Compliance Score: ${audit.summary.score}%`);
    console.log(`Total Scripts: ${audit.scripts.total}`);
    console.log(`Compliant Scripts: ${audit.scripts.compliant}`);

    if (audit.scripts.violations.length > 0) {
      console.log('\n⚠️ Violations found:');
      audit.scripts.violations.forEach(v => {
        console.log(`  - ${v.scriptId}: ${v.violations.length} violations`);
      });
    }

    console.log('\n🎉 Compliance Engine Fase 1 fully operational!');

  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as testInitialization };
