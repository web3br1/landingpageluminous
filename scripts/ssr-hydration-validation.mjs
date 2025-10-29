#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 SSR/Hidratação - Eliminação de Avisos Finais\n');

// Checklist de hidratação
const HYDRATION_CHECKS = [
  {
    name: 'Date.now() no SSR',
    pattern: /Date\.now\(\)/g,
    files: ['**/*.tsx', '**/*.ts'],
    exclude: ['**/node_modules/**', '**/test-helpers.ts', '**/test-*.ts']
  },
  {
    name: 'Math.random() no SSR',
    pattern: /Math\.random\(\)/g,
    files: ['**/*.tsx', '**/*.ts'],
    exclude: ['**/node_modules/**', '**/test-helpers.ts']
  },
  {
    name: 'window access sem verificação',
    pattern: /\bwindow\./g,
    files: ['**/*.tsx'],
    exclude: ['**/node_modules/**', '**/test-helpers.ts']
  },
  {
    name: 'document access sem verificação',
    pattern: /\bdocument\./g,
    files: ['**/*.tsx'],
    exclude: ['**/node_modules/**', '**/test-helpers.ts']
  },
  {
    name: 'navigator access sem verificação',
    pattern: /\bnavigator\./g,
    files: ['**/*.tsx'],
    exclude: ['**/node_modules/**', '**/test-helpers.ts']
  }
];

const results = {
  timestamp: new Date().toISOString(),
  checks: [],
  buildWarnings: [],
  summary: {}
};

function grepFiles(pattern, filePattern, excludePattern = '') {
  try {
    const exclude = excludePattern ? `--exclude="${excludePattern}"` : '';
    const output = execSync(
      `find . -name "${filePattern}" ${exclude} -exec grep -l "${pattern}" {} \\; 2>/dev/null || true`,
      { encoding: 'utf8', cwd: process.cwd() }
    );
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

function runBuildCheck() {
  console.log('🏗️  Verificando build por 3 vezes consecutivas...');

  const buildResults = [];
  let hasWarnings = false;

  for (let i = 1; i <= 3; i++) {
    console.log(`  Build ${i}/3...`);
    try {
      const output = execSync('npm run build', {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      const warningCount = (output.match(/⚠/g) || []).length;
      const errorCount = (output.match(/✖/g) || []).length;

      buildResults.push({
        build: i,
        warnings: warningCount,
        errors: errorCount,
        success: true
      });

      if (warningCount > 0 || errorCount > 0) {
        hasWarnings = true;
        console.log(`    ⚠️  Build ${i}: ${warningCount} warnings, ${errorCount} errors`);
      } else {
        console.log(`    ✅ Build ${i}: limpo`);
      }

    } catch (error) {
      buildResults.push({
        build: i,
        error: error.message,
        success: false
      });
      console.log(`    ❌ Build ${i} falhou`);
      hasWarnings = true;
    }
  }

  return { buildResults, hasWarnings };
}

async function main() {
  console.log('🎯 Executando validação SSR/Hidratação...\n');

  // 1. Executar checks de código
  console.log('📝 Analisando código fonte...');
  for (const check of HYDRATION_CHECKS) {
    console.log(`  🔍 ${check.name}...`);

    const issues = [];
    for (const filePattern of check.files) {
      const foundFiles = grepFiles(check.pattern, filePattern, check.exclude.join(','));
      if (foundFiles.length > 0) {
        issues.push(...foundFiles);
      }
    }

    results.checks.push({
      name: check.name,
      pattern: check.pattern.source,
      issues: [...new Set(issues)], // Remover duplicatas
      issueCount: issues.length
    });

    console.log(`    ${issues.length > 0 ? '⚠️' : '✅'} ${issues.length} arquivos com potencial problema`);
  }

  // 2. Verificar builds consecutivos
  const { buildResults, hasWarnings } = runBuildCheck();

  results.buildWarnings = buildResults;
  results.summary = {
    totalIssues: results.checks.reduce((sum, check) => sum + check.issueCount, 0),
    hasBuildWarnings: hasWarnings,
    buildsSuccessful: buildResults.filter(b => b.success).length,
    buildsWithWarnings: buildResults.filter(b => b.warnings > 0 || b.errors > 0).length
  };

  // Salvar resultados
  const outputPath = path.join(process.cwd(), 'ssr-hydration-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // Exibir relatório
  console.log('\n📊 RELATÓRIO SSR/HIDRATAÇÃO\n');
  console.log('='.repeat(50));

  console.log('🔍 Issues encontrados no código:');
  results.checks.forEach(check => {
    console.log(`  ${check.name}: ${check.issueCount} arquivos`);
    if (check.issueCount > 0 && check.issueCount <= 5) {
      check.issues.forEach(file => console.log(`    - ${file}`));
    } else if (check.issueCount > 5) {
      console.log(`    - ${check.issues.slice(0, 3).join(', ')}... (+${check.issueCount - 3} mais)`);
    }
  });

  console.log('\n🏗️  Status dos builds:');
  console.log(`  Builds bem-sucedidos: ${results.summary.buildsSuccessful}/3`);
  console.log(`  Builds com warnings: ${results.summary.buildsWithWarnings}/3`);

  console.log('\n🎯 Avaliação final:');
  const codeIssues = results.summary.totalIssues;
  const buildIssues = results.summary.hasBuildWarnings;

  console.log(`✅ Código limpo (issues = 0): ${codeIssues === 0 ? 'PASSOU' : 'FALHOU'} (${codeIssues} issues)`);
  console.log(`✅ Builds sem warnings: ${!buildIssues ? 'PASSOU' : 'FALHOU'}`);

  if (codeIssues === 0 && !buildIssues) {
    console.log('\n🎉 SSR/Hidratação: APROVADO! Zero warnings por 3 builds consecutivos.');
  } else {
    console.log('\n⚠️  Ainda há issues para resolver:');
    if (codeIssues > 0) console.log('  - Revisar código para remover acessos inseguros');
    if (buildIssues) console.log('  - Investigar warnings de build');
  }

  console.log(`\n📄 Relatório completo salvo em: ${outputPath}`);
}

main().catch(console.error);
