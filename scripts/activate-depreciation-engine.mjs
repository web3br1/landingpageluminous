#!/usr/bin/env node

/**
 * Activate Depreciation Engine
 * Fase 5: Ativar remoção escalonada via Depreciation Engine
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const REGISTRY_PATH = './compliance-engine/data/script-registry.json';
const DEPRECIATION_CONFIG_PATH = './compliance-engine/data/depreciation-config.json';

function createDepreciationConfig() {
  const config = {
    metadata: {
      version: '1.0.0',
      activatedAt: new Date().toISOString(),
      activatedBy: 'migration-script'
    },
    policies: {
      // Scripts legados ganham strike inicial
      legacyInitialStrike: 1,

      // Ciclo de depreciação
      depreciationCycleDays: 30,

      // Critérios para remoção
      removalCriteria: {
        minStrikes: 2,
        maxUnusedDays: 90,
        requireNoObjections: true
      },

      // Notificações
      notifications: {
        strikeWarningDays: 7,
        finalWarningDays: 1,
        removalNotification: true
      }
    },

    // Scripts marcados para depreciação imediata
    immediateDeprecation: [
      // Gates redundantes já migrados
      'ci-quality-gates-v2',
      'ci-quality-gate-check',
      'run-quality-gates',
      'run-quality-gates-simple',

      // Dashboards redundantes
      'test-quality-dashboard',

      // Correções absorvidas
      'bulk-quality-fixes',
      'fix-critical-ts-errors',
      'eslint-systematic-fixes',
      'quick-unused-vars-fix',
      'fix-unused-vars',
      'lote-1-unused-vars-fix',
      'code-quality-fix',

      // Performance absorvida
      'performance-optimization',
      'performance-real-validation',
      'bundle-analysis-report',

      // Deployment absorvido
      'post-deploy-checklist',
      'deploy-vercel',
      'ci-deployment-ready'
    ],

    // Scripts protegidos (não depreciar automaticamente)
    protectedScripts: [
      'quality-gate',
      'ci-gate',
      'quality-fixer',
      'dashboard-quality',
      'dashboard-tdd',
      'dashboard-audit',
      'dashboard-trends',
      'perf-monitor',
      'bundle-analyze',
      'analytics-monitor',
      'deploy',
      'post-deploy'
    ],

    // Calendário de remoção
    removalSchedule: {
      phase1: {
        scripts: ['ci-quality-gates-v2', 'bulk-quality-fixes'],
        removalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        reason: 'Redundante com scripts oficiais'
      },
      phase2: {
        scripts: ['eslint-systematic-fixes', 'performance-optimization'],
        removalDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 dias
        reason: 'Funcionalidade consolidada'
      },
      phase3: {
        scripts: ['fix-critical-ts-errors', 'bundle-analysis-report'],
        removalDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 dias
        reason: 'Manutenção técnica completa'
      }
    }
  };

  writeFileSync(DEPRECIATION_CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(`✅ Depreciation config created: ${DEPRECIATION_CONFIG_PATH}`);
  return config;
}

function updateRegistryWithDepreciation() {
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
  const now = new Date().toISOString();

  let updated = 0;

  // Atualizar scripts legados com strikes iniciais
  for (const [id, script] of Object.entries(registry)) {
    if (script.status === 'legacy') {
      script.strikes = Math.max(script.strikes || 0, 1); // Garantir pelo menos 1 strike
      script.lastModifiedBy = 'depreciation-engine';
      script.metadata = script.metadata || {};
      script.metadata.deprecationStarted = now;
      updated++;
    }
  }

  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
  console.log(`✅ Registry updated with depreciation: ${updated} legacy scripts marked`);
  return registry;
}

function generateDepreciationReport() {
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
  const config = JSON.parse(readFileSync(DEPRECIATION_CONFIG_PATH, 'utf8'));

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalScripts: Object.keys(registry).length,
      activeScripts: Object.values(registry).filter(s => s.status === 'active').length,
      legacyScripts: Object.values(registry).filter(s => s.status === 'legacy').length,
      quarantinedScripts: Object.values(registry).filter(s => s.status === 'quarantined').length,
      deprecatedScripts: Object.values(registry).filter(s => s.status === 'deprecated').length
    },
    depreciationPhases: config.removalSchedule,
    nextActions: [
      'Monitorar uso de scripts legados',
      'Enviar notificações de depreciação',
      'Executar remoções agendadas',
      'Atualizar métricas trimestrais'
    ]
  };

  const reportPath = './scripts/depreciation-activation-report.json';
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✅ Depreciation report generated: ${reportPath}`);

  return report;
}

function main() {
  console.log('🏗️  Activating Depreciation Engine...');

  try {
    // 1. Criar configuração de depreciação
    console.log('📋 Creating depreciation configuration...');
    const config = createDepreciationConfig();

    // 2. Atualizar registry com strikes iniciais
    console.log('📊 Updating registry with depreciation strikes...');
    const registry = updateRegistryWithDepreciation();

    // 3. Gerar relatório de ativação
    console.log('📈 Generating activation report...');
    const report = generateDepreciationReport();

    console.log('✅ Depreciation Engine activated successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`  • Total scripts: ${report.summary.totalScripts}`);
    console.log(`  • Active: ${report.summary.activeScripts}`);
    console.log(`  • Legacy: ${report.summary.legacyScripts}`);
    console.log(`  • Quarantined: ${report.summary.quarantinedScripts}`);
    console.log('');
    console.log('⏰ Next phases:');
    Object.entries(config.removalSchedule).forEach(([phase, data]) => {
      console.log(`  • ${phase}: ${data.scripts.length} scripts → ${new Date(data.removalDate).toLocaleDateString()}`);
    });

  } catch (error) {
    console.error('❌ Error activating depreciation engine:', error);
    process.exit(1);
  }
}

main();
