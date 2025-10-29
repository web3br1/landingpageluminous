#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🎭 Demo: QA Preditivo em Ação\n');

// Simula cenário real de desenvolvimento
const demoScenario = {
  description: "Desenvolvedor fez mudanças no componente Hero e quer rodar testes",
  changes: [
    { file: "components/sections/hero.tsx", type: "modified", lines: 45 },
    { file: "components/ui/button.tsx", type: "modified", lines: 12 },
    { file: "lib/composition/services/page-composition-service.ts", type: "modified", lines: 23 }
  ],
  currentTime: new Date().toISOString(),
  recentTestHistory: {
    "hero test": { recentFlakes: 2, avgDuration: 8500, complexity: 7.2 },
    "button interaction test": { recentFlakes: 0, avgDuration: 3200, complexity: 4.1 },
    "composition service test": { recentFlakes: 1, avgDuration: 12000, complexity: 8.9 }
  }
};

async function runDemo() {
  console.log("📋 Cenário da Demo:");
  console.log(`   ${demoScenario.description}`);
  console.log("   Mudanças feitas:");
  demoScenario.changes.forEach(change => {
    console.log(`     • ${change.type}: ${change.file} (${change.lines} linhas)`);
  });
  console.log();

  // Fase 1: TIA (Test Impact Analysis)
  console.log("🎯 FASE 1: ANÁLISE DE IMPACTO (TIA)");
  console.log("-".repeat(50));

  const tiaAnalysis = await simulateTIA(demoScenario);
  console.log("📊 Testes Impactados:");
  tiaAnalysis.impactedTests.forEach(test => {
    console.log(`   • ${test.name} (${test.confidence}% confiança)`);
    console.log(`     Motivo: ${test.reason}`);
  });
  console.log();

  // Fase 2: Flake Prediction
  console.log("🔮 FASE 2: PREDIÇÃO DE FLAKES");
  console.log("-".repeat(50));

  const flakePredictions = await simulateFlakePrediction(tiaAnalysis.impactedTests);
  console.log("🎲 Probabilidades de Flake:");
  flakePredictions.forEach(pred => {
    console.log(`   ${pred.emoji} ${pred.test}: ${(pred.probability * 100).toFixed(1)}% risco`);
    console.log(`     ${pred.recommendation}`);
  });
  console.log();

  // Fase 3: Performance Prediction
  console.log("⚡ FASE 3: PREDIÇÃO DE PERFORMANCE");
  console.log("-".repeat(50));

  const perfPrediction = await simulatePerformancePrediction(demoScenario);
  console.log("📈 Impacto Previsto na Performance:");
  console.log(`   • P95 E2E: ${perfPrediction.p95Impact > 0 ? '+' : ''}${perfPrediction.p95Impact.toFixed(1)}s (${perfPrediction.p95Confidence}% confiança)`);
  console.log(`   • Lighthouse: ${perfPrediction.lighthouseImpact > 0 ? '+' : ''}${perfPrediction.lighthouseImpact.toFixed(1)} pontos`);
  console.log(`   • Risco Geral: ${perfPrediction.overallRisk}`);
  console.log();

  // Fase 4: Otimização de CI
  console.log("🚀 FASE 4: OTIMIZAÇÃO DE CI RECOMENDADA");
  console.log("-".repeat(50));

  const ciOptimization = calculateCIOptimization(tiaAnalysis, flakePredictions, perfPrediction);
  console.log("🎯 Estratégia Otimizada:");
  console.log(`   • Ordem de Execução: ${ciOptimization.executionOrder.join(' → ')}`);
  console.log(`   • Tempo Estimado: ${ciOptimization.estimatedTime}min`);
  console.log(`   • Speedup: ${ciOptimization.speedup}% vs execução sequencial`);
  console.log(`   • Confiança Geral: ${(ciOptimization.confidence * 100).toFixed(1)}%`);
  console.log();

  // Fase 5: Alertas e Recomendações
  console.log("🚨 FASE 5: ALERTAS E RECOMENDAÇÕES");
  console.log("-".repeat(50));

  const alerts = generateAlerts(tiaAnalysis, flakePredictions, perfPrediction);
  console.log("⚠️  Alertas Ativos:");
  alerts.forEach(alert => {
    console.log(`   ${alert.level} ${alert.message}`);
  });

  console.log("\n💡 Recomendações:");
  ciOptimization.recommendations.forEach(rec => {
    console.log(`   • ${rec}`);
  });
  console.log();

  // Resumo Final
  console.log("🏆 RESUMO DA DEMO - QA PREDITIVO");
  console.log("=".repeat(50));
  console.log(`✅ Testes necessários identificados automaticamente`);
  console.log(`✅ Riscos de flake previstos com ML`);
  console.log(`✅ Impacto de performance estimado`);
  console.log(`✅ CI otimizado para velocidade e confiabilidade`);
  console.log(`✅ Alertas proativos gerados`);
  console.log();
  console.log(`🚀 Resultado: De ${ciOptimization.originalTime}min para ${ciOptimization.estimatedTime}min`);
  console.log(`💰 Economia: ${ciOptimization.timeSavings}min (${ciOptimization.speedup}%)`);
  console.log(`🛡️  Confiança: ${(ciOptimization.confidence * 100).toFixed(1)}%`);
  console.log();
  console.log("💫 Demo concluída - QA Preditivo operacional!");
}

async function simulateTIA(scenario) {
  // Simula análise de impacto baseada nas mudanças
  const impactedTests = [];

  // Regras de impacto baseadas no tipo de arquivo
  const impactRules = {
    'components/sections/': { tests: ['visual-regression-enhanced.spec.ts'], confidence: 95 },
    'components/ui/': { tests: ['visual-regression-enhanced.spec.ts'], confidence: 85 },
    'lib/composition/': { tests: ['critical-flows-e2e.spec.ts', 'ssr.test.ts'], confidence: 90 }
  };

  scenario.changes.forEach(change => {
    for (const [pattern, rule] of Object.entries(impactRules)) {
      if (change.file.includes(pattern)) {
        rule.tests.forEach(testName => {
          if (!impactedTests.find(t => t.name === testName)) {
            impactedTests.push({
              name: testName,
              reason: `Mudanças em ${change.file} afetam ${testName}`,
              confidence: rule.confidence,
              change: change
            });
          }
        });
      }
    }
  });

  return { impactedTests };
}

async function simulateFlakePrediction(impactedTests) {
  // Simula predições de ML baseadas em dados históricos
  const predictions = impactedTests.map(test => {
    const historicalData = demoScenario.recentTestHistory[test.name.replace('.spec.ts', ' test')];

    // Simula cálculo de probabilidade baseado em complexidade e histórico
    let baseProbability = 0.1; // baseline

    if (historicalData) {
      baseProbability += historicalData.recentFlakes * 0.1; // +10% por flake recente
      baseProbability += (historicalData.complexity - 5) * 0.02; // +2% por unidade de complexidade
    }

    // Ajustes baseados no tipo de mudança
    if (test.change.type === 'modified' && test.change.lines > 20) {
      baseProbability += 0.15; // Mudanças grandes aumentam risco
    }

    const probability = Math.min(0.95, Math.max(0.05, baseProbability));

    let emoji, recommendation;
    if (probability > 0.7) {
      emoji = '🔴';
      recommendation = 'Prioridade alta - alto risco de problemas';
    } else if (probability > 0.4) {
      emoji = '🟡';
      recommendation = 'Monitorar - risco moderado';
    } else {
      emoji = '🟢';
      recommendation = 'Normal - baixo risco';
    }

    return {
      test: test.name,
      probability,
      emoji,
      recommendation,
      factors: historicalData ? [
        `Complexidade: ${historicalData.complexity}`,
        `Flakes recentes: ${historicalData.recentFlakes}`,
        `Mudanças: ${test.change.lines} linhas`
      ] : ['Dados históricos limitados']
    };
  });

  return predictions;
}

async function simulatePerformancePrediction(scenario) {
  // Simula predição de impacto na performance
  let p95Impact = 0;
  let lighthouseImpact = 0;

  scenario.changes.forEach(change => {
    if (change.file.includes('components/')) {
      p95Impact += change.lines * 0.05; // +50ms por linha modificada em componentes
      lighthouseImpact -= change.lines * 0.01; // -0.1 pontos por linha
    }
    if (change.file.includes('lib/composition/')) {
      p95Impact += change.lines * 0.08; // +80ms para mudanças no core
      lighthouseImpact -= change.lines * 0.02; // -0.2 pontos
    }
  });

  const overallRisk = p95Impact > 2 ? 'Alto' : p95Impact > 1 ? 'Médio' : 'Baixo';

  return {
    p95Impact,
    lighthouseImpact,
    p95Confidence: 75,
    overallRisk
  };
}

function calculateCIOptimization(tiaAnalysis, flakePredictions, perfPrediction) {
  const impactedTests = tiaAnalysis.impactedTests;
  const originalTime = impactedTests.length * 8; // 8min por teste médio
  let optimizedTime = 0;

  // Ordena por risco (baixa → alta) para feedback rápido
  const riskOrder = { '🟢': 1, '🟡': 2, '🔴': 3 };
  const sortedTests = flakePredictions
    .sort((a, b) => riskOrder[a.emoji] - riskOrder[b.emoji])
    .map(p => p.test);

  // Calcula tempo otimizado (paralelização + ordem inteligente)
  const parallelizationFactor = Math.min(3, impactedTests.length); // Máximo 3 paralelos
  const avgTestTime = 6; // minutos com otimizações
  optimizedTime = Math.ceil((impactedTests.length * avgTestTime) / parallelizationFactor);

  const speedup = Math.round(((originalTime - optimizedTime) / originalTime) * 100);

  // Calcula confiança geral
  const avgFlakeRisk = flakePredictions.reduce((sum, p) => sum + p.probability, 0) / flakePredictions.length;
  const confidence = Math.max(0.1, 1 - avgFlakeRisk - (perfPrediction.p95Impact / 10));

  return {
    executionOrder: sortedTests,
    originalTime,
    estimatedTime: optimizedTime,
    speedup,
    timeSavings: originalTime - optimizedTime,
    confidence,
    recommendations: [
      sortedTests.length > 1 ? "Executar testes de baixo risco primeiro para feedback rápido" : "Teste único - foco na estabilidade",
      parallelizationFactor > 1 ? `Paralelização em ${parallelizationFactor} workers recomendada` : "Execução sequencial adequada",
      perfPrediction.overallRisk === 'Alto' ? "Monitorar métricas de performance após deploy" : "Performance dentro dos parâmetros"
    ]
  };
}

function generateAlerts(tiaAnalysis, flakePredictions, perfPrediction) {
  const alerts = [];

  // Alertas de flake
  const highRiskFlakes = flakePredictions.filter(p => p.probability > 0.7);
  if (highRiskFlakes.length > 0) {
    alerts.push({
      level: '🟡',
      message: `${highRiskFlakes.length} teste(s) com alto risco de flake detectado`
    });
  }

  // Alertas de performance
  if (perfPrediction.p95Impact > 2) {
    alerts.push({
      level: '🟡',
      message: `Impacto significativo na performance previsto (+${perfPrediction.p95Impact.toFixed(1)}s no p95)`
    });
  }

  // Alertas positivos
  if (flakePredictions.every(p => p.probability < 0.3)) {
    alerts.push({
      level: '✅',
      message: 'Todos os testes com baixo risco de problemas'
    });
  }

  return alerts.length > 0 ? alerts : [{
    level: '✅',
    message: 'Nenhum alerta crítico - mudanças seguras'
  }];
}

runDemo().catch(console.error);
