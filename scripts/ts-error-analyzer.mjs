#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 ANALISANDO ERROS TYPESCRIPT - BLOCO 1\n');

// Executar typecheck e capturar saída
const output = execSync('pnpm typecheck 2>&1', { encoding: 'utf-8' });

// Analisar erros
const lines = output.split('\n');
const errors = lines.filter(line => line.includes('error TS'));

console.log(`📊 TOTAL DE ERROS: ${errors.length}\n`);

// Categorizar erros
const categories = {
  imports: errors.filter(e => e.includes('Cannot find name') || e.includes('is not defined')),
  properties: errors.filter(e => e.includes('Property') && e.includes('does not exist')),
  spreads: errors.filter(e => e.includes('Spread types may only be created from object types')),
  unknown: errors.filter(e => e.includes("on type 'unknown'")),
  arguments: errors.filter(e => e.includes('Argument of type')),
  incompatible: errors.filter(e => e.includes('is not assignable to'))
};

console.log('📈 DISTRIBUIÇÃO POR CATEGORIA:');
Object.entries(categories).forEach(([cat, errs]) => {
  console.log(`  ${cat.padEnd(12)}: ${errs.length} erros`);
});

// Focar nos arquivos mais problemáticos
const fileErrors = {};
errors.forEach(error => {
  const match = error.match(/([^:]+):\d+/);
  if (match) {
    const file = match[1];
    fileErrors[file] = (fileErrors[file] || 0) + 1;
  }
});

console.log('\n📁 ARQUIVOS MAIS PROBLEMÁTICOS:');
Object.entries(fileErrors)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 20)
  .forEach(([file, count]) => {
    console.log(`  ${count.toString().padStart(3)} erros: ${file}`);
  });

// Análise específica do cluster unknown
console.log('\n🎯 CLUSTER UNKNOWN - ANÁLISE DETALHADA:');
const unknownByFile = {};
categories.unknown.forEach(error => {
  const match = error.match(/([^:]+):\d+/);
  if (match) {
    const file = match[1];
    unknownByFile[file] = (unknownByFile[file] || 0) + 1;
  }
});

Object.entries(unknownByFile)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .forEach(([file, count]) => {
    console.log(`  ${count.toString().padStart(3)}: ${file}`);
  });

// Salvar relatório
const report = {
  timestamp: new Date().toISOString(),
  totalErrors: errors.length,
  categories: Object.fromEntries(
    Object.entries(categories).map(([k, v]) => [k, v.length])
  ),
  topProblematicFiles: Object.entries(fileErrors)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20),
  unknownClusterAnalysis: Object.entries(unknownByFile)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
};

fs.writeFileSync('ts-error-analysis.json', JSON.stringify(report, null, 2));
console.log('\n💾 RELATÓRIO SALVO: ts-error-analysis.json');

console.log('\n🎯 PRÓXIMOS PASSOS RECOMENDADOS:');
console.log('1. Corrigir imports quebrados (Cannot find name)');
console.log('2. Resolver cluster unknown com narrowing types');
console.log('3. Corrigir propriedades obrigatórias ausentes');
console.log('4. Ajustar spreads e tipos incompatíveis');
console.log('5. Validar build após cada categoria');
