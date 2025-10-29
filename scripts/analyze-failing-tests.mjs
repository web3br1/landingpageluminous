#!/usr/bin/env node

/**
 * Script para analisar especificamente os testes falhando
 * Parte da Fase 2: Correção de Testes Restantes
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 Analisando testes falhando...\n');

// Executar testes e capturar saída
try {
  const output = execSync('pnpm vitest run 2>&1', {
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '..'),
    maxBuffer: 1024 * 1024 * 10,
    stdio: 'pipe'
  });

  console.log('✅ Análise de testes executada');

  // Analisar saída para encontrar testes falhando
  const lines = output.split('\n');
  const failingTests = [];
  let currentTest = null;

  for (const line of lines) {
    // Detectar início de teste falhando
    if (line.includes('FAIL') && line.includes('.test.')) {
      if (currentTest) failingTests.push(currentTest);
      currentTest = {
        file: line.trim().replace('FAIL ', ''),
        errors: []
      };
    }
    // Capturar mensagens de erro
    else if (currentTest && (line.includes('Error:') || line.includes('TypeError:') || line.includes('ReferenceError:'))) {
      currentTest.errors.push(line.trim());
    }
    // Detectar fim de teste
    else if (currentTest && (line.includes('✓') || line.includes('✗') || line.trim() === '')) {
      // Finalizar teste atual se encontramos outro
      if (line.includes('FAIL') && currentTest) {
        failingTests.push(currentTest);
        currentTest = null;
      }
    }
  }

  if (currentTest) failingTests.push(currentTest);

  // Filtrar apenas testes realmente falhando
  const uniqueFailing = failingTests.filter(test => test.errors.length > 0);

  console.log(`\n🚨 Encontrados ${uniqueFailing.length} testes falhando:\n`);

  uniqueFailing.forEach((test, index) => {
    console.log(`${index + 1}. ${test.file}`);
    test.errors.slice(0, 2).forEach(error => {
      console.log(`   ❌ ${error}`);
    });
    if (test.errors.length > 2) {
      console.log(`   ... e mais ${test.errors.length - 2} erros`);
    }
    console.log('');
  });

  // Categorizar tipos de falha
  const categories = {
    import: uniqueFailing.filter(t => t.errors.some(e => e.includes('import') || e.includes('resolve') || e.includes('Cannot find'))).length,
    type: uniqueFailing.filter(t => t.errors.some(e => e.includes('TypeError') || e.includes('Property') || e.includes('does not exist'))).length,
    runtime: uniqueFailing.filter(t => t.errors.some(e => e.includes('Runtime') || e.includes('assertion') || e.includes('expected'))).length,
    other: 0
  };
  categories.other = uniqueFailing.length - categories.import - categories.type - categories.runtime;

  console.log('📊 Categorização dos erros:');
  console.log(`   🔸 Imports/Dependencies: ${categories.import}`);
  console.log(`   🔸 TypeScript/Type errors: ${categories.type}`);
  console.log(`   🔸 Runtime/Assertions: ${categories.runtime}`);
  console.log(`   🔸 Outros: ${categories.other}`);

  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    totalFailing: uniqueFailing.length,
    categories,
    failingTests: uniqueFailing.map(t => ({
      file: t.file,
      errorCount: t.errors.length,
      primaryError: t.errors[0]
    }))
  };

  const reportPath = path.resolve(__dirname, '../qa-baseline/failing-tests-analysis.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n📄 Relatório salvo em: ${reportPath}`);

  // Recomendações
  console.log('\n🎯 PRÓXIMOS PASSOS RECOMENDADOS:');
  if (categories.import > 0) {
    console.log('   1. Priorizar correção de imports @shared/* e dependências');
  }
  if (categories.type > 0) {
    console.log('   2. Corrigir erros de TypeScript e propriedades inexistentes');
  }
  if (categories.runtime > 0) {
    console.log('   3. Revisar assertions e lógica de testes');
  }

} catch (error) {
  console.error('❌ Erro ao executar análise:', error.message);

  // Mesmo com erro, tentar extrair informações úteis
  if (error.stdout) {
    const lines = error.stdout.split('\n');
    const failLines = lines.filter(l => l.includes('FAIL') || l.includes('failed'));

    if (failLines.length > 0) {
      console.log('\n📋 Testes que falharam (parcial):');
      failLines.slice(0, 10).forEach(line => console.log(`   ${line.trim()}`));
    }
  }
}

console.log('\n✨ Análise completa!');
