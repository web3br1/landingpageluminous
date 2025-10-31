#!/usr/bin/env node

/**
 * HELPER PARA SISTEMA DE AUDITORIA DE QUALIDADE
 *
 * Utilitários para manutenção e operação do sistema de auditoria
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

// Cores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Verificar saúde do sistema de auditoria
 */
function checkSystemHealth() {
  log(colors.blue, '🔍 Verificando saúde do sistema de auditoria...');

  const checks = [
    {
      name: 'Inventário de integrações',
      path: 'quality-audit/integrations-inventory.json',
      check: (content) => {
        try {
          const data = JSON.parse(content);
          return data.integrations && Object.keys(data.integrations).length > 0;
        } catch {
          return false;
        }
      }
    },
    {
      name: 'Script principal de auditoria',
      path: 'scripts/audit-integrations-and-unused.mjs',
      check: (content) => content.includes('runAudit') && content.includes('generateReport')
    },
    {
      name: 'Workflow de CI',
      path: '.github/workflows/quality-audit.yml',
      check: (content) => content.includes('audit-integrations-and-unused.mjs')
    },
    {
      name: 'Diretório de histórico',
      path: 'quality-history',
      check: () => fs.existsSync(path.join(ROOT_DIR, 'quality-history'))
    }
  ];

  let allHealthy = true;

  for (const check of checks) {
    const fullPath = path.join(ROOT_DIR, check.path);

    if (!fs.existsSync(fullPath)) {
      log(colors.red, `❌ ${check.name}: Arquivo não encontrado`);
      allHealthy = false;
      continue;
    }

    let healthy;
    if (check.check) {
      // Para arquivos, ler conteúdo
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        healthy = check.check();
      } else {
        const content = fs.readFileSync(fullPath, 'utf8');
        healthy = check.check(content);
      }
    } else {
      healthy = check.check();
    }

    if (healthy) {
      log(colors.green, `✅ ${check.name}: OK`);
    } else {
      log(colors.red, `❌ ${check.name}: Problema detectado`);
      allHealthy = false;
    }
  }

  return allHealthy;
}

/**
 * Executar auditoria completa
 */
function runFullAudit() {
  log(colors.blue, '🚀 Executando auditoria completa...');

  try {
    execSync('node scripts/audit-integrations-and-unused.mjs', {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });
    log(colors.green, '✅ Auditoria concluída com sucesso');
  } catch (error) {
    log(colors.red, `❌ Auditoria falhou: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Mostrar métricas recentes
 */
function showRecentMetrics() {
  log(colors.blue, '📊 Métricas dos últimos 5 dias...');

  const historyDir = path.join(ROOT_DIR, 'quality-history');

  if (!fs.existsSync(historyDir)) {
    log(colors.red, '❌ Diretório de histórico não encontrado');
    return;
  }

  const files = fs.readdirSync(historyDir)
    .filter(f => f.endsWith('-integrations-audit.json'))
    .sort()
    .reverse()
    .slice(0, 5);

  if (files.length === 0) {
    log(colors.yellow, '⚠️  Nenhum relatório encontrado');
    return;
  }

  console.table(
    files.map(file => {
      try {
        const content = fs.readFileSync(path.join(historyDir, file), 'utf8');
        const data = JSON.parse(content);
        const date = file.split('-integrations-audit.json')[0];

        return {
          Data: date,
          Total: data.summary.total,
          Críticos: data.summary.critical,
          Altos: data.summary.high,
          Médios: data.summary.medium,
          Baixos: data.summary.low
        };
      } catch {
        return { Data: file, Status: 'Erro ao ler' };
      }
    })
  );
}

/**
 * Limpar histórico antigo (manter últimos 30 dias)
 */
function cleanupOldReports() {
  log(colors.blue, '🧹 Limpando relatórios antigos (mantendo 30 dias)...');

  const historyDir = path.join(ROOT_DIR, 'quality-history');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  if (!fs.existsSync(historyDir)) {
    log(colors.yellow, '⚠️  Diretório de histórico não existe');
    return;
  }

  const files = fs.readdirSync(historyDir);
  let deletedCount = 0;

  for (const file of files) {
    const filePath = path.join(historyDir, file);
    const stat = fs.statSync(filePath);

    if (stat.mtime < cutoffDate) {
      fs.unlinkSync(filePath);
      deletedCount++;
    }
  }

  log(colors.green, `✅ ${deletedCount} arquivos antigos removidos`);
}

/**
 * Validar inventário de integrações
 */
function validateInventory() {
  log(colors.blue, '🔍 Validando inventário de integrações...');

  const inventoryPath = path.join(ROOT_DIR, 'quality-audit/integrations-inventory.json');

  if (!fs.existsSync(inventoryPath)) {
    log(colors.red, '❌ Inventário não encontrado');
    return false;
  }

  try {
    const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

    // Validar estrutura básica
    if (!inventory.integrations) {
      log(colors.red, '❌ Propriedade "integrations" ausente');
      return false;
    }

    // Validar cada integração
    for (const [key, integration] of Object.entries(inventory.integrations)) {
      const required = ['name', 'package', 'env_vars', 'allowed_layers', 'forbidden_layers'];
      const missing = required.filter(prop => !integration[prop]);

      if (missing.length > 0) {
        log(colors.red, `❌ Integração "${key}" faltando: ${missing.join(', ')}`);
        return false;
      }

      // Verificar se package existe no package.json
      const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
      const isInstalled = Object.keys(packageJson.dependencies || {}).includes(integration.package) ||
                         Object.keys(packageJson.devDependencies || {}).includes(integration.package);

      if (!isInstalled) {
        log(colors.yellow, `⚠️  Pacote "${integration.package}" (${integration.name}) não está instalado`);
      } else {
        log(colors.green, `✅ ${integration.name}: OK`);
      }
    }

    log(colors.green, '✅ Inventário válido');
    return true;

  } catch (error) {
    log(colors.red, `❌ Erro ao validar inventário: ${error.message}`);
    return false;
  }
}

/**
 * Gerar relatório de saúde do sistema
 */
function generateHealthReport() {
  log(colors.blue, '📋 Gerando relatório de saúde...');

  const report = {
    timestamp: new Date().toISOString(),
    system_health: checkSystemHealth(),
    inventory_valid: validateInventory(),
    recent_reports: [],
    recommendations: []
  };

  // Verificar relatórios recentes
  const historyDir = path.join(ROOT_DIR, 'quality-history');
  if (fs.existsSync(historyDir)) {
    const files = fs.readdirSync(historyDir)
      .filter(f => f.endsWith('-integrations-audit.json'))
      .sort()
      .reverse()
      .slice(0, 3);

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(historyDir, file), 'utf8');
        const data = JSON.parse(content);
        report.recent_reports.push({
          date: file.split('-integrations-audit.json')[0],
          summary: data.summary
        });
      } catch (e) {
        report.recent_reports.push({
          date: file,
          error: e.message
        });
      }
    }
  }

  // Gerar recomendações
  if (!report.system_health) {
    report.recommendations.push('Corrigir problemas de saúde do sistema');
  }

  if (!report.inventory_valid) {
    report.recommendations.push('Validar e corrigir inventário de integrações');
  }

  if (report.recent_reports.length === 0) {
    report.recommendations.push('Executar primeira auditoria para baseline');
  } else {
    const latest = report.recent_reports[0];
    if (latest.summary?.critical_issues > 0) {
      report.recommendations.push('Resolver problemas críticos identificados');
    }
  }

  // Salvar relatório
  const reportPath = path.join(ROOT_DIR, 'quality-history', 'system-health-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log(colors.green, `✅ Relatório salvo em: ${reportPath}`);

  // Output summary
  log(colors.blue, '\n📊 Status do Sistema:');
  log(report.system_health ? colors.green : colors.red, `   Sistema saudável: ${report.system_health ? '✅' : '❌'}`);
  log(report.inventory_valid ? colors.green : colors.red, `   Inventário válido: ${report.inventory_valid ? '✅' : '❌'}`);
  log(colors.blue, `   Relatórios recentes: ${report.recent_reports.length}`);

  if (report.recommendations.length > 0) {
    log(colors.yellow, '\n💡 Recomendações:');
    report.recommendations.forEach(rec => log(colors.yellow, `   • ${rec}`));
  }
}

/**
 * Menu principal
 */
function showHelp() {
  console.log(`
🎯 Quality Audit System Helper

Uso: node scripts/quality-audit-helper.mjs <comando>

Comandos disponíveis:
  health          - Verificar saúde do sistema
  audit           - Executar auditoria completa
  metrics         - Mostrar métricas recentes
  validate        - Validar inventário de integrações
  cleanup         - Limpar relatórios antigos (>30 dias)
  report          - Gerar relatório de saúde do sistema
  help            - Mostrar esta ajuda

Exemplos:
  node scripts/quality-audit-helper.mjs health
  node scripts/quality-audit-helper.mjs audit
  node scripts/quality-audit-helper.mjs metrics
`);
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'health':
    checkSystemHealth();
    break;
  case 'audit':
    runFullAudit();
    break;
  case 'metrics':
    showRecentMetrics();
    break;
  case 'validate':
    validateInventory();
    break;
  case 'cleanup':
    cleanupOldReports();
    break;
  case 'report':
    generateHealthReport();
    break;
  case 'help':
  default:
    showHelp();
    break;
}
