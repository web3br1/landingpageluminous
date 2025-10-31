
// AUTO-GENERATED HOOK - DO NOT EDIT
import { UsageMonitor } from '../core/usage-monitor.mjs';

const monitor = new UsageMonitor();
const startTime = Date.now();

try {
  // Importar e executar script original
  await import('C:\Meus Projetos\Lading Page\scripts\progress-report.mjs');

  // Registrar execução bem-sucedida
  await monitor.trackExecution('progress-report', {
    context: process.env.CI ? 'ci' : 'local',
    success: true,
    duration: Date.now() - startTime,
    user: process.env.USER || process.env.USERNAME || 'system',
    runAuthority: 'system',
    policyVersion: '1.0.0'
  });

} catch (error) {
  // Registrar execução com falha
  await monitor.trackExecution('progress-report', {
    context: process.env.CI ? 'ci' : 'local',
    success: false,
    duration: Date.now() - startTime,
    user: process.env.USER || process.env.USERNAME || 'system',
    runAuthority: 'system',
    policyVersion: '1.0.0'
  });

  throw error; // Re-throw para não interferir na execução
}
