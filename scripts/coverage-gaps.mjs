#!/usr/bin/env node

/**
 * 🔍 Identificação de Gaps de Cobertura - Fase 2
 *
 * Analisa arquivos com baixa cobertura e sugere próximos testes
 */

import fs from 'fs';
import path from 'path';

const COVERAGE_THRESHOLDS = {
  critical: 70,    // Arquivos críticos devem ter pelo menos 70%
  important: 50,   // Arquivos importantes pelo menos 50%
  minimum: 30      // Mínimo aceitável
};

const PRIORITY_FILES = [
  // Services críticos (Dia 12)
  'lib/page-composition-service.ts',
  'lib/content-mapper.ts',
  'lib/seo-optimizer.ts',

  // Utils essenciais (Dia 13)
  'lib/utils.ts',
  'lib/advanced-utils.ts',
  'lib/performance/lazy-loading.tsx',

  // Components principais
  'components/sections/hero.tsx',
  'components/sections/features.tsx',
  'components/sections/pricing.tsx',

  // Domain entities
  'modules/lead-generation/',
  'domains/marketing/'
];

function loadCoverageData() {
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

  if (!fs.existsSync(coveragePath)) {
    console.error('❌ Arquivo de cobertura não encontrado. Execute "npm run test:coverage" primeiro.');
    process.exit(1);
  }

  const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  return coverage;
}

function analyzeFileCoverage(coverage) {
  const files = Object.entries(coverage).filter(([key]) => key !== 'total');

  return files.map(([filePath, data]) => ({
    file: filePath,
    statements: data.statements.pct,
    branches: data.branches.pct,
    functions: data.functions.pct,
    lines: data.lines.pct,
    avgCoverage: (data.statements.pct + data.branches.pct + data.functions.pct + data.lines.pct) / 4
  })).sort((a, b) => a.avgCoverage - b.avgCoverage); // Menor cobertura primeiro
}

function getPriorityLevel(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);

  for (const priority of PRIORITY_FILES) {
    if (relativePath.includes(priority)) {
      return 'CRÍTICO';
    }
  }

  if (relativePath.startsWith('lib/')) return 'IMPORTANTE';
  if (relativePath.startsWith('components/')) return 'MÉDIO';
  if (relativePath.startsWith('app/api/')) return 'IMPORTANTE';
  if (relativePath.startsWith('domains/')) return 'IMPORTANTE';

  return 'BAIXO';
}

function getCoverageStatus(avgCoverage) {
  if (avgCoverage >= COVERAGE_THRESHOLDS.critical) return '🟢 BOM';
  if (avgCoverage >= COVERAGE_THRESHOLDS.important) return '🟡 RAZOÁVEL';
  if (avgCoverage >= COVERAGE_THRESHOLDS.minimum) return '🟠 PREOCUPANTE';
  return '🔴 CRÍTICO';
}

function generateTestSuggestions(filePath, coverage) {
  const suggestions = [];
  const fileName = path.basename(filePath, path.extname(filePath));

  if (coverage.functions < 50) {
    suggestions.push(`• Testar funções públicas principais de ${fileName}`);
  }

  if (coverage.branches < 40) {
    suggestions.push(`• Adicionar testes para caminhos condicionais (if/else, switch)`);
  }

  if (coverage.statements < 50) {
    suggestions.push(`• Aumentar cobertura de statements executáveis`);
  }

  if (coverage.lines < 50) {
    suggestions.push(`• Verificar linhas não executadas durante testes`);
  }

  return suggestions;
}

function printGapsReport(files) {
  console.log('🔍 ANÁLISE DE GAPS DE COBERTURA - FASE 2\n');
  console.log('═'.repeat(100));

  // Arquivos críticos primeiro
  const criticalFiles = files.filter(f => {
    const priority = getPriorityLevel(f.file);
    return priority === 'CRÍTICO' || f.avgCoverage < COVERAGE_THRESHOLDS.minimum;
  });

  if (criticalFiles.length > 0) {
    console.log('\n🚨 ARQUIVOS CRÍTICOS (Prioridade Máxima):\n');

    criticalFiles.forEach((file, index) => {
      const priority = getPriorityLevel(file.file);
      const status = getCoverageStatus(file.avgCoverage);

      console.log(`${index + 1}. ${path.relative(process.cwd(), file.file)}`);
      console.log(`   Prioridade: ${priority} | Status: ${status}`);
      console.log(`   Média: ${file.avgCoverage.toFixed(1)}% (S:${file.statements.toFixed(1)}% B:${file.branches.toFixed(1)}% F:${file.functions.toFixed(1)}% L:${file.lines.toFixed(1)}%)`);

      const suggestions = generateTestSuggestions(file.file, file);
      if (suggestions.length > 0) {
        console.log('   💡 Sugestões:');
        suggestions.forEach(suggestion => console.log(`      ${suggestion}`));
      }
      console.log('');
    });
  }

  // Estatísticas gerais
  const stats = {
    total: files.length,
    good: files.filter(f => f.avgCoverage >= COVERAGE_THRESHOLDS.critical).length,
    reasonable: files.filter(f => f.avgCoverage >= COVERAGE_THRESHOLDS.important && f.avgCoverage < COVERAGE_THRESHOLDS.critical).length,
    concerning: files.filter(f => f.avgCoverage >= COVERAGE_THRESHOLDS.minimum && f.avgCoverage < COVERAGE_THRESHOLDS.important).length,
    critical: files.filter(f => f.avgCoverage < COVERAGE_THRESHOLDS.minimum).length
  };

  console.log('📊 ESTATÍSTICAS GERAIS:');
  console.log('─'.repeat(40));
  console.log(`Total de arquivos: ${stats.total}`);
  console.log(`🟢 Boa cobertura (≥${COVERAGE_THRESHOLDS.critical}%): ${stats.good}`);
  console.log(`🟡 Razoável (≥${COVERAGE_THRESHOLDS.important}%): ${stats.reasonable}`);
  console.log(`🟠 Preocupante (≥${COVERAGE_THRESHOLDS.minimum}%): ${stats.concerning}`);
  console.log(`🔴 Crítica (<${COVERAGE_THRESHOLDS.minimum}%): ${stats.critical}`);

  const avgCoverage = files.reduce((sum, f) => sum + f.avgCoverage, 0) / files.length;
  console.log(`\n📈 Média geral: ${avgCoverage.toFixed(1)}%`);

  // Próximos passos baseados na fase
  console.log('\n🎯 PRÓXIMOS PASSOS RECOMENDADOS:');
  console.log('   1. Focar nos arquivos críticos listados acima');
  console.log('   2. Priorizar services e utils para impacto imediato');
  console.log('   3. Adicionar testes para branches não cobertos');
  console.log('   4. Refatorar funções complexas para melhorar testabilidade');

  console.log('\n💡 SCRIPTS ÚTEIS:');
  console.log('   • npm run test:coverage:services - Foco em services');
  console.log('   • npm run test:coverage:utils - Foco em utils');
  console.log('   • npm run test:coverage:progress - Relatório completo');
}

function main() {
  try {
    const coverage = loadCoverageData();
    const files = analyzeFileCoverage(coverage);
    printGapsReport(files);
  } catch (error) {
    console.error('❌ Erro na análise de gaps:', error.message);
    process.exit(1);
  }
}

main();
