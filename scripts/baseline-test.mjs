#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Baseline Test - Chromium Headless, 1 Worker, No Throttling\n');

// Configuração de baseline otimizada
const baselineConfig = {
  testDir: 'tests',
  testMatch: ['**/hydration.test.ts', '**/ssr.test.ts'],
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    bypassCSP: true,
    launchOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
  },
  // webServer removido - iniciar manualmente
  workers: 1,
  retries: 0,
  reporter: [['line'], ['json', { outputFile: 'baseline-results.json' }]],
  expect: {
    timeout: 10000
  },
  // Override baseURL for this test run - usar porta 3002 para evitar conflitos
  baseURL: 'http://localhost:3002',
  outputDir: 'test-results-baseline'
};

// Criar config temporário
fs.writeFileSync('playwright.baseline.config.ts',
  `import { defineConfig, devices } from '@playwright/test';\n\nexport default defineConfig(${JSON.stringify(baselineConfig, null, 2)});`
);

try {
  console.log('🚀 Iniciando servidor Next.js na porta 3002...');
  const serverProcess = execSync('set PORT=3002 && npm run dev', {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: true
  });

  // Aguardar servidor iniciar
  console.log('⏳ Aguardando servidor ficar pronto...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('📊 Executando baseline...');
  const startTime = Date.now();

  execSync('npx playwright test --config=playwright.baseline.config.ts', {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  const duration = Date.now() - startTime;
  console.log(`\n✅ Baseline concluído em ${(duration / 1000).toFixed(1)}s`);

  // Ler resultados
  if (fs.existsSync('baseline-results.json')) {
    const results = JSON.parse(fs.readFileSync('baseline-results.json', 'utf8'));
    console.log('\n📈 Métricas por arquivo:');
    results.suites?.forEach(suite => {
      suite.specs?.forEach(spec => {
        const duration = spec.tests?.[0]?.results?.[0]?.duration || 0;
        console.log(`  ${spec.title}: ${(duration / 1000).toFixed(1)}s`);
      });
    });
  }

} catch (error) {
  console.error('❌ Erro no baseline:', error.message);
  process.exit(1);
} finally {
  // Limpar arquivos temporários
  try {
    fs.unlinkSync('playwright.baseline.config.ts');
    fs.unlinkSync('baseline-results.json');
  } catch {}
}
