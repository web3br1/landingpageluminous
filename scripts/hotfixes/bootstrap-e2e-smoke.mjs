#!/usr/bin/env node

/**
 * Hotfix H5: E2E Smoke — Bootstrap
 * Garantir 1 spec smoke (abre '/', verifica <title>), alinhar testMatch no Playwright
 */

import fs from 'fs';
import path from 'path';

const e2eDir = path.join(process.cwd(), 'tests', 'e2e');
const smokeSpecPath = path.join(e2eDir, 'smoke.spec.ts');

console.log('🔧 Aplicando hotfix H5: e2e smoke bootstrap');

function createSmokeSpec() {
  const smokeSpec = `import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load homepage and display title', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if title exists (basic smoke test)
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(typeof title).toBe('string');
    expect(title.length).toBeGreaterThan(0);

    // Check if body has content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Allow some expected errors but not critical ones
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('manifest') &&
      !error.includes('preconnect')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
`;

  fs.writeFileSync(smokeSpecPath, smokeSpec);
  console.log('   ✅ Criado tests/e2e/smoke.spec.ts');
}

function updatePlaywrightConfig() {
  const configPath = path.join(process.cwd(), 'playwright.config.ts');

  if (!fs.existsSync(configPath)) {
    console.log('   ⚠️ playwright.config.ts não encontrado, pulando atualização');
    return;
  }

  let configContent = fs.readFileSync(configPath, 'utf8');

  // Garantir testMatch inclui smoke
  if (!configContent.includes('smoke.spec.ts')) {
    configContent = configContent.replace(
      /testMatch:.*?\[([^\]]*)\]/s,
      (match, patterns) => {
        const patternList = patterns.split(',').map(p => p.trim().replace(/['"]/g, ''));
        if (!patternList.includes('**/e2e/smoke.spec.ts')) {
          patternList.push('**/e2e/smoke.spec.ts');
        }
        return `testMatch: [\n    ${patternList.map(p => `'${p}'`).join(',\n    ')}\n  ]`;
      }
    );
  }

  fs.writeFileSync(configPath, configContent);
  console.log('   ✅ Atualizado playwright.config.ts com smoke spec');
}

function createE2ESetupIfNeeded() {
  const setupPath = path.join(e2eDir, 'setup.ts');

  if (!fs.existsSync(setupPath)) {
    const setupContent = `import { test as base } from '@playwright/test';

// Extend base test with common setup
export const test = base.extend({
  // Add common test setup here if needed
});

// Export expect for convenience
export { expect } from '@playwright/test';
`;

    fs.writeFileSync(setupPath, setupContent);
    console.log('   ✅ Criado tests/e2e/setup.ts');
  }
}

function main() {
  try {
    createSmokeSpec();
    updatePlaywrightConfig();
    createE2ESetupIfNeeded();

    console.log('✅ Hotfix H5 aplicado com sucesso');
    console.log('📝 Alterações:');
    console.log('   - Criado smoke spec básico');
    console.log('   - Atualizado playwright config para incluir smoke');
    console.log('   - Criado setup.ts se necessário');

  } catch (error) {
    console.error('❌ Erro ao aplicar hotfix H5:', error.message);
    process.exit(1);
  }
}

main();
