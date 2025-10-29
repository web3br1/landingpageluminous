#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🛡️ CI Guardrails - Dashboards + Alertas\n');

// Configurações de baseline e alertas
const BASELINE = {
  chromium: {
    p95: 12,    // segundos
    cv: 15      // coeficiente de variação %
  },
  firefox: {
    p95: 20,    // +20% do Chromium
    cv: 20      // %
  },
  flakes: {
    rate: 1     // % máximo
  }
};

const results = {
  timestamp: new Date().toISOString(),
  baseline: BASELINE,
  current: {},
  alerts: [],
  dashboard: {},
  summary: {}
};

function loadPreviousResults() {
  const resultsPath = path.join(process.cwd(), 'validation-results.json');
  if (fs.existsSync(resultsPath)) {
    try {
      return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    } catch {
      return null;
    }
  }
  return null;
}

function generateDashboard() {
  const previous = loadPreviousResults();

  results.dashboard = {
    'chromium-p95': {
      current: results.current.chromium?.p95 || 0,
      baseline: BASELINE.chromium.p95,
      trend: previous ? ((results.current.chromium?.p95 - previous.summary.chromium.p95) / previous.summary.chromium.p95 * 100).toFixed(1) : 0,
      status: (results.current.chromium?.p95 || 0) <= BASELINE.chromium.p95 ? '✅' : '❌'
    },
    'firefox-p95': {
      current: results.current.firefox?.p95 || 0,
      baseline: BASELINE.firefox.p95,
      trend: previous ? ((results.current.firefox?.p95 - previous.summary.firefox.p95) / previous.summary.firefox.p95 * 100).toFixed(1) : 0,
      status: (results.current.firefox?.p95 || 0) <= BASELINE.firefox.p95 ? '✅' : '❌'
    },
    'chromium-cv': {
      current: results.current.chromium?.cv || 0,
      baseline: BASELINE.chromium.cv,
      status: (results.current.chromium?.cv || 0) <= BASELINE.chromium.cv ? '✅' : '❌'
    },
    'flakes-rate': {
      current: results.current.flakes?.rate || 0,
      baseline: BASELINE.flakes.rate,
      status: (results.current.flakes?.rate || 0) <= BASELINE.flakes.rate ? '✅' : '❌'
    }
  };
}

function checkAlerts() {
  const alerts = [];

  // Alertas de performance
  if (results.current.chromium?.p95 > BASELINE.chromium.p95) {
    alerts.push({
      type: 'performance',
      level: 'error',
      message: `Chromium p95 (${results.current.chromium.p95.toFixed(1)}s) acima do baseline (${BASELINE.chromium.p95}s)`,
      impact: 'high'
    });
  }

  if (results.current.firefox?.p95 > BASELINE.firefox.p95) {
    alerts.push({
      type: 'performance',
      level: 'warning',
      message: `Firefox p95 (${results.current.firefox.p95.toFixed(1)}s) acima do baseline (${BASELINE.firefox.p95}s)`,
      impact: 'medium'
    });
  }

  // Alertas de variabilidade
  if (results.current.chromium?.cv > BASELINE.chromium.cv) {
    alerts.push({
      type: 'stability',
      level: 'warning',
      message: `Chromium CV (${results.current.chromium.cv.toFixed(1)}%) acima do limite (${BASELINE.chromium.cv}%)`,
      impact: 'medium'
    });
  }

  // Alertas de flakes
  if ((results.current.flakes?.rate || 0) > BASELINE.flakes.rate) {
    alerts.push({
      type: 'reliability',
      level: 'error',
      message: `Taxa de flake (${results.current.flakes.rate.toFixed(2)}%) acima do limite (${BASELINE.flakes.rate}%)`,
      impact: 'high'
    });
  }

  results.alerts = alerts;
}

async function runQuickValidation() {
  console.log('📊 Executando validação rápida para guardrails...');

  try {
    // Carregar resultados recentes
    const validationResults = loadPreviousResults();
    const flakeResults = loadFlakeResults();

    if (validationResults) {
      results.current.chromium = validationResults.summary.chromium;
      results.current.firefox = validationResults.summary.firefox;
    }

    if (flakeResults) {
      results.current.flakes = {
        rate: parseFloat(flakeResults.summary.flakeRate)
      };
    }

    console.log('  ✅ Dados carregados');
    return true;

  } catch (error) {
    console.error('  ❌ Erro na validação:', error.message);
    return false;
  }
}

function loadFlakeResults() {
  const flakePath = path.join(process.cwd(), 'flake-hunting-results.json');
  if (fs.existsSync(flakePath)) {
    try {
      return JSON.parse(fs.readFileSync(flakePath, 'utf8'));
    } catch {
      return null;
    }
  }
  return null;
}

async function main() {
  console.log('🎯 Configurando CI Guardrails...\n');

  const success = await runQuickValidation();

  if (success) {
    generateDashboard();
    checkAlerts();

    results.summary = {
      alertCount: results.alerts.length,
      criticalAlerts: results.alerts.filter(a => a.level === 'error').length,
      warningAlerts: results.alerts.filter(a => a.level === 'warning').length,
      overallStatus: results.alerts.length === 0 ? 'healthy' : 'degraded'
    };

    // Salvar guardrails
    const outputPath = path.join(process.cwd(), 'ci-guardrails.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

    // Exibir dashboard
    console.log('\n📊 DASHBOARD DE GUARDRAILS\n');
    console.log('='.repeat(50));

    Object.entries(results.dashboard).forEach(([metric, data]) => {
      const trend = data.trend > 0 ? `📈 +${data.trend}%` : data.trend < 0 ? `📉 ${data.trend}%` : '➡️ 0%';
      console.log(`${data.status} ${metric}: ${data.current} (baseline: ${data.baseline}) ${trend}`);
    });

    console.log('\n🚨 ALERTAS ATIVOS\n');
    console.log('='.repeat(50));

    if (results.alerts.length === 0) {
      console.log('✅ Nenhum alerta ativo - sistema saudável!');
    } else {
      results.alerts.forEach((alert, i) => {
        const level = alert.level === 'error' ? '🔴' : '🟡';
        console.log(`${level} [${alert.impact.toUpperCase()}] ${alert.message}`);
      });
    }

    console.log('\n🎯 Status Geral:', results.summary.overallStatus.toUpperCase());

    // Gerar script de CI
    generateCIScript();

    console.log(`\n📄 Guardrails salvos em: ${outputPath}`);

  } else {
    console.log('❌ Não foi possível carregar dados para guardrails');
  }
}

function generateCIScript() {
  const ciScript = `# CI Guardrails Script - Executar após testes
#!/bin/bash

echo "🛡️ Executando CI Guardrails..."

# Executar validação
node scripts/ci-guardrails.mjs

# Verificar alertas críticos
if [ $(jq '.summary.criticalAlerts' ci-guardrails.json) -gt 0 ]; then
    echo "🔴 ALERTAS CRÍTICOS DETECTADOS - FALHANDO BUILD"
    exit 1
fi

# Verificar alertas de warning (não falham build, mas alertam)
if [ $(jq '.summary.warningAlerts' ci-guardrails.json) -gt 0 ]; then
    echo "🟡 ALERTAS DE WARNING DETECTADOS - MONITORAR"
    # Poderia enviar notificação para Slack/Discord
fi

echo "✅ Guardrails aprovados"
`;

  const scriptPath = path.join(process.cwd(), 'scripts', 'ci-guardrails.sh');
  fs.writeFileSync(scriptPath, ciScript);
  console.log(`📝 Script de CI gerado: ${scriptPath}`);
}

main().catch(console.error);
