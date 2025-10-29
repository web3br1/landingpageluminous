#!/usr/bin/env node

/**
 * Script para corrigir testes que usam result.success incorretamente
 * Substitui por isOk(result) e result.value
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const testFile = path.resolve(__dirname, '../tests/lib/page-composition-service.test.ts');

console.log('🔧 Corrigindo testes Result em:', testFile);

// Ler arquivo
let content = fs.readFileSync(testFile, 'utf8');

// Correções sistemáticas
let changes = 0;

// 1. Substituir result.success por isOk(result)
content = content.replace(
  /expect\(result\.success\)\.toBe\(true\);/g,
  (match) => {
    changes++;
    return 'expect(isOk(result)).toBe(true);';
  }
);

// 2. Substituir unwrapResult(result) por result.value dentro de condições isOk
content = content.replace(
  /if \(isOk\(result\)\) \{\s*expect\((?:unwrapResult\(result\))\.(.+?)\)\.(.+?);/g,
  (match, property, assertion) => {
    changes++;
    return `if (isOk(result)) {\n        expect(result.value.${property}).${assertion};`;
  }
);

// 3. Substituir unwrapResult(result) direto por result.value
content = content.replace(
  /unwrapResult\(result\)/g,
  (match) => {
    changes++;
    return 'result.value';
  }
);

console.log(`✅ ${changes} correções aplicadas`);

// Salvar arquivo
fs.writeFileSync(testFile, content);

console.log('🎉 Arquivo corrigido com sucesso!');
console.log('💡 Execute: pnpm vitest run tests/lib/page-composition-service.test.ts');
