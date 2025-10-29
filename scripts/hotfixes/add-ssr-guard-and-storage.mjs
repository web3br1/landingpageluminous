#!/usr/bin/env node

/**
 * Hotfix H4: SSR Safety — Guard & Storage em Memória
 * Criar guard SSR e storage em memória; aplicar em testes que tocam window/navigator
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const targetDir = path.join(process.cwd(), 'tests', '__shared__');

console.log('🔧 Aplicando hotfix H4: SSR safety guard & memory storage');

async function createMemoryStorage() {
  const storagePath = path.join(targetDir, 'mocks', 'browser-storage.ts');

  const storageContent = `/**
 * Memory-based Storage Implementation for Tests
 * SSR-safe storage that doesn't depend on browser APIs
 */

export class MemoryStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

// Singleton instances for testing
export const memoryLocalStorage = new MemoryStorage();
export const memorySessionStorage = new MemoryStorage();

`;

  // Garantir que o diretório existe
  const mocksDir = path.dirname(storagePath);
  if (!fs.existsSync(mocksDir)) {
    fs.mkdirSync(mocksDir, { recursive: true });
  }

  fs.writeFileSync(storagePath, storageContent);
  console.log('   ✅ Criado tests/__shared__/mocks/browser-storage.ts');
}

function updateSSRSafety() {
  const ssrSafetyPath = path.join(targetDir, 'ssr-safety.ts');
  let content = fs.readFileSync(ssrSafetyPath, 'utf8');

  // Adicionar import do memory storage
  if (!content.includes('browser-storage')) {
    content = content.replace(
      /(import.*from.*;\n)\n/,
      `$1import { memoryLocalStorage, memorySessionStorage } from './mocks/browser-storage';\n\n`
    );
  }

  // Atualizar safeLocalStorageAccess para usar memory storage
  content = content.replace(
    /safeLocalStorageAccess<T>\(\s*callback: \(storage: Storage\) => T,\s*fallback: T\s*\): T \{\s*return safeBrowserAccess\(\(\) => \{\s*if \(!window\.localStorage\) \{\s*return fallback;\s*\}\s*return callback\(window\.localStorage\);\s*\}, fallback\);\s*\}/,
    `safeLocalStorageAccess<T>(
  callback: (storage: Storage) => T,
  fallback: T
): T {
  return safeBrowserAccess(() => {
    if (!window.localStorage) {
      // Use memory storage in SSR/test environments
      return callback(memoryLocalStorage);
    }
    return callback(window.localStorage);
  }, fallback);
}`
  );

  // Atualizar safeSessionStorageAccess para usar memory storage
  content = content.replace(
    /safeSessionStorageAccess<T>\(\s*callback: \(storage: Storage\) => T,\s*fallback: T\s*\): T \{\s*return safeBrowserAccess\(\(\) => \{\s*if \(!window\.sessionStorage\) \{\s*return fallback;\s*\}\s*return callback\(window\.sessionStorage\);\s*\}, fallback\);\s*\}/,
    `safeSessionStorageAccess<T>(
  callback: (storage: Storage) => T,
  fallback: T
): T {
  return safeBrowserAccess(() => {
    if (!window.sessionStorage) {
      // Use memory storage in SSR/test environments
      return callback(memorySessionStorage);
    }
    return callback(window.sessionStorage);
  }, fallback);
}`
  );

  fs.writeFileSync(ssrSafetyPath, content);
  console.log('   ✅ Atualizado tests/__shared__/ssr-safety.ts');
}

async function findTestsWithBrowserAPIs() {
  const patterns = [
    'tests/**/*test.ts',
    'tests/**/*test.tsx',
    'tests/**/*spec.ts',
    'tests/**/*spec.tsx'
  ];

  const allFiles = [];
  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: process.cwd(),
      absolute: false,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });
    allFiles.push(...files);
  }

  return [...new Set(allFiles)].filter(file => {
    const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
    return /window\.|navigator\.|document\.|localStorage\.|sessionStorage\./.test(content);
  });
}

async function applySSRGuardToTests() {
  const testFiles = await findTestsWithBrowserAPIs();

  for (const file of testFiles) {
    const fullPath = path.join(process.cwd(), file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Adicionar import se não existir
    if (!content.includes('ssr-safety')) {
      const importStatement = `import { safeBrowserAccess, safeLocalStorageAccess, safeSessionStorageAccess } from '../../__shared__/ssr-safety';\n`;
      const firstImport = content.match(/(import.*from.*;\n)/);
      if (firstImport) {
        content = content.replace(firstImport[0], firstImport[0] + importStatement);
      }
    }

    // Aplicar guards em acessos diretos
    content = content.replace(
      /window\.(\w+)/g,
      'safeBrowserAccess(() => window.$1, undefined)'
    );

    content = content.replace(
      /navigator\.(\w+)/g,
      'safeBrowserAccess(() => navigator.$1, undefined)'
    );

    content = content.replace(
      /document\.(\w+)/g,
      'safeBrowserAccess(() => document.$1, undefined)'
    );

    content = content.replace(
      /localStorage\.(\w+)\(/g,
      'safeLocalStorageAccess(storage => storage.$1('
    );

    content = content.replace(
      /sessionStorage\.(\w+)\(/g,
      'safeSessionStorageAccess(storage => storage.$1('
    );

    fs.writeFileSync(fullPath, content);
    console.log(`   ✅ Aplicado SSR guard em ${file}`);
  }
}

async function main() {
  try {
    await createMemoryStorage();
    updateSSRSafety();
    await applySSRGuardToTests();

    console.log('✅ Hotfix H4 aplicado com sucesso');
    console.log('📝 Alterações:');
    console.log('   - Criado memory storage para testes SSR-safe');
    console.log('   - Atualizado ssr-safety.ts com fallbacks para memory storage');
    console.log('   - Aplicados guards SSR em testes que usam browser APIs');

  } catch (error) {
    console.error('❌ Erro ao aplicar hotfix H4:', error.message);
    process.exit(1);
  }
}

main();
