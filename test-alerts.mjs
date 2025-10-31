#!/usr/bin/env node

// Test do sistema de alertas com GitHub Issues
import { getAlertManager } from './compliance-engine/alerts/alert-manager.mjs';
import { listComplianceIssues } from './compliance-engine/alerts/github-issues.mjs';

async function main() {
  console.log('🧪 Testing Alert System with GitHub Issues...\n');

  try {
    const alerts = getAlertManager();
    await alerts.loadData();

    console.log('✅ Alert Manager loaded');

    // Simular diferentes tipos de alertas
    const testAlerts = [
      {
        type: 'script-unowned',
        scriptId: 'test-script',
        severity: 'medium',
        title: 'Script sem proprietário atribuído',
        message: 'O script test-script não tem owner definido há 10 dias',
        actionRequired: 'Atribuir owner via compliance registry',
        metadata: { daysUnowned: 10 }
      },
      {
        type: 'compliance-violation',
        scriptId: 'another-script',
        severity: 'high',
        title: 'Violação crítica de compliance detectada',
        message: 'Script another-script violou 3 regras de governança',
        actionRequired: 'Revisar script e corrigir violações',
        metadata: { violations: ['ownership-missing', 'approval-pending'] }
      },
      {
        type: 'bypass-used',
        scriptId: 'emergency-script',
        severity: 'medium',
        title: 'Bypass autorizado utilizado',
        message: 'Bypass usado por compliance-manager para script emergency-script',
        actionRequired: 'Auditar uso apropriado do bypass',
        metadata: {
          authorizedBy: 'compliance-manager',
          reason: 'Deploy de emergência necessário'
        }
      }
    ];

    console.log('📢 Sending test alerts...\n');

    for (const alertData of testAlerts) {
      console.log(`Sending: ${alertData.title}`);
      const result = await alerts.send(alertData.type, alertData);
      console.log(`✅ Created issue #${result.issueNumber}\n`);
    }

    console.log('📋 Listing active compliance issues...\n');
    await listComplianceIssues();

  } catch (error) {
    console.error('❌ Alert test failed:', error.message);
    console.error(error.stack);
  }
}

main().catch(console.error);
