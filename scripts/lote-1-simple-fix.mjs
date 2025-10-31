#!/usr/bin/env node

/**
 * LOTE 1 SIMPLIFICADO: Correção Básica de Variáveis Não Utilizadas
 * Versão direta que funciona com Windows/PowerShell
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔧 LOTE 1 SIMPLIFICADO');
console.log('='.repeat(50));
console.log('🎯 Correção direta de variáveis não utilizadas');
console.log();

// Usar abordagem direta - executar lint e processar output
try {
  console.log('📊 Obtendo erros de lint...');

  // Executar lint e capturar saída
  const lintCmd = 'pnpm lint';
  let lintOutput = '';

  try {
    lintOutput = execSync(lintCmd, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 60000
    });
  } catch (error) {
    // Capturar stderr quando há erros
    lintOutput = error.stderr?.toString() || '';
  }

  if (!lintOutput) {
    console.log('❌ Nenhum output do lint obtido');
    process.exit(1);
  }

  // Filtrar apenas linhas com no-unused-vars
  const unusedLines = lintOutput
    .split('\n')
    .filter(line => line.includes('no-unused-vars') || line.includes('@typescript-eslint/no-unused-vars'))
    .slice(0, 20); // Limitar para debug

  console.log(`📝 Encontradas ${unusedLines.length} linhas com erros de variáveis não utilizadas`);

  if (unusedLines.length === 0) {
    console.log('🎉 Nenhuma variável não utilizada encontrada!');
    process.exit(0);
  }

  // Mostrar primeiras linhas para debug
  console.log('\n📋 Exemplos de erros:');
  unusedLines.slice(0, 5).forEach((line, i) => {
    console.log(`   ${i + 1}. ${line.trim()}`);
  });

  console.log('\n⚠️ CORREÇÃO MANUAL NECESSÁRIA');
  console.log('💡 Execute: pnpm lint:fix');
  console.log('💡 Ou corrija manualmente as variáveis não utilizadas');

} catch (error) {
  console.log('❌ Erro na execução:', error.message);
  process.exit(1);
}
