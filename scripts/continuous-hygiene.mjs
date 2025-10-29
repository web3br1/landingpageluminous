#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🧹 Higiene Contínua - Waits Cegos + Test Smells\n');

const SMELL_CHECKS = [
  {
    name: 'waitForTimeout > 100ms',
    pattern: /waitForTimeout\(\s*[0-9]{3,}\s*\)/g,
    severity: 'warning',
    message: 'Waits cegos longos podem causar lentidão e flakiness'
  },
  {
    name: 'waitForTimeout sem justificativa',
    pattern: /waitForTimeout\([^)]*\)/g,
    severity: 'info',
    message: 'Considerar esperas orientadas a eventos'
  },
  {
    name: 'sleep ou delay hardcoded',
    pattern: /(?:sleep|delay|pause)\s*\(\s*[0-9]+/gi,
    severity: 'warning',
    message: 'Delays hardcoded indicam problemas de sincronização'
  },
  {
    name: 'expect sem timeout específico',
    pattern: /expect\([^)]*\)\.toBeVisible\(\)/g,
    severity: 'info',
    message: 'Considerar timeout específico para assertions visuais'
  },
  {
    name: 'Múltiplas screenshots no mesmo teste',
    pattern: /toHaveScreenshot/g,
    severity: 'warning',
    message: 'Múltiplas screenshots podem causar lentidão desnecessária'
  },
  {
    name: 'Test sem isolamento (setup/teardown)',
    pattern: /test\([^,]+,\s*\([^)]*\)\s*=>\s*{/g,
    severity: 'info',
    message: 'Considerar hooks de beforeEach/afterEach para isolamento'
  }
];

const results = {
  timestamp: new Date().toISOString(),
  checks: [],
  summary: {
    totalFiles: 0,
    filesWithSmells: 0,
    totalSmells: 0,
    criticalSmells: 0,
    warningSmells: 0,
    infoSmells: 0
  }
};

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const smells = [];

    SMELL_CHECKS.forEach(check => {
      const matches = content.match(check.pattern);
      if (matches) {
        smells.push({
          type: check.name,
          severity: check.severity,
          message: check.message,
          occurrences: matches.length,
          matches: matches.slice(0, 3) // Primeiras 3 ocorrências
        });
      }
    });

    return smells.length > 0 ? { file: filePath, smells } : null;
  } catch (error) {
    return null;
  }
}

function findTestFiles() {
  try {
    const output = execSync(
      'find . -name "*.spec.ts" -o -name "*.spec.tsx" -o -name "*.test.ts" -o -name "*.test.tsx" | grep -v node_modules | head -20',
      { encoding: 'utf8', cwd: process.cwd() }
    );
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

async function main() {
  console.log('🎯 Executando análise de higiene contínua...\n');

  const testFiles = findTestFiles();
  results.summary.totalFiles = testFiles.length;

  console.log(`📁 Analisando ${testFiles.length} arquivos de teste...`);

  for (const file of testFiles) {
    const analysis = analyzeFile(file);
    if (analysis) {
      results.checks.push(analysis);
      results.summary.filesWithSmells++;
      results.summary.totalSmells += analysis.smells.length;

      analysis.smells.forEach(smell => {
        if (smell.severity === 'warning') results.summary.warningSmells++;
        else if (smell.severity === 'info') results.summary.infoSmells++;
        else if (smell.severity === 'critical') results.summary.criticalSmells++;
      });
    }
  }

  // Salvar resultados
  const outputPath = path.join(process.cwd(), 'hygiene-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // Exibir relatório
  console.log('\n📊 RELATÓRIO DE HIGIENE\n');
  console.log('='.repeat(50));

  console.log(`📁 Arquivos analisados: ${results.summary.totalFiles}`);
  console.log(`⚠️  Arquivos com smells: ${results.summary.filesWithSmells}`);
  console.log(`🔍 Total de smells: ${results.summary.totalSmells}`);
  console.log(`🔴 Smells críticos: ${results.summary.criticalSmells}`);
  console.log(`🟡 Smells warning: ${results.summary.warningSmells}`);
  console.log(`ℹ️  Smells info: ${results.summary.infoSmells}`);

  console.log('\n🔍 Smells encontrados:');
  results.checks.slice(0, 10).forEach(check => {
    console.log(`\n📄 ${check.file}:`);
    check.smells.forEach(smell => {
      const icon = smell.severity === 'critical' ? '🔴' :
                   smell.severity === 'warning' ? '🟡' : 'ℹ️';
      console.log(`  ${icon} ${smell.type} (${smell.occurrences}x): ${smell.message}`);
      if (smell.matches.length > 0) {
        console.log(`    Ex: ${smell.matches[0]}`);
      }
    });
  });

  if (results.checks.length > 10) {
    console.log(`\n... e mais ${results.checks.length - 10} arquivos`);
  }

  console.log('\n🎯 Avaliação:');
  const hygieneScore = Math.max(0, 100 - (results.summary.totalSmells * 2));
  console.log(`Pontuação de higiene: ${hygieneScore}/100`);

  if (results.summary.criticalSmells === 0 && results.summary.warningSmells < 5) {
    console.log('✅ Higiene: BOA - Poucos issues encontrados');
  } else if (results.summary.criticalSmells > 0) {
    console.log('🔴 Higiene: CRÍTICA - Issues críticos encontrados');
  } else {
    console.log('🟡 Higiene: REGULAR - Melhorar alguns pontos');
  }

  // Recomendações
  console.log('\n💡 Recomendações:');
  if (results.summary.warningSmells > 0) {
    console.log('  - Substituir waitForTimeout por esperas orientadas a eventos');
  }
  if (results.summary.infoSmells > 0) {
    console.log('  - Adicionar timeouts específicos nas assertions');
  }
  if (results.summary.filesWithSmells > results.summary.totalFiles * 0.5) {
    console.log('  - Revisar estratégia geral de sincronização');
  }

  console.log(`\n📄 Relatório completo salvo em: ${outputPath}`);
}

main().catch(console.error);
