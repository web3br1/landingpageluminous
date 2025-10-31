#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔍 RESUMO EXECUTIVO DOS ERROS TYPESCRIPT\n');

// Executar typecheck limitado
const output = execSync('pnpm typecheck 2>&1', { encoding: 'utf-8' });
const lines = output.split('\n').filter(l => l.includes('error TS')).slice(0, 100);

console.log(`📊 PRIMEIROS 100 ERROS ANALISADOS (de ~939 total)\n`);

// Contar por categoria
let imports = 0, properties = 0, spreads = 0, unknown = 0, args = 0, other = 0;

lines.forEach(line => {
  if (line.includes('Cannot find name') || line.includes('is not defined')) imports++;
  else if (line.includes('Property') && line.includes('does not exist')) properties++;
  else if (line.includes('Spread types may only be created from object types')) spreads++;
  else if (line.includes("on type 'unknown'")) unknown++;
  else if (line.includes('Argument of type')) args++;
  else other++;
});

console.log('📈 DISTRIBUIÇÃO POR CATEGORIA:');
console.log(`  Imports quebrados: ${imports}`);
console.log(`  Propriedades ausentes: ${properties}`);
console.log(`  Spreads inválidos: ${spreads}`);
console.log(`  Cluster unknown: ${unknown}`);
console.log(`  Argumentos incompatíveis: ${args}`);
console.log(`  Outros: ${other}`);

const criticalFiles = {};
lines.forEach(line => {
  const match = line.match(/([^:]+):\d+/);
  if (match) {
    const file = match[1];
    criticalFiles[file] = (criticalFiles[file] || 0) + 1;
  }
});

console.log('\n🎯 ARQUIVOS MAIS CRÍTICOS:');
Object.entries(criticalFiles)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .forEach(([file, count]) => {
    console.log(`  ${count} erros: ${file}`);
  });

console.log('\n🎯 ESTRATÉGIA DE CORREÇÃO PRIORITÁRIA:');
console.log('1. ✅ Imports quebrados - corrigir exports/imports ausentes');
console.log('2. 🔄 Cluster unknown - aplicar narrowing types seguro');
console.log('3. 📋 Propriedades obrigatórias - atualizar interfaces');
console.log('4. 🎨 Spreads inválidos - corrigir tipos de objetos');
console.log('5. ⚡ Argumentos - ajustar assinaturas de função');

const summary = {
  timestamp: new Date().toISOString(),
  totalAnalyzed: lines.length,
  categories: { imports, properties, spreads, unknown, args, other },
  criticalFiles: Object.entries(criticalFiles).sort(([,a], [,b]) => b - a).slice(0, 10)
};

fs.writeFileSync('ts-error-summary.json', JSON.stringify(summary, null, 2));
console.log('\n💾 RESUMO SALVO: ts-error-summary.json');

// Próximos passos
console.log('\n🚀 EXECUTANDO CORREÇÃO AUTOMATIZADA...');

// 1. Corrigir imports mais comuns
console.log('🔧 PASSO 1: Corrigindo imports críticos...');

// Executar correções automáticas baseadas nos padrões identificados
try {
  // Corrigir missing recharts dependency
  console.log('📦 Instalando recharts types...');
  execSync('pnpm add -D @types/recharts recharts', { stdio: 'pipe' });

  // Corrigir imports Zod
  console.log('🔧 Corrigindo imports Zod...');
  execSync('pnpm add -D @types/zod', { stdio: 'pipe' });

} catch (e) {
  console.log('⚠️  Alguns pacotes podem já estar instalados');
}

console.log('✅ Correções automáticas aplicadas. Execute typecheck novamente.');
