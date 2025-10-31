#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('⚡ Performance Real - Lighthouse + Bundle Analyzer\n');

const BUDGETS = {
  lighthouse: {
    performance: 90,
    accessibility: 95,
    'best-practices': 95,
    seo: 95,
    pwa: 80
  },
  bundle: {
    totalSize: 500 * 1024, // 500KB
    chunks: 100 * 1024,    // 100KB por chunk
    assets: 200 * 1024     // 200KB por asset
  }
};

const results = {
  timestamp: new Date().toISOString(),
  lighthouse: {},
  bundle: {},
  summary: {}
};

async function runLighthouse() {
  console.log('🏮 Executando Lighthouse...');

  try {
    // Instalar lighthouse se não estiver disponível
    try {
      execSync('npx lighthouse --version', { stdio: 'pipe' });
    } catch {
      console.log('  📦 Instalando lighthouse...');
      execSync('npm install -g lighthouse', { stdio: 'pipe' });
    }

    const outputPath = path.join(process.cwd(), 'lighthouse-report.json');

    execSync(
      `npx lighthouse http://localhost:3000 --output=json --output-path=${outputPath} --quiet --disable-storage-reset`,
      { stdio: 'pipe', cwd: process.cwd() }
    );

    if (fs.existsSync(outputPath)) {
      const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

      results.lighthouse = {
        performance: report.categories?.performance?.score * 100 || 0,
        accessibility: report.categories?.accessibility?.score * 100 || 0,
        'best-practices': report.categories?.['best-practices']?.score * 100 || 0,
        seo: report.categories?.seo?.score * 100 || 0,
        pwa: report.categories?.pwa?.score * 100 || 0,
        metrics: {
          'first-contentful-paint': report.audits?.['first-contentful-paint']?.displayValue || 'N/A',
          'largest-contentful-paint': report.audits?.['largest-contentful-paint']?.displayValue || 'N/A',
          'cumulative-layout-shift': report.audits?.['cumulative-layout-shift']?.displayValue || '0',
          'interaction-to-next-paint': report.audits?.['interaction-to-next-paint']?.displayValue || 'N/A'
        }
      };

      console.log('  ✅ Lighthouse executado com sucesso');
      return true;
    }

  } catch (error) {
    console.error('  ❌ Erro no Lighthouse:', error.message);
  }

  return false;
}

async function runBundleAnalyzer() {
  console.log('📦 Executando Bundle Analyzer...');

  try {
    // Instalar webpack-bundle-analyzer se necessário
    try {
      execSync('npx webpack-bundle-analyzer --version', { stdio: 'pipe' });
    } catch {
      console.log('  📦 Instalando webpack-bundle-analyzer...');
      execSync('npm install --save-dev webpack-bundle-analyzer', { stdio: 'pipe' });
    }

    // Gerar análise de bundle
    const outputPath = path.join(process.cwd(), 'bundle-analysis.json');

    // Usar Next.js build analyzer
    execSync(
      'ANALYZE=true npm run build',
      { stdio: 'pipe', cwd: process.cwd(), env: { ...process.env, ANALYZE: 'true' } }
    );

    // Ler .next/static/chunks se existir
    const chunksDir = path.join(process.cwd(), '.next', 'static', 'chunks');
    if (fs.existsSync(chunksDir)) {
      const files = fs.readdirSync(chunksDir, { recursive: true });
      const jsFiles = files.filter(f => f.endsWith('.js'));

      let totalSize = 0;
      const chunks = [];

      jsFiles.forEach(file => {
        const filePath = path.join(chunksDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        chunks.push({
          name: file,
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(1)
        });
      });

      results.bundle = {
        totalSize,
        totalSizeKB: (totalSize / 1024).toFixed(1),
        chunkCount: chunks.length,
        largestChunks: chunks.sort((a, b) => b.size - a.size).slice(0, 5)
      };

      console.log('  ✅ Bundle analyzer executado');
      return true;
    }

  } catch (error) {
    console.error('  ❌ Erro no bundle analyzer:', error.message);
  }

  return false;
}

function evaluateBudgets() {
  const lighthouseResults = results.lighthouse;
  const bundleResults = results.bundle;

  const lighthousePassed = Object.entries(BUDGETS.lighthouse).every(
    ([category, budget]) => lighthouseResults[category] >= budget
  );

  const bundlePassed =
    bundleResults.totalSize <= BUDGETS.bundle.totalSize &&
    bundleResults.largestChunks?.every(chunk => chunk.size <= BUDGETS.bundle.chunks) !== false;

  return { lighthousePassed, bundlePassed };
}

async function main() {
  console.log('🎯 Iniciando validação de performance real...\n');

  // Iniciar servidor se não estiver rodando
  console.log('🚀 Verificando servidor...');
  try {
    execSync('timeout 5 bash -c "</dev/tcp/localhost/3000" 2>/dev/null && echo "Server running" || echo "Server not running"', { stdio: 'pipe' });
  } catch {
    console.log('  📡 Iniciando servidor Next.js...');
    execSync('npm run dev', {
      stdio: 'ignore',
      detached: true,
      cwd: process.cwd()
    });
    // Aguardar inicialização
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  // Executar validações
  const lighthouseSuccess = await runLighthouse();
  const bundleSuccess = await runBundleAnalyzer();

  // Avaliar orçamentos
  const { lighthousePassed, bundlePassed } = evaluateBudgets();

  results.summary = {
    lighthouseSuccess,
    bundleSuccess,
    lighthousePassed,
    bundlePassed,
    overallPassed: lighthousePassed && bundlePassed
  };

  // Salvar resultados
  const outputPath = path.join(process.cwd(), 'performance-real-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // Exibir relatório
  console.log('\n📊 RELATÓRIO DE PERFORMANCE REAL\n');
  console.log('='.repeat(50));

  if (lighthouseSuccess) {
    console.log('🏮 Lighthouse Scores:');
    Object.entries(results.lighthouse).forEach(([category, score]) => {
      if (typeof score === 'number') {
        const budget = BUDGETS.lighthouse[category];
        const status = score >= budget ? '✅' : '❌';
        console.log(`  ${category}: ${score.toFixed(1)} ${status} (budget: ${budget})`);
      }
    });

    console.log('\n📏 Core Web Vitals:');
    Object.entries(results.lighthouse.metrics || {}).forEach(([metric, value]) => {
      console.log(`  ${metric}: ${value}`);
    });
  } else {
    console.log('🏮 Lighthouse: ❌ Não executado');
  }

  if (bundleSuccess) {
    console.log('\n📦 Bundle Analysis:');
    console.log(`  Total size: ${(results.bundle.totalSizeKB || 0)} KB`);
    console.log(`  Chunks: ${results.bundle.chunkCount || 0}`);

    const largest = results.bundle.largestChunks?.[0];
    if (largest) {
      console.log(`  Maior chunk: ${largest.name} (${largest.sizeKB} KB)`);
    }
  } else {
    console.log('\n📦 Bundle Analysis: ❌ Não executado');
  }

  console.log('\n🎯 Avaliação Final:');
  console.log(`✅ Lighthouse budgets: ${lighthousePassed ? 'PASSOU' : 'FALHOU'}`);
  console.log(`✅ Bundle budgets: ${bundlePassed ? 'PASSOU' : 'FALHOU'}`);

  if (results.summary.overallPassed) {
    console.log('\n🎉 Performance Real: APROVADO! Dentro dos orçamentos.');
  } else {
    console.log('\n⚠️  Performance precisa de otimização:');
    if (!lighthousePassed) console.log('  - Melhorar scores do Lighthouse');
    if (!bundlePassed) console.log('  - Reduzir tamanho do bundle');
  }

  console.log(`\n📄 Relatório completo salvo em: ${outputPath}`);
}

main().catch(console.error);
