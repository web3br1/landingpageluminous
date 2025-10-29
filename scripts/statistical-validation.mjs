#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('📊 Validação Estatística dos Ganhos - Playbook 7 Dias\n');

// Configuração dos testes
const BROWSERS = ['chromium', 'firefox', 'webkit'];
const RUNS_PER_BROWSER = 3;
const PROJECTS_TO_TEST = [
  'core-critical',
  'critical-flows',
  'visual-regression-enhanced'
];

const results = {
  timestamp: new Date().toISOString(),
  runs: [],
  summary: {}
};

// Função para calcular estatísticas
function calculateStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const p90 = sorted[Math.floor(sorted.length * 0.9)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  );
  const cv = (stdDev / mean) * 100; // Coeficiente de variação

  return { mean, median, p90, p95, stdDev, cv, min: sorted[0], max: sorted[sorted.length - 1] };
}

// Executar testes por browser
async function runBrowserTests(browser) {
  console.log(`\n🌐 Testando ${browser.toUpperCase()} (${RUNS_PER_BROWSER} runs)...`);

  const browserResults = {
    browser,
    runs: [],
    stats: {}
  };

  for (let run = 1; run <= RUNS_PER_BROWSER; run++) {
    console.log(`  📈 Run ${run}/${RUNS_PER_BROWSER}...`);

    const runStart = Date.now();
    const runResult = {
      run,
      startTime: new Date().toISOString(),
      specs: {},
      totalDuration: 0,
      success: true
    };

    try {
      // Executar apenas projetos críticos para velocidade
      const projectsArg = PROJECTS_TO_TEST.map(p => `--project=${p}`).join(' ');

      execSync(
        `npx playwright test ${projectsArg} --browser=${browser} --workers=1 --timeout=60000 --reporter=json`,
        {
          stdio: 'pipe',
          cwd: process.cwd(),
          timeout: 300000 // 5 min timeout
        }
      );

      runResult.totalDuration = Date.now() - runStart;

      // Tentar ler resultados do reporter JSON (se existir)
      try {
        const jsonPath = path.join(process.cwd(), 'test-results', 'results.json');
        if (fs.existsSync(jsonPath)) {
          const jsonResults = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          // Processar resultados por spec
        }
      } catch (e) {
        // Fallback - sem dados detalhados
      }

    } catch (error) {
      runResult.success = false;
      runResult.error = error.message;
      runResult.totalDuration = Date.now() - runStart;
      console.log(`    ❌ Run ${run} falhou (${(runResult.totalDuration / 1000).toFixed(1)}s)`);
    }

    browserResults.runs.push(runResult);
    console.log(`    ✅ Run ${run} concluído (${(runResult.totalDuration / 1000).toFixed(1)}s)`);
  }

  // Calcular estatísticas
  const durations = browserResults.runs.map(r => r.totalDuration);
  browserResults.stats = calculateStats(durations.filter(d => d > 0));

  return browserResults;
}

// Executar validação completa
async function main() {
  console.log('🎯 Executando Validação Estatística...\n');

  for (const browser of BROWSERS) {
    try {
      const browserResult = await runBrowserTests(browser);
      results.runs.push(browserResult);
    } catch (error) {
      console.error(`❌ Erro no browser ${browser}:`, error.message);
    }
  }

  // Gerar resumo
  results.summary = {
    chromium: results.runs.find(r => r.browser === 'chromium')?.stats || {},
    firefox: results.runs.find(r => r.browser === 'firefox')?.stats || {},
    webkit: results.runs.find(r => r.browser === 'webkit')?.stats || {}
  };

  // Salvar resultados
  const outputPath = path.join(process.cwd(), 'validation-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // Exibir resumo
  console.log('\n📊 RESUMO ESTATÍSTICO DOS GANHOS\n');
  console.log('='.repeat(60));

  Object.entries(results.summary).forEach(([browser, stats]) => {
    console.log(`\n🌐 ${browser.toUpperCase()}`);
    console.log(`  Média: ${(stats.mean / 1000).toFixed(1)}s`);
    console.log(`  Mediana: ${(stats.median / 1000).toFixed(1)}s`);
    console.log(`  P90: ${(stats.p90 / 1000).toFixed(1)}s`);
    console.log(`  P95: ${(stats.p95 / 1000).toFixed(1)}s`);
    console.log(`  CoV: ${stats.cv.toFixed(1)}%`);
    console.log(`  Faixa: ${(stats.min / 1000).toFixed(1)}s - ${(stats.max / 1000).toFixed(1)}s`);
  });

  // Avaliação de sucesso
  console.log('\n🎯 AVALIAÇÃO DE SUCESSO\n');
  console.log('='.repeat(60));

  const chromiumP95 = results.summary.chromium.p95 / 1000;
  const firefoxP95 = results.summary.firefox.p95 / 1000;
  const chromiumCoV = results.summary.chromium.cv;

  console.log(`✅ E2E Chromium p95 ≤ 12s: ${chromiumP95 <= 12 ? 'PASSOU' : 'FALHOU'} (${chromiumP95.toFixed(1)}s)`);
  console.log(`✅ Firefox p95 ≤ +20% Chromium: ${(firefoxP95 <= chromiumP95 * 1.2 ? 'PASSOU' : 'FALHOU')} (${firefoxP95.toFixed(1)}s vs ${(chromiumP95 * 1.2).toFixed(1)}s)`);
  console.log(`✅ Chromium CoV ≤ 15%: ${chromiumCoV <= 15 ? 'PASSOU' : 'FALHOU'} (${chromiumCoV.toFixed(1)}%)`);

  console.log(`\n📄 Resultados salvos em: ${outputPath}`);
}

main().catch(console.error);
