#!/usr/bin/env node

/**
 * LOTE 1: Correção de Variáveis Não Utilizadas (Versão Arquivo)
 * Lê do lint-output.txt gerado anteriormente
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('📦 LOTE 1: CORREÇÃO DE VARIÁVEIS (ARQUIVO)');
console.log('='.repeat(60));
console.log('🎯 Lendo do lint-output.txt');
console.log();

// Verificar se arquivo existe
const lintOutputPath = join(projectRoot, 'lint-output.txt');
if (!existsSync(lintOutputPath)) {
  console.log('❌ Arquivo lint-output.txt não encontrado!');
  console.log('💡 Execute primeiro: pnpm lint > lint-output.txt 2>&1');
  process.exit(1);
}

// Ler arquivo
const lintOutput = readFileSync(lintOutputPath, 'utf8');
const lines = lintOutput.split('\n');

// Filtrar erros de variáveis não utilizadas
const unusedVarLines = lines.filter(line =>
  (line.includes('no-unused-vars') || line.includes('@typescript-eslint/no-unused-vars')) &&
  !line.includes('Warning:') &&
  !line.includes('Reparsing') &&
  !line.includes('CategoryInfo')
);

console.log(`📊 Encontrados ${unusedVarLines.length} erros de variáveis não utilizadas`);

// Parsear erros (formato do ESLint: arquivo + linha + erro)
const errors = [];
let currentFile = '';

for (const line of lines) {
  // Detectar arquivo
  if (line.startsWith('C:\\') && (line.endsWith('.ts') || line.endsWith('.tsx') || line.endsWith('.js') || line.endsWith('.jsx'))) {
    currentFile = line.replace(projectRoot + '\\', '').replace(/\\/g, '/');
    continue;
  }

  // Detectar erro de variável não utilizada
  if (currentFile && (line.includes('no-unused-vars') || line.includes('@typescript-eslint/no-unused-vars'))) {
    // Formato: linha:coluna error 'variavel' is defined but never used no-unused-vars
    const match = line.match(/^\s*(\d+):(\d+)\s+error\s+'([^']+)'\s+is\s+(?:assigned\s+a\s+value\s+but\s+)?never\s+used/);
    if (match) {
      const [, lineNum, col, variable] = match;
      errors.push({
        file: currentFile,
        line: parseInt(lineNum) - 1, // 0-based
        variable,
        fullLine: line.trim()
      });
    }
  }
}

console.log(`✅ Parseados ${errors.length} erros válidos`);

// Mostrar distribuição por arquivo
const byFile = errors.reduce((acc, error) => {
  acc[error.file] = (acc[error.file] || 0) + 1;
  return acc;
}, {});

console.log('\n📁 Distribuição por arquivo (top 10):');
Object.entries(byFile)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .forEach(([file, count]) => {
    console.log(`   ${file}: ${count} erros`);
  });

// Aplicar correções
console.log('\n🔧 Aplicando correções...');

let totalFixed = 0;
const processedFiles = new Set();

for (const error of errors) {
  const fullPath = join(projectRoot, error.file);

  if (!existsSync(fullPath)) {
    console.log(`⚠️ Arquivo não encontrado: ${error.file}`);
    continue;
  }

  try {
    let content = readFileSync(fullPath, 'utf8');
    const fileLines = content.split('\n');

    if (error.line >= fileLines.length) continue;

    const line = fileLines[error.line];

    // Pular se já prefixado
    if (line.includes(`_${error.variable}`)) continue;

    // Aplicar correção segura (apenas variáveis em contextos seguros)
    const safePatterns = [
      // Parâmetros de função
      new RegExp(`\\bfunction\\s+\\w+\\([^)]*\\b${error.variable}\\b[^)]*\\)`, 'g'),
      // Arrow functions
      new RegExp(`\\([^)]*\\b${error.variable}\\b[^)]*\\)\\s*=>`, 'g'),
      // Declaradores
      new RegExp(`\\b(let|const|var)\\s+${error.variable}\\b\\s*=`, 'g'),
      // Destructuring
      new RegExp(`([{\\[]\\s*)${error.variable}(\\s*[}\\]])`, 'g'),
    ];

    let corrected = false;
    for (const pattern of safePatterns) {
      if (pattern.test(line)) {
        const newLine = line.replace(
          new RegExp(`\\b${error.variable}\\b`, 'g'),
          `_${error.variable}`
        );

        if (newLine !== line) {
          fileLines[error.line] = newLine;
          corrected = true;
          totalFixed++;
          break;
        }
      }
    }

    if (corrected) {
      writeFileSync(fullPath, fileLines.join('\n'), 'utf8');
      processedFiles.add(error.file);
    }

  } catch (err) {
    console.log(`❌ Erro ao processar ${error.file}: ${err.message}`);
  }
}

console.log(`\n🎉 CORREÇÕES APLICADAS:`);
console.log(`   📝 Variáveis corrigidas: ${totalFixed}`);
console.log(`   📁 Arquivos modificados: ${processedFiles.size}`);

if (totalFixed > 0) {
  console.log('\n✅ LOTE 1 CONCLUÍDO!');
  console.log('💡 Execute "pnpm lint" para verificar redução de erros');
  console.log('🔄 Próximo: Lote 2 (imports não utilizados)');
} else {
  console.log('\n⚠️ Nenhuma correção automática aplicada');
  console.log('💡 Pode ser necessário correção manual para alguns padrões');
}
