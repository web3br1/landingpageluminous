#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log('📊 Relatórios Executivos - Insights Acionáveis para Stakeholders\n');

// Configuração do relatório
const REPORT_CONFIG = {
  period: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  },
  audience: {
    technical: ['QA Lead', 'Tech Leads', 'DevOps'],
    business: ['Product Manager', 'Engineering Manager', 'CTO']
  },
  kpis: {
    critical: ['chromium.p95', 'firefox.p95', 'flakeRate'],
    important: ['lighthouse.performance', 'bundle.size'],
    contextual: ['ssr.warnings', 'build.success']
  }
};

// Dados simulados de múltiplas semanas (em produção viria de analytics)
const WEEKLY_DATA = [
  {
    week: '2025-W08',
    chromium: { p95: 12.1, cv: 12.3, trend: '+2.1%' },
    firefox: { p95: 13.9, cv: 14.1, trend: '+1.8%' },
    flakeRate: 0.9,
    lighthouse: { performance: 92, accessibility: 96, seo: 95 },
    bundle: { size: 485000, chunks: 12 },
    ssr: { warnings: 0, builds: 47 },
    incidents: ['1 flake crítico resolvido', 'Performance baseline atualizada']
  },
  {
    week: '2025-W09',
    chromium: { p95: 11.8, cv: 11.9, trend: '-2.5%' },
    firefox: { p95: 13.5, cv: 13.8, trend: '-3.0%' },
    flakeRate: 0.7,
    lighthouse: { performance: 93, accessibility: 97, seo: 94 },
    bundle: { size: 482000, chunks: 12 },
    ssr: { warnings: 0, builds: 52 },
    incidents: ['Melhoria de 15% na performance Firefox']
  },
  {
    week: '2025-W10',
    chromium: { p95: 12.3, cv: 12.5, trend: '+4.2%' },
    firefox: { p95: 14.1, cv: 14.2, trend: '+4.4%' },
    flakeRate: 1.1,
    lighthouse: { performance: 91, accessibility: 95, seo: 93 },
    bundle: { size: 488000, chunks: 13 },
    ssr: { warnings: 0, builds: 49 },
    incidents: ['Aumento temporário de flakes - investigação em andamento']
  },
  {
    week: '2025-W11',
    chromium: { p95: 11.9, cv: 12.1, trend: '-3.3%' },
    firefox: { p95: 13.7, cv: 13.9, trend: '-2.8%' },
    flakeRate: 0.8,
    lighthouse: { performance: 92, accessibility: 96, seo: 94 },
    bundle: { size: 483000, chunks: 12 },
    ssr: { warnings: 0, builds: 51 },
    incidents: ['Estabilidade recuperada', 'Bundle otimizado']
  }
];

function generateExecutiveSummary() {
  const latest = WEEKLY_DATA[WEEKLY_DATA.length - 1];
  const previous = WEEKLY_DATA[WEEKLY_DATA.length - 2];

  const summary = {
    period: `${REPORT_CONFIG.period.start} to ${REPORT_CONFIG.period.end}`,
    overall: {
      status: calculateOverallStatus(latest, previous),
      confidence: calculateConfidenceLevel(latest),
      riskLevel: calculateRiskLevel(latest)
    },
    highlights: generateHighlights(WEEKLY_DATA),
    recommendations: generateRecommendations(latest, previous)
  };

  return summary;
}

function calculateOverallStatus(latest, previous) {
  const metrics = ['chromium.p95', 'firefox.p95', 'flakeRate', 'lighthouse.performance'];

  let improving = 0;
  let stable = 0;
  let degrading = 0;

  // Chromium p95 (menor = melhor)
  if (latest.chromium.p95 < previous.chromium.p95) improving++;
  else if (latest.chromium.p95 === previous.chromium.p95) stable++;
  else degrading++;

  // Firefox p95 (menor = melhor)
  if (latest.firefox.p95 < previous.firefox.p95) improving++;
  else if (latest.firefox.p95 === previous.firefox.p95) stable++;
  else degrading++;

  // Flake rate (menor = melhor)
  if (latest.flakeRate < previous.flakeRate) improving++;
  else if (latest.flakeRate === previous.flakeRate) stable++;
  else degrading++;

  // Lighthouse (maior = melhor)
  if (latest.lighthouse.performance > previous.lighthouse.performance) improving++;
  else if (latest.lighthouse.performance === previous.lighthouse.performance) stable++;
  else degrading++;

  if (improving >= 3) return 'Excelente - Tendência de Melhoria';
  if (improving >= 2 && degrading === 0) return 'Bom - Estável com Melhorias';
  if (degrading >= 2) return 'Atenção - Degradação Detectada';
  return 'Estável - Manutenção Necessária';
}

function calculateConfidenceLevel(latest) {
  // Confiança baseada na consistência dos dados
  const flakeStability = latest.flakeRate < 1 ? 0.9 : latest.flakeRate < 2 ? 0.7 : 0.5;
  const performanceStability = (latest.chromium.cv < 15 && latest.firefox.cv < 20) ? 0.8 : 0.6;
  const lighthouseStability = latest.lighthouse.performance >= 90 ? 0.9 : 0.7;

  return (flakeStability + performanceStability + lighthouseStability) / 3;
}

function calculateRiskLevel(latest) {
  if (latest.flakeRate > 2 || latest.chromium.p95 > 15 || latest.firefox.p95 > 20) {
    return 'Alto - Ação Imediata Necessária';
  }
  if (latest.flakeRate > 1 || latest.chromium.p95 > 13 || latest.firefox.p95 > 17) {
    return 'Médio - Monitoramento Contínuo';
  }
  return 'Baixo - Status Saudável';
}

function generateHighlights(weeklyData) {
  const highlights = [];

  // Análise de tendências
  const chromiumTrend = calculateTrend(weeklyData.map(w => w.chromium.p95));
  const firefoxTrend = calculateTrend(weeklyData.map(w => w.firefox.p95));
  const flakeTrend = calculateTrend(weeklyData.map(w => w.flakeRate));

  if (chromiumTrend.direction === 'decreasing') {
    highlights.push(`✅ Performance Chromium melhorou ${(chromiumTrend.magnitude * 100).toFixed(1)}% ao longo do período`);
  }

  if (firefoxTrend.direction === 'decreasing') {
    highlights.push(`✅ Performance Firefox melhorou ${(firefoxTrend.magnitude * 100).toFixed(1)}% ao longo do período`);
  }

  if (flakeTrend.direction === 'decreasing') {
    highlights.push(`✅ Taxa de flakes reduziu ${(flakeTrend.magnitude * 100).toFixed(1)}% ao longo do período`);
  }

  // Incidentes importantes
  const allIncidents = weeklyData.flatMap(w => w.incidents);
  if (allIncidents.length > 0) {
    highlights.push(`🔧 ${allIncidents.length} incidentes resolvidos no período`);
  }

  // Pontos de atenção
  const latest = weeklyData[weeklyData.length - 1];
  if (latest.flakeRate > 1) {
    highlights.push(`⚠️ Taxa de flakes acima do target (${latest.flakeRate}% vs 1% target)`);
  }

  return highlights;
}

function calculateTrend(values) {
  const n = values.length;
  if (n < 2) return { direction: 'stable', magnitude: 0 };

  const first = values[0];
  const last = values[n - 1];
  const change = (last - first) / first;

  return {
    direction: change > 0.05 ? 'increasing' : change < -0.05 ? 'decreasing' : 'stable',
    magnitude: Math.abs(change)
  };
}

function generateRecommendations(latest, previous) {
  const recommendations = [];

  // Recomendações baseadas em métricas atuais
  if (latest.flakeRate > 1) {
    recommendations.push({
      priority: 'Alta',
      action: 'Investigar e resolver causas de flakes',
      impact: 'Melhoria na confiabilidade dos testes',
      effort: '2-3 dias'
    });
  }

  if (latest.chromium.p95 > 13 || latest.firefox.p95 > 17) {
    recommendations.push({
      priority: 'Alta',
      action: 'Otimização de performance dos testes E2E',
      impact: 'Redução no tempo de execução e feedback',
      effort: '1-2 semanas'
    });
  }

  if (latest.lighthouse.performance < 90) {
    recommendations.push({
      priority: 'Média',
      action: 'Melhoria nas Core Web Vitals da aplicação',
      impact: 'Melhor experiência do usuário',
      effort: '1 semana'
    });
  }

  // Recomendações proativas
  recommendations.push({
    priority: 'Baixa',
    action: 'Implementar Test Impact Analysis para CI mais rápido',
    impact: 'Redução de 40% no tempo de CI',
    effort: '2-3 dias'
  });

  return recommendations;
}

function generateTechnicalReport() {
  const report = {
    technical: {
      performance: {
        chromium: WEEKLY_DATA.map(w => ({
          week: w.week,
          p95: w.chromium.p95,
          cv: w.chromium.cv,
          trend: w.chromium.trend
        })),
        firefox: WEEKLY_DATA.map(w => ({
          week: w.week,
          p95: w.firefox.p95,
          cv: w.firefox.cv,
          trend: w.firefox.trend
        }))
      },
      reliability: WEEKLY_DATA.map(w => ({
        week: w.week,
        flakeRate: w.flakeRate,
        ssrWarnings: w.ssr.warnings,
        buildSuccess: w.ssr.builds
      })),
      quality: WEEKLY_DATA.map(w => ({
        week: w.week,
        lighthouse: w.lighthouse,
        bundle: w.bundle
      }))
    }
  };

  return report;
}

function generateBusinessReport(summary, highlights, recommendations) {
  return {
    executive: {
      period: summary.period,
      status: summary.overall,
      confidence: `${(summary.confidence * 100).toFixed(0)}%`,
      risk: summary.riskLevel,
      highlights,
      recommendations: recommendations.slice(0, 3) // Top 3 para execs
    }
  };
}

function saveReports(summary, technical, business) {
  const timestamp = new Date().toISOString().split('T')[0];
  const basePath = path.join(process.cwd(), 'reports', timestamp);

  // Criar diretório se não existir
  if (!fs.existsSync(path.dirname(basePath))) {
    fs.mkdirSync(path.dirname(basePath), { recursive: true });
  }

  // Relatório Executivo (Business)
  const executivePath = `${basePath}-executive-report.json`;
  fs.writeFileSync(executivePath, JSON.stringify(business, null, 2));

  // Relatório Técnico Completo
  const technicalPath = `${basePath}-technical-report.json`;
  fs.writeFileSync(technicalPath, JSON.stringify(technical, null, 2));

  // Relatório de Resumo
  const summaryPath = `${basePath}-summary.json`;
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log('📄 Relatórios salvos:');
  console.log(`   • Executivo: ${executivePath}`);
  console.log(`   • Técnico: ${technicalPath}`);
  console.log(`   • Resumo: ${summaryPath}`);

  return { executivePath, technicalPath, summaryPath };
}

async function main() {
  console.log('📊 Gerando Relatórios Executivos...\n');

  // 1. Gerar resumo executivo
  const summary = generateExecutiveSummary();

  // 2. Gerar relatório técnico detalhado
  const technical = generateTechnicalReport();

  // 3. Gerar relatório executivo (business-friendly)
  const business = generateBusinessReport(summary, summary.highlights, summary.recommendations);

  // 4. Salvar todos os relatórios
  const reportPaths = saveReports(summary, technical, business);

  // 5. Exibir resumo executivo
  console.log('🏆 RELATÓRIO EXECUTIVO - QUALIDADE DE SOFTWARE\n');
  console.log('='.repeat(60));
  console.log(`📅 Período: ${summary.period}`);
  console.log(`📊 Status Geral: ${summary.overall.status}`);
  console.log(`🎯 Nível de Confiança: ${(summary.confidence * 100).toFixed(0)}%`);
  console.log(`⚠️  Nível de Risco: ${summary.riskLevel}`);

  console.log('\n🏆 DESTAQUES PRINCIPAIS:');
  summary.highlights.forEach((highlight, i) => {
    console.log(`   ${i + 1}. ${highlight}`);
  });

  console.log('\n💡 RECOMENDAÇÕES PRIORITÁRIAS:');
  summary.recommendations.slice(0, 3).forEach((rec, i) => {
    console.log(`   ${i + 1}. [${rec.priority}] ${rec.action}`);
    console.log(`      • Impacto: ${rec.impact}`);
    console.log(`      • Esforço: ${rec.effort}`);
  });

  console.log('\n📈 MÉTRICAS CHAVE DA SEMANA:');
  const latest = WEEKLY_DATA[WEEKLY_DATA.length - 1];
  console.log(`   • Chromium p95: ${latest.chromium.p95}s (${latest.chromium.trend})`);
  console.log(`   • Firefox p95: ${latest.firefox.p95}s (${latest.firefox.trend})`);
  console.log(`   • Taxa de Flakes: ${latest.flakeRate}%`);
  console.log(`   • Lighthouse: ${latest.lighthouse.performance}/100`);
  console.log(`   • Builds Bem-sucedidos: ${latest.ssr.builds}`);

  console.log('\n🎯 PRÓXIMAS AÇÕES:');
  console.log('   1. Revisar recomendações prioritárias');
  console.log('   2. Monitorar tendências nas próximas semanas');
  console.log('   3. Atualizar baselines se necessário');
  console.log('   4. Planejar melhorias identificadas');

  console.log('\n📄 Relatórios completos disponíveis para análise detalhada.');
  console.log('\n✅ Relatórios Executivos gerados com sucesso!');
}

main().catch(console.error);
