#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🧩 Test Sharding Inteligente - Distribuição por Criticidade\n');

// Configuração de sharding baseado em dados históricos
const SHARD_CONFIG = {
  // Shards por prioridade/criticidade
  critical: {
    name: 'critical-path',
    priority: 1,
    specs: ['**/hydration.test.ts', '**/ssr.test.ts'],
    browsers: ['chromium'], // Só o mais rápido para critical
    workers: 2,
    timeout: 120000,
    description: 'Caminho crítico - hidratação e SSR'
  },

  high: {
    name: 'high-priority',
    priority: 2,
    specs: ['**/critical-flows-e2e.spec.ts'],
    browsers: ['chromium', 'firefox'],
    workers: 1,
    timeout: 180000,
    description: 'Fluxos críticos de usuário'
  },

  medium: {
    name: 'medium-priority',
    priority: 3,
    specs: ['**/visual-regression-core.spec.ts'],
    browsers: ['chromium'],
    workers: 1,
    timeout: 150000,
    description: 'Regressão visual core'
  },

  low: {
    name: 'low-priority',
    priority: 4,
    specs: ['**/visual-regression-enhanced.spec.ts', '**/performance-monitoring.spec.ts'],
    browsers: ['firefox'], // Firefox para casos pesados
    workers: 1,
    timeout: 240000,
    description: 'Performance e visual avançado'
  }
};

// Dados históricos de performance por spec (simulado)
const HISTORICAL_DATA = {
  'hydration.test.ts': { avgDuration: 4500, flakeRate: 0.1, failureRate: 0.05 },
  'ssr.test.ts': { avgDuration: 3200, flakeRate: 0.05, failureRate: 0.02 },
  'critical-flows-e2e.spec.ts': { avgDuration: 12000, flakeRate: 0.8, failureRate: 0.15 },
  'visual-regression-core.spec.ts': { avgDuration: 8500, flakeRate: 0.3, failureRate: 0.08 },
  'visual-regression-enhanced.spec.ts': { avgDuration: 21000, flakeRate: 2.1, failureRate: 0.25 },
  'performance-monitoring.spec.ts': { avgDuration: 18000, flakeRate: 1.5, failureRate: 0.18 }
};

function calculateShardMetrics(shard) {
  const specs = shard.specs.flatMap(pattern => {
    // Simular resolução de patterns para specs reais
    return Object.keys(HISTORICAL_DATA).filter(spec =>
      pattern.includes(spec.replace('.spec.ts', '').replace('.test.ts', ''))
    );
  });

  const metrics = specs.map(spec => HISTORICAL_DATA[spec]).filter(Boolean);

  if (metrics.length === 0) return { totalDuration: 0, avgFlakeRate: 0, specsCount: 0 };

  const totalDuration = metrics.reduce((sum, m) => sum + m.avgDuration, 0);
  const avgFlakeRate = metrics.reduce((sum, m) => sum + m.flakeRate, 0) / metrics.length;
  const totalSpecs = metrics.length;

  return {
    totalDuration,
    avgFlakeRate,
    specsCount: totalSpecs,
    estimatedTime: totalDuration * shard.browsers.length,
    parallelizationFactor: shard.workers * shard.browsers.length
  };
}

function optimizeSharding() {
  console.log('🎯 Otimizando distribuição de shards...\n');

  const shards = Object.values(SHARD_CONFIG);
  const optimized = [];

  // Calcular métricas para cada shard
  for (const shard of shards) {
    const metrics = calculateShardMetrics(shard);
    optimized.push({
      ...shard,
      metrics,
      score: calculateShardScore(shard, metrics)
    });
  }

  // Ordenar por prioridade e balanceamento
  optimized.sort((a, b) => {
    // Primeiro por prioridade
    if (a.priority !== b.priority) return a.priority - b.priority;

    // Depois por score (menor tempo estimado primeiro)
    return a.metrics.estimatedTime - b.metrics.estimatedTime;
  });

  return optimized;
}

function calculateShardScore(shard, metrics) {
  // Score baseado em: tempo + flakiness + paralelização
  const timeScore = metrics.estimatedTime / 1000; // segundos
  const flakeScore = metrics.avgFlakeRate * 10; // penalidade por flake
  const parallelScore = metrics.parallelizationFactor * 5; // bonus por paralelização

  return timeScore + flakeScore - parallelScore;
}

function generateShardConfigs(optimizedShards) {
  console.log('📝 Gerando configurações de shard...\n');

  const configs = {};

  for (const shard of optimizedShards) {
    const configName = `playwright.shard.${shard.name}.config.ts`;

    const config = {
      testDir: 'tests',
      testMatch: shard.specs,
      projects: shard.browsers.map(browser => ({
        name: `${shard.name}-${browser}`,
        use: {
          browserName: browser,
          viewport: { width: 1280, height: 720 },
          screenshot: 'only-on-failure',
          video: 'off'
        }
      })),
      workers: shard.workers,
      retries: 0, // Sharding inteligente não precisa de retries
      timeout: shard.timeout,
      expect: {
        timeout: 10000
      },
      reporter: [['json', { outputFile: `shard-${shard.name}-results.json` }]],
      metadata: {
        shard: shard.name,
        priority: shard.priority,
        description: shard.description
      }
    };

    configs[configName] = config;

    // Salvar config individual
    const configPath = path.join(process.cwd(), configName);
    const configContent = `import { defineConfig, devices } from '@playwright/test';\n\nexport default defineConfig(${JSON.stringify(config, null, 2)});`;

    fs.writeFileSync(configPath, configContent);
    console.log(`  ✅ ${configName} gerado`);
  }

  return configs;
}

function createParallelExecutionScript(optimizedShards) {
  const script = `#!/bin/bash

# 🚀 Parallel Shard Execution
# Executa shards em paralelo baseado em prioridade e recursos

echo "🧩 Executando Test Sharding Inteligente..."

# Função para executar shard
run_shard() {
  local shard_name=$1
  local priority=$2
  local timeout=$3

  echo "🏃 Executando shard: $shard_name (prioridade: $priority)"

  # Executar com timeout e capturar resultado
  if timeout $((timeout / 1000))s npx playwright test --config="playwright.shard.$shard_name.config.ts" 2>&1; then
    echo "✅ $shard_name: SUCCESS"
    return 0
  else
    echo "❌ $shard_name: FAILED"
    return 1
  fi
}

# Executar shards críticos primeiro (sequencial)
echo "🎯 Executando shards críticos..."
${optimizedShards.filter(s => s.priority <= 2).map(shard =>
  `run_shard "${shard.name}" ${shard.priority} ${shard.timeout}`
).join('\n')}

# Executar shards restantes em paralelo
echo "🔄 Executando shards restantes em paralelo..."
${optimizedShards.filter(s => s.priority > 2).map(shard =>
  `run_shard "${shard.name}" ${shard.priority} ${shard.timeout} &`
).join('\n')}

# Aguardar todos terminarem
wait

echo "📊 Sharding concluído!"
`;

  const scriptPath = path.join(process.cwd(), 'scripts', 'run-shards-parallel.sh');
  fs.writeFileSync(scriptPath, script);
  console.log(`📝 Script de execução paralela: ${scriptPath}`);
}

async function main() {
  console.log('🎯 Implementando Test Sharding Inteligente...\n');

  // 1. Otimizar sharding
  const optimizedShards = optimizeSharding();

  // 2. Exibir análise
  console.log('📊 Análise de Shards:\n');
  console.log('┌─────────────┬──────────┬──────────────┬────────────┬────────────┬──────────┐');
  console.log('│ Shard       │ Priority │ Specs Count  │ Est. Time  │ Flake Rate │ Score    │');
  console.log('├─────────────┼──────────┼──────────────┼────────────┼────────────┼──────────┤');

  for (const shard of optimizedShards) {
    const name = shard.name.padEnd(11);
    const priority = String(shard.priority).padStart(8);
    const specs = String(shard.metrics.specsCount).padStart(12);
    const time = `${(shard.metrics.estimatedTime / 1000).toFixed(0)}s`.padStart(10);
    const flake = `${shard.metrics.avgFlakeRate.toFixed(1)}%`.padStart(10);
    const score = shard.score.toFixed(1).padStart(8);

    console.log(`│ ${name} │ ${priority} │ ${specs} │ ${time} │ ${flake} │ ${score} │`);
  }

  console.log('└─────────────┴──────────┴──────────────┴────────────┴────────────┴──────────┘\n');

  // 3. Gerar configurações
  const configs = generateShardConfigs(optimizedShards);

  // 4. Criar script de execução paralela
  createParallelExecutionScript(optimizedShards);

  // 5. Calcular benefícios
  const totalTimeOriginal = optimizedShards.reduce((sum, shard) => sum + shard.metrics.estimatedTime, 0);
  const maxParallelTime = Math.max(...optimizedShards.map(s => s.metrics.estimatedTime / s.metrics.parallelizationFactor));
  const speedup = ((totalTimeOriginal - maxParallelTime) / totalTimeOriginal * 100).toFixed(1);

  console.log('🚀 Benefícios Estimados:');
  console.log(`   • Tempo total original: ${(totalTimeOriginal / 1000).toFixed(0)}s`);
  console.log(`   • Tempo com paralelização: ${(maxParallelTime / 1000).toFixed(0)}s`);
  console.log(`   • Speedup: ${speedup}% mais rápido`);
  console.log(`   • Shards gerados: ${optimizedShards.length}`);

  // 6. Salvar plano de sharding
  const planPath = path.join(process.cwd(), 'test-sharding-plan.json');
  fs.writeFileSync(planPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    shards: optimizedShards,
    benefits: {
      totalTimeOriginal,
      maxParallelTime,
      speedup: parseFloat(speedup)
    },
    configs
  }, null, 2));

  console.log(`\n📄 Plano de sharding salvo: ${planPath}`);
  console.log('\n🎯 Como usar:');
  console.log('   1. Execute: ./scripts/run-shards-parallel.sh');
  console.log('   2. Ou execute shards individualmente: npx playwright test --config=playwright.shard.critical-path.config.ts');
  console.log('   3. Monitore resultados em shard-*-results.json');

  console.log('\n✅ Test Sharding Inteligente implementado!');
}

main().catch(console.error);
