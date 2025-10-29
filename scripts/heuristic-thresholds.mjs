#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log('🧠 Heurísticas Adaptativas - Thresholds Auto-Ajustáveis\n');

// Configuração de heurísticas
const HEURISTICS_CONFIG = {
  // Janela de análise (últimos N dias)
  analysisWindow: 14,

  // Fatores de ajuste
  adjustmentFactors: {
    trend: 0.1,      // 10% de ajuste por tendência
    volatility: 0.05, // 5% de ajuste por volatilidade
    seasonality: 0.03 // 3% de ajuste por sazonalidade
  },

  // Thresholds adaptativos por métrica
  adaptiveThresholds: {
    'chromium.p95': {
      baseline: 12.0,
      minThreshold: 10.0,
      maxThreshold: 15.0,
      tolerance: 0.1 // 10% de tolerância
    },
    'firefox.p95': {
      baseline: 13.8,
      minThreshold: 12.0,
      maxThreshold: 18.0,
      tolerance: 0.15 // 15% de tolerância
    },
    'flakeRate': {
      baseline: 0.8,
      minThreshold: 0.1,
      maxThreshold: 2.0,
      tolerance: 0.5 // 50% de tolerância relativa
    },
    'lighthouse.performance': {
      baseline: 92,
      minThreshold: 85,
      maxThreshold: 98,
      tolerance: 0.05 // 5% de tolerância
    }
  }
};

// Dados históricos simulados (em produção viria de banco/dash)
const HISTORICAL_DATA = {
  'chromium.p95': [
    12.1, 11.8, 12.3, 11.9, 12.5, 12.2, 11.7, 12.0, 12.4, 11.6,
    12.1, 12.3, 11.9, 12.2 // Últimos 14 dias
  ],
  'firefox.p95': [
    13.9, 13.5, 14.1, 13.7, 14.3, 13.8, 13.4, 13.9, 14.2, 13.3,
    13.8, 14.0, 13.6, 13.9
  ],
  'flakeRate': [
    0.9, 0.7, 1.1, 0.8, 0.6, 0.9, 0.5, 0.8, 1.0, 0.4,
    0.7, 0.9, 0.6, 0.8
  ],
  'lighthouse.performance': [
    91, 93, 90, 92, 94, 91, 93, 92, 90, 94,
    91, 92, 93, 91
  ]
};

function calculateTrend(values) {
  // Regressão linear simples para detectar tendência
  const n = values.length;
  const x = Array.from({length: n}, (_, i) => i);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  return {
    slope,
    direction: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable',
    magnitude: Math.abs(slope)
  };
}

function calculateVolatility(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean; // Coeficiente de variação

  return {
    stdDev,
    cv,
    volatility: cv > 0.1 ? 'high' : cv > 0.05 ? 'medium' : 'low'
  };
}

function detectSeasonality(values, period = 7) {
  // Detecção simples de padrões semanais
  if (values.length < period * 2) return { hasSeasonality: false };

  const recent = values.slice(-period);
  const previous = values.slice(-period * 2, -period);

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;

  const seasonalityStrength = Math.abs(recentAvg - previousAvg) / previousAvg;

  return {
    hasSeasonality: seasonalityStrength > 0.05,
    strength: seasonalityStrength,
    direction: recentAvg > previousAvg ? 'up' : 'down'
  };
}

function calculateAdaptiveThreshold(metric, config, values) {
  const baseline = config.baseline;
  const trend = calculateTrend(values);
  const volatility = calculateVolatility(values);
  const seasonality = detectSeasonality(values);

  // Ajuste baseado em tendência
  let adjustment = 0;

  // Ajuste por tendência
  if (trend.direction === 'increasing') {
    adjustment += trend.magnitude * HEURISTICS_CONFIG.adjustmentFactors.trend;
  } else if (trend.direction === 'decreasing') {
    adjustment -= trend.magnitude * HEURISTICS_CONFIG.adjustmentFactors.trend;
  }

  // Ajuste por volatilidade
  if (volatility.volatility === 'high') {
    adjustment += baseline * HEURISTICS_CONFIG.adjustmentFactors.volatility;
  }

  // Ajuste por sazonalidade
  if (seasonality.hasSeasonality) {
    const seasonalAdjustment = baseline * seasonality.strength * HEURISTICS_CONFIG.adjustmentFactors.seasonality;
    adjustment += seasonality.direction === 'up' ? seasonalAdjustment : -seasonalAdjustment;
  }

  // Calcular novo threshold
  const newThreshold = Math.max(
    config.minThreshold,
    Math.min(config.maxThreshold, baseline + adjustment)
  );

  // Calcular confidence no ajuste
  const confidence = Math.max(0.1, 1 - volatility.cv - Math.abs(adjustment) / baseline);

  return {
    originalThreshold: baseline,
    newThreshold,
    adjustment,
    confidence,
    factors: {
      trend: trend.direction,
      volatility: volatility.volatility,
      seasonality: seasonality.hasSeasonality ? seasonality.direction : 'none'
    },
    reasoning: generateReasoning(trend, volatility, seasonality, adjustment)
  };
}

function generateReasoning(trend, volatility, seasonality, adjustment) {
  const reasons = [];

  if (Math.abs(adjustment) > 0.01) {
    if (trend.direction !== 'stable') {
      reasons.push(`Tendência ${trend.direction} detectada (${trend.slope.toFixed(3)})`);
    }

    if (volatility.volatility === 'high') {
      reasons.push(`Alta volatilidade (${(volatility.cv * 100).toFixed(1)}% CV)`);
    }

    if (seasonality.hasSeasonality) {
      reasons.push(`Padrão sazonal ${seasonality.direction} (${(seasonality.strength * 100).toFixed(1)}% de força)`);
    }

    const direction = adjustment > 0 ? 'aumentado' : 'reduzido';
    reasons.push(`Threshold ${direction} em ${Math.abs(adjustment).toFixed(2)} unidades`);
  } else {
    reasons.push('Métricas estáveis - threshold mantido');
  }

  return reasons;
}

function generateAdaptiveConfig() {
  console.log('🧠 Calculando thresholds adaptativos...\n');

  const adaptiveConfig = {
    timestamp: new Date().toISOString(),
    analysisWindow: HEURISTICS_CONFIG.analysisWindow,
    thresholds: {}
  };

  console.log('┌─────────────────────┬────────────┬────────────┬────────────┬──────────┐');
  console.log('│ Métrica             │ Original   │ Adaptado  │ Ajuste     │ Confiança│');
  console.log('├─────────────────────┼────────────┼────────────┼────────────┼──────────┤');

  for (const [metric, config] of Object.entries(HEURISTICS_CONFIG.adaptiveThresholds)) {
    const values = HISTORICAL_DATA[metric];
    if (!values) continue;

    const result = calculateAdaptiveThreshold(metric, config, values);

    adaptiveConfig.thresholds[metric] = {
      original: result.originalThreshold,
      adaptive: result.newThreshold,
      adjustment: result.adjustment,
      confidence: result.confidence,
      factors: result.factors,
      reasoning: result.reasoning
    };

    const name = metric.padEnd(19);
    const original = String(result.originalThreshold).padStart(10);
    const adapted = result.newThreshold.toFixed(1).padStart(10);
    const adjustment = (result.adjustment >= 0 ? '+' : '') + result.adjustment.toFixed(1).padStart(10);
    const confidence = `${(result.confidence * 100).toFixed(0)}%`.padStart(8);

    console.log(`│ ${name} │ ${original} │ ${adapted} │ ${adjustment} │ ${confidence} │`);
  }

  console.log('└─────────────────────┴────────────┴────────────┴────────────┴──────────┘\n');

  return adaptiveConfig;
}

function analyzeInsights(adaptiveConfig) {
  console.log('🔍 Análise de Insights:\n');

  const insights = [];

  // Análise de tendências gerais
  const increasingMetrics = Object.entries(adaptiveConfig.thresholds)
    .filter(([_, config]) => config.adjustment > 0.01);

  const decreasingMetrics = Object.entries(adaptiveConfig.thresholds)
    .filter(([_, config]) => config.adjustment < -0.01);

  if (increasingMetrics.length > 0) {
    insights.push(`📈 ${increasingMetrics.length} métricas com tendência de aumento - considerar investigação`);
  }

  if (decreasingMetrics.length > 0) {
    insights.push(`📉 ${decreasingMetrics.length} métricas melhorando - ótimo sinal de qualidade!`);
  }

  // Análise de confiança
  const lowConfidence = Object.entries(adaptiveConfig.thresholds)
    .filter(([_, config]) => config.confidence < 0.7);

  if (lowConfidence.length > 0) {
    insights.push(`⚠️  ${lowConfidence.length} métricas com baixa confiança - coletar mais dados`);
  }

  // Insights específicos por métrica
  for (const [metric, config] of Object.entries(adaptiveConfig.thresholds)) {
    if (config.factors.trend === 'increasing' && config.factors.volatility === 'high') {
      insights.push(`🚨 ${metric}: tendência ruim + alta volatilidade - atenção imediata`);
    }
  }

  if (insights.length === 0) {
    insights.push('✅ Todas as métricas estáveis e confiáveis');
  }

  insights.forEach(insight => console.log(`  ${insight}`));
  console.log();

  return insights;
}

function generatePlaywrightConfig(adaptiveConfig) {
  const config = {
    // Configuração adaptativa para Playwright
    expect: {
      toHaveScreenshot: {
        threshold: calculateAdaptiveScreenshotThreshold(adaptiveConfig)
      }
    },

    // Thresholds adaptativos
    metadata: {
      adaptiveThresholds: adaptiveConfig.thresholds
    }
  };

  const configPath = path.join(process.cwd(), 'playwright.adaptive.config.ts');
  const configContent = `// Configuração Adaptativa Gerada Automaticamente
// Timestamp: ${adaptiveConfig.timestamp}
import { defineConfig, devices } from '@playwright/test';

const adaptiveConfig = ${JSON.stringify(config, null, 2)};

export { adaptiveConfig };
`;

  fs.writeFileSync(configPath, configContent);
  console.log(`📝 Configuração adaptativa salva: ${configPath}`);
}

function calculateAdaptiveScreenshotThreshold(adaptiveConfig) {
  // Threshold adaptativo baseado na volatilidade geral
  const flakeRates = Object.values(adaptiveConfig.thresholds)
    .map(t => HISTORICAL_DATA.flakeRate || [])
    .flat();

  const avgFlakeRate = flakeRates.reduce((a, b) => a + b, 0) / flakeRates.length;

  // Threshold mais permissivo se alta taxa de flakes
  const baseThreshold = 0.05;
  const adaptiveThreshold = Math.min(0.15, baseThreshold + (avgFlakeRate / 100));

  return adaptiveThreshold;
}

async function main() {
  console.log('🎯 Implementando Heurísticas Adaptativas...\n');

  // 1. Gerar configuração adaptativa
  const adaptiveConfig = generateAdaptiveConfig();

  // 2. Análise de insights
  const insights = analyzeInsights(adaptiveConfig);

  // 3. Gerar configuração Playwright
  generatePlaywrightConfig(adaptiveConfig);

  // 4. Salvar configuração completa
  const outputPath = path.join(process.cwd(), 'adaptive-thresholds.json');
  fs.writeFileSync(outputPath, JSON.stringify(adaptiveConfig, null, 2));

  console.log('📊 Resumo dos Ajustes:');
  const adjustments = Object.entries(adaptiveConfig.thresholds)
    .map(([metric, config]) => ({
      metric,
      adjustment: config.adjustment,
      confidence: config.confidence
    }))
    .sort((a, b) => Math.abs(b.adjustment) - Math.abs(a.adjustment));

  adjustments.slice(0, 3).forEach(adj => {
    const direction = adj.adjustment > 0 ? 'aumentado' : adj.adjustment < 0 ? 'reduzido' : 'mantido';
    console.log(`   • ${adj.metric}: ${direction} (${(adj.confidence * 100).toFixed(0)}% confiança)`);
  });

  console.log(`\n📄 Configuração completa salva: ${outputPath}`);
  console.log('\n🎯 Benefícios:');
  console.log('   • Thresholds ajustam automaticamente com o comportamento real');
  console.log('   • Menos falsos positivos/negativos');
  console.log('   • Adaptação a mudanças no produto/infra');

  console.log('\n✅ Heurísticas Adaptativas implementadas!');
}

main().catch(console.error);
