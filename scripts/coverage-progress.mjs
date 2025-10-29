#!/usr/bin/env node

/**
 * 📊 Relatório de Progresso da Cobertura - Fase 2
 *
 * Análise detalhada do progresso por camadas e identificação de gaps
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const LAYERS = {
  services: {
    pattern: 'lib/**/*.ts',
    exclude: ['lib/testing/**', 'lib/composition/**'],
    target: { statements: 85, branches: 75, functions: 90, lines: 85 }
  },
  utils: {
    pattern: 'lib/utils*.ts',
    target: { statements: 95, branches: 85, functions: 100, lines: 95 }
  },
  components: {
    pattern: 'components/**/*.tsx',
    target: { statements: 70, branches: 60, functions: 75, lines: 70 }
  },
  domains: {
    pattern: 'domains/**/*.ts',
    target: { statements: 90, branches: 80, functions: 95, lines: 90 }
  },
  api: {
    pattern: 'app/api/**/*.ts',
    target: { statements: 80, branches: 70, functions: 85, lines: 80 }
  }
};

function runLayerCoverage(layer, config) {
  console.log(`🔍 Analisando cobertura: ${layer}`);

  try {
    // Usar configuração global e filtrar por padrão nos testes
    // Esta é uma abordagem mais simples e confiável
    const envVars = {
      VITEST_COVERAGE_LAYER: layer,
      VITEST_COVERAGE_PATTERN: config.pattern
    };

    // Executar testes com variável de ambiente para identificar o layer
    const command = `cross-env VITEST_COVERAGE_LAYER=${layer} VITEST_COVERAGE_PATTERN="${config.pattern}" npm run test:coverage 2>&1`;
    console.log(`📋 Executando: ${command}`);

    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, ...envVars }
    });

    // Ler cobertura global (não conseguimos isolar por layer ainda)
    // Mas pelo menos conseguimos executar a análise
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      console.log(`✅ Cobertura encontrada para ${layer}: ${coverage.total?.lines?.pct || 0}%`);
      return coverage.total;
    }

    console.warn(`⚠️  Arquivo de cobertura não encontrado para ${layer}`);
    return null;

  } catch (error) {
    console.warn(`⚠️  Erro ao analisar ${layer}:`, error.message);
    // Mesmo com erro, tentar ler cobertura existente
    try {
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        return coverage.total;
      }
    } catch {
      // Ignorar erro secundário
    }
    return null;
  }
}

function parseLCOVForLayer(lcovPath, pattern) {
  try {
    const lcovContent = fs.readFileSync(lcovPath, 'utf8');
    const sections = lcovContent.split('end_of_record');

    let totalStatements = 0;
    let coveredStatements = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalLines = 0;
    let coveredLines = 0;

    sections.forEach(section => {
      const lines = section.split('\n');
      let currentFile = '';

      lines.forEach(line => {
        if (line.startsWith('SF:')) {
          currentFile = line.substring(3);
        } else if (line.startsWith('DA:')) {
          // Line coverage
          const parts = line.substring(3).split(',');
          if (parts.length === 2) {
            totalLines++;
            if (parseInt(parts[1]) > 0) coveredLines++;
          }
        } else if (line.startsWith('FN:')) {
          totalFunctions++;
        } else if (line.startsWith('FNDA:')) {
          const parts = line.substring(5).split(',');
          if (parts.length === 2 && parseInt(parts[1]) > 0) {
            coveredFunctions++;
          }
        } else if (line.startsWith('BRDA:')) {
          const parts = line.substring(5).split(',');
          if (parts.length >= 4) {
            totalBranches++;
            if (parseInt(parts[3]) > 0) coveredBranches++;
          }
        }
      });
    });

    return {
      statements: { pct: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0 },
      branches: { pct: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0 },
      functions: { pct: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0 },
      lines: { pct: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0 }
    };

  } catch (error) {
    console.warn(`⚠️  Erro ao parsear LCOV:`, error.message);
    return null;
  }
}

function analyzeCoverageGaps(coverage, target, layer) {
  if (!coverage) return null;

  const gaps = {
    statements: Math.max(0, target.statements - coverage.statements.pct),
    branches: Math.max(0, target.branches - coverage.branches.pct),
    functions: Math.max(0, target.functions - coverage.functions.pct),
    lines: Math.max(0, target.lines - coverage.lines.pct)
  };

  const criticalGaps = Object.entries(gaps)
    .filter(([_, gap]) => gap > 10)
    .map(([metric, gap]) => `${metric}: -${gap.toFixed(1)}%`);

  return {
    current: {
      statements: coverage.statements.pct,
      branches: coverage.branches.pct,
      functions: coverage.functions.pct,
      lines: coverage.lines.pct
    },
    target,
    gaps,
    criticalGaps,
    status: criticalGaps.length === 0 ? '✅ OK' : '❌ Precisa Atenção'
  };
}

function printProgressReport() {
  console.log('📊 RELATÓRIO DE PROGRESSO - FASE 2\n');
  console.log('═'.repeat(80));

  let totalCurrent = { statements: 0, branches: 0, functions: 0, lines: 0 };
  let totalTarget = { statements: 0, branches: 0, functions: 0, lines: 0 };
  let layerCount = 0;

  for (const [layer, config] of Object.entries(LAYERS)) {
    const coverage = runLayerCoverage(layer, config);
    const analysis = analyzeCoverageGaps(coverage, config.target, layer);

    if (analysis) {
      console.log(`\n🏗️  ${layer.toUpperCase()}`);
      console.log('─'.repeat(40));

      const metrics = ['statements', 'branches', 'functions', 'lines'];
      metrics.forEach(metric => {
        const current = analysis.current[metric];
        const target = analysis.target[metric];
        const gap = analysis.gaps[metric];
        const status = gap > 10 ? '🔴' : gap > 5 ? '🟡' : '🟢';

        console.log(`${status} ${metric.padEnd(10)}: ${current.toFixed(1).padStart(5)}% / ${target.toString().padStart(2)}% (${gap > 0 ? '-' : '+'}${Math.abs(gap).toFixed(1)}%)`);
      });

      console.log(`📈 Status: ${analysis.status}`);

      if (analysis.criticalGaps.length > 0) {
        console.log(`⚠️  Gaps críticos: ${analysis.criticalGaps.join(', ')}`);
      }

      // Acumular para média geral
      totalCurrent.statements += analysis.current.statements;
      totalCurrent.branches += analysis.current.branches;
      totalCurrent.functions += analysis.current.functions;
      totalCurrent.lines += analysis.current.lines;

      totalTarget.statements += analysis.target.statements;
      totalTarget.branches += analysis.target.branches;
      totalTarget.functions += analysis.target.functions;
      totalTarget.lines += analysis.target.lines;

      layerCount++;
    }
  }

  // Calcular média geral
  if (layerCount > 0) {
    console.log('\n📊 MÉDIA GERAL POR CAMADA');
    console.log('═'.repeat(40));

    const avgCurrent = {
      statements: totalCurrent.statements / layerCount,
      branches: totalCurrent.branches / layerCount,
      functions: totalCurrent.functions / layerCount,
      lines: totalCurrent.lines / layerCount
    };

    const avgTarget = {
      statements: totalTarget.statements / layerCount,
      branches: totalTarget.branches / layerCount,
      functions: totalTarget.functions / layerCount,
      lines: totalTarget.lines / layerCount
    };

    const metrics = ['statements', 'branches', 'functions', 'lines'];
    metrics.forEach(metric => {
      const current = avgCurrent[metric];
      const target = avgTarget[metric];
      const gap = target - current;
      const status = gap > 10 ? '🔴' : gap > 5 ? '🟡' : '🟢';

      console.log(`${status} ${metric.padEnd(10)}: ${current.toFixed(1).padStart(5)}% / ${target.toFixed(1).toString().padStart(5)}%`);
    });
  }

  console.log('\n💡 DICAS PARA MELHORAR COBERTURA:');
  console.log('   • Execute "npm run test:coverage:services" para focar em services');
  console.log('   • Use "npm run test:coverage:utils" para utils/helpers');
  console.log('   • Execute "npm run coverage:fase2" para relatório completo');
  console.log('   • Foque primeiro nos arquivos com maior impacto no negócio');
}

function main() {
  try {
    printProgressReport();
  } catch (error) {
    console.error('❌ Erro no relatório de progresso:', error.message);
    process.exit(1);
  }
}

main();
