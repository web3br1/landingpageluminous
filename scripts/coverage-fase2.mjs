#!/usr/bin/env node

/**
 * 📈 FASE 2: Sistema de Cobertura Progressiva
 *
 * Script principal para acompanhar progresso da cobertura na Fase 2
 * Thresholds aumentam progressivamente conforme o plano semanal
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PHASES = {
  semana3: {
    statements: 35,
    branches: 30,
    functions: 40,
    lines: 35,
    description: 'Semana 3: Infraestrutura + Services Críticos'
  },
  semana4: {
    statements: 50,
    branches: 40,
    functions: 55,
    lines: 50,
    description: 'Semana 4: Expansão Sistemática'
  },
  semana5: {
    statements: 65,
    branches: 55,
    functions: 70,
    lines: 65,
    description: 'Semana 5: Qualidade e Refatoração'
  },
  semana6: {
    statements: 80,
    branches: 70,
    functions: 75,
    lines: 80,
    description: 'Semana 6: Otimização Final (Meta Final)'
  }
};

const TARGETS = {
  services: { statements: 85, branches: 75, functions: 90, lines: 85 },
  utils: { statements: 95, branches: 85, functions: 100, lines: 95 },
  components: { statements: 70, branches: 60, functions: 75, lines: 70 },
  domains: { statements: 90, branches: 80, functions: 95, lines: 90 },
  api: { statements: 80, branches: 70, functions: 85, lines: 80 }
};

function getCurrentPhase() {
  const now = new Date();
  const startDate = new Date('2025-10-28'); // Data de início da Fase 2
  const daysDiff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 7) return 'semana3';
  if (daysDiff <= 14) return 'semana4';
  if (daysDiff <= 21) return 'semana5';
  return 'semana6';
}

function runCoverage() {
  console.log('🚀 Executando cobertura completa...\n');

  try {
    execSync('npm run test:coverage', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('❌ Erro na execução da cobertura:', error.message);
    return false;
  }
}

function parseCoverageReport() {
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

  if (!fs.existsSync(coveragePath)) {
    console.error('❌ Arquivo de cobertura não encontrado:', coveragePath);
    return null;
  }

  try {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    return coverage.total;
  } catch (error) {
    console.error('❌ Erro ao ler relatório de cobertura:', error.message);
    return null;
  }
}

function checkPhaseGoals(coverage, phase) {
  const goals = PHASES[phase];
  const results = {
    statements: coverage.statements.pct >= goals.statements,
    branches: coverage.branches.pct >= goals.branches,
    functions: coverage.functions.pct >= goals.functions,
    lines: coverage.lines.pct >= goals.lines
  };

  return {
    phase,
    goals,
    actual: {
      statements: coverage.statements.pct,
      branches: coverage.branches.pct,
      functions: coverage.functions.pct,
      lines: coverage.lines.pct
    },
    passed: results,
    allPassed: Object.values(results).every(Boolean)
  };
}

function printPhaseReport(result) {
  console.log(`\n📊 ${PHASES[result.phase].description}`);
  console.log('═'.repeat(60));

  const metrics = ['statements', 'branches', 'functions', 'lines'];

  metrics.forEach(metric => {
    const goal = result.goals[metric];
    const actual = result.actual[metric];
    const passed = result.passed[metric];
    const status = passed ? '✅' : '❌';

    console.log(`${status} ${metric.padEnd(10)}: ${actual.toFixed(1).padStart(5)}% (meta: ${goal}%)`);
  });

  console.log(`\n🎯 Status: ${result.allPassed ? 'META ATINGIDA! 🎉' : 'Continuar trabalhando...'}`);
}

function printRecommendations(result) {
  if (result.allPassed) {
    console.log('\n💡 Parabéns! Meta da fase atingida. Próximos passos:');
    console.log('   • Avançar para próxima fase do plano');
    console.log('   • Focar em testes edge cases');
    console.log('   • Melhorar qualidade dos testes existentes');
    return;
  }

  console.log('\n💡 Recomendações para próxima iteração:');

  const gaps = [];
  if (!result.passed.statements) gaps.push('statements');
  if (!result.passed.branches) gaps.push('branches');
  if (!result.passed.functions) gaps.push('functions');
  if (!result.passed.lines) gaps.push('lines');

  if (gaps.length > 0) {
    console.log(`   • Priorizar cobertura de: ${gaps.join(', ')}`);
  }

  console.log('   • Identificar arquivos com baixa cobertura');
  console.log('   • Adicionar testes para caminhos não cobertos');
  console.log('   • Refatorar código complexo para melhorar testabilidade');
}

function main() {
  console.log('📈 FASE 2: Sistema de Cobertura Progressiva\n');

  const currentPhase = getCurrentPhase();
  console.log(`📅 Fase Atual: ${PHASES[currentPhase].description}\n`);

  // Executar cobertura
  const success = runCoverage();
  if (!success) {
    process.exit(1);
  }

  // Analisar resultados
  const coverage = parseCoverageReport();
  if (!coverage) {
    process.exit(1);
  }

  // Verificar metas da fase
  const result = checkPhaseGoals(coverage, currentPhase);

  // Exibir relatório
  printPhaseReport(result);
  printRecommendations(result);

  // Status de saída
  process.exit(result.allPassed ? 0 : 1);
}

main();
