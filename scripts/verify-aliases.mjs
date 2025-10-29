#!/usr/bin/env node

/**
 * Script de Verificação Automática de Aliases
 * Test sentinel + fallback de log para garantir que aliases @shared funcionem
 * Parte da Fase 2: Correção Sistemática de Testes
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 Verificando aliases @shared...\n');

// Criar arquivo de teste sentinela se não existir
const sentinelPath = path.resolve(__dirname, '../tests/__sentinel__/alias-verification.test.ts');
const sentinelDir = path.dirname(sentinelPath);

if (!fs.existsSync(sentinelDir)) {
  fs.mkdirSync(sentinelDir, { recursive: true });
}

const sentinelContent = `// Test Sentinel - Verificação automática de aliases @shared
// Este arquivo garante que aliases funcionem em todas as pastas de teste
// Se falhar, indica problema de configuração no vitest.config.ts

import { describe, it, expect } from 'vitest';
import { Result, isOk } from '@shared/core';
import { AppError } from '@shared/errors';

describe('Alias Verification Sentinel', () => {
  it('should resolve @shared/core imports', () => {
    expect(Result).toBeDefined();
    expect(isOk).toBeDefined();

    const result = Result.ok('test');
    expect(isOk(result)).toBe(true);
  });

  it('should resolve @shared/errors imports', () => {
    expect(AppError).toBeDefined();
  });

  it('should handle Result operations', () => {
    const ok = Result.ok('success');
    const err = Result.err('error');

    expect(isOk(ok)).toBe(true);
    expect(isOk(err)).toBe(false);
  });
});
`;

fs.writeFileSync(sentinelPath, sentinelContent);
console.log('✅ Arquivo sentinela criado em:', sentinelPath);

try {
  // Executar teste sentinela
  console.log('\n🧪 Executando teste sentinela...');
  const result = execSync(`cd "${path.resolve(__dirname, '..')}" && pnpm vitest run ${sentinelPath} --reporter=json`, {
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 30000
  });

  const testResults = JSON.parse(result);

  if (testResults.numFailedTests === 0 && testResults.numPassedTests > 0) {
    console.log('✅ SUCESSO: Todos os aliases @shared estão funcionando!');
    console.log(`   📊 ${testResults.numPassedTests} testes sentinel passaram`);
  } else {
    console.log('❌ FALHA: Problemas nos aliases @shared');
    console.log(`   📊 ${testResults.numFailedTests} testes falharam`);
    process.exit(1);
  }

} catch (error) {
  console.log('❌ ERRO: Teste sentinela falhou');
  console.log('Detalhes:', error.message);

  if (error.stdout) {
    console.log('\nSaída do teste:');
    console.log(error.stdout);
  }

  console.log('\n🔧 POSSÍVEIS CAUSAS:');
  console.log('   • Alias @shared não configurado no vitest.config.ts');
  console.log('   • Caminho incorreto para pasta shared');
  console.log('   • Arquivos de índice não exportando corretamente');

  process.exit(1);
}

// Verificar configuração atual do vitest
console.log('\n🔧 Verificando configuração atual...');

try {
  const vitestConfig = fs.readFileSync(path.resolve(__dirname, '../vitest.config.ts'), 'utf8');
  const sharedMatches = vitestConfig.match(/"@shared[^"]*":\s*path\.resolve\(__dirname,\s*["'][^"']*["']\)/g);

  if (sharedMatches && sharedMatches.length > 0) {
    console.log('✅ Configuração de alias @shared encontrada:');
    sharedMatches.forEach(match => console.log(`   ${match}`));
  } else {
    console.log('⚠️  Nenhum alias @shared encontrado na configuração');
  }

} catch (error) {
  console.log('⚠️  Não foi possível verificar configuração do vitest');
}

console.log('\n🎉 Verificação de aliases completa!');
console.log('💡 Dica: Execute este script após mudanças no vitest.config.ts');
