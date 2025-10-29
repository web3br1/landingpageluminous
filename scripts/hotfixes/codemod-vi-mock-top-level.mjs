#!/usr/bin/env node

/**
 * Hotfix H3: Vitest Mocks — Hoisting & Factories
 * Padronizar vi.mock em top-level + factories; remover restaurações custom
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const utilsTestPattern = 'tests/**/*utils*.test.ts';

console.log('🔧 Aplicando hotfix H3: vitest mocks hoisting & factories');

async function findUtilsTestFiles() {
  return await glob(utilsTestPattern, {
    cwd: process.cwd(),
    absolute: false,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });
}

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  // 1. Mover vi.mock para top-level (após imports)
  const mockMatches = content.match(/vi\.mock\([^;]+\);/g);
  if (mockMatches) {
    // Remove mocks do corpo das funções
    content = content.replace(/^\s*vi\.mock\([^;]+\);\s*$/gm, '');

    // Adiciona no topo após imports
    const importEndMatch = content.match(/(import.*from.*;\n)\n/);
    if (importEndMatch) {
      const importsEnd = importEndMatch.index + importEndMatch[0].length;
      const topLevelMocks = mockMatches.map(mock => `// Top-level mock\n${mock}`).join('\n');
      content = content.slice(0, importsEnd) + topLevelMocks + '\n\n' + content.slice(importsEnd);
      changed = true;
    }
  }

  // 2. Padronizar factories
  content = content.replace(
    /vi\.mock\('([^']+)'\)/g,
    "vi.mock('$1', () => ({}))"
  );

  // 3. Remover restaurações custom (deixar vi.mock gerenciar)
  content = content.replace(/vi\.restoreAllMocks\(\);?\s*$/gm, '');
  content = content.replace(/vi\.resetAllMocks\(\);?\s*$/gm, '');

  if (changed) {
    fs.writeFileSync(fullPath, content);
    console.log(`   ✅ ${filePath}`);
  }

  return changed;
}

async function main() {
  try {
    const files = await findUtilsTestFiles();
    console.log(`📁 Encontrados ${files.length} arquivos de teste utils`);

    let changedCount = 0;
    for (const file of files) {
      if (processFile(file)) {
        changedCount++;
      }
    }

    console.log(`✅ Hotfix H3 aplicado: ${changedCount} arquivos modificados`);
    console.log('📝 Alterações:');
    console.log('   - vi.mock movidos para top-level');
    console.log('   - Padronizadas factories vazias');
    console.log('   - Removidas restaurações manuais');

  } catch (error) {
    console.error('❌ Erro ao aplicar hotfix H3:', error.message);
    process.exit(1);
  }
}

main();
