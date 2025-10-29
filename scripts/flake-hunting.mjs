#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Flake Hunting - Retries = 0, Classificação por Causa\n');

// Configuração
const RUNS = 3;
const PROJECTS_TO_TEST = [
  'core-critical',
  'critical-flows',
  'visual-regression-enhanced'
];

const flakeResults = {
  timestamp: new Date().toISOString(),
  runs: [],
  flakes: {},
  summary: {}
};

// Classificação de flakes por causa
const FLAKE_CATEGORIES = {
  network: ['net::ERR', 'timeout', 'connection', 'networkidle'],
  timing: ['waitForTimeout', 'expect timeout', 'action timeout'],
  state: ['element not found', 'element not visible', 'detached', 'stale'],
  selector: ['selector', 'locator', 'querySelector'],
  animation: ['animation', 'transition', 'transform'],
  screenshot: ['screenshot', 'diff', 'threshold'],
  other: []
};

function classifyFlake(errorMessage) {
  const message = errorMessage.toLowerCase();

  for (const [category, patterns] of Object.entries(FLAKE_CATEGORIES)) {
    if (patterns.some(pattern => message.includes(pattern))) {
      return category;
    }
  }

  return 'other';
}

async function runFlakeHunt(runNumber) {
  console.log(`\n🎯 Run ${runNumber}/${RUNS} - Flake Hunting (retries=0)...`);

  const runResult = {
    run: runNumber,
    startTime: new Date().toISOString(),
    specs: [],
    flakes: [],
    totalSpecs: 0,
    passedSpecs: 0,
    failedSpecs: 0
  };

  try {
    const projectsArg = PROJECTS_TO_TEST.map(p => `--project=${p}`).join(' ');

    execSync(
      `npx playwright test ${projectsArg} --workers=1 --retries=0 --reporter=json`,
      {
        stdio: 'pipe',
        cwd: process.cwd(),
        timeout: 300000 // 5 min
      }
    );

    console.log(`  ✅ Run ${runNumber} passou completamente`);

  } catch (error) {
    console.log(`  ⚠️  Run ${runNumber} teve falhas - analisando flakes...`);

    // Tentar extrair informações dos resultados JSON
    try {
      const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');
      if (fs.existsSync(resultsPath)) {
        const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

        results.suites?.forEach(suite => {
          suite.specs?.forEach(spec => {
            runResult.totalSpecs++;

            const test = spec.tests?.[0];
            if (test?.results?.[0]?.status === 'passed') {
              runResult.passedSpecs++;
            } else if (test?.results?.[0]?.status === 'failed') {
              runResult.failedSpecs++;

              const error = test.results[0].error;
              if (error) {
                const flake = {
                  spec: spec.title,
                  error: error.message,
                  category: classifyFlake(error.message),
                  stack: error.stack
                };

                runResult.flakes.push(flake);

                // Agregar por categoria
                if (!flakeResults.flakes[flake.category]) {
                  flakeResults.flakes[flake.category] = [];
                }
                flakeResults.flakes[flake.category].push(flake);
              }
            }
          });
        });
      }
    } catch (parseError) {
      console.warn('Não foi possível analisar resultados detalhados');
    }
  }

  return runResult;
}

async function main() {
  console.log('🎯 Iniciando Flake Hunting...\n');

  for (let run = 1; run <= RUNS; run++) {
    const runResult = await runFlakeHunt(run);
    flakeResults.runs.push(runResult);
  }

  // Calcular resumo
  const totalRuns = flakeResults.runs.length;
  const totalSpecs = flakeResults.runs.reduce((sum, run) => sum + run.totalSpecs, 0);
  const totalFlakes = Object.values(flakeResults.flakes).flat().length;
  const flakeRate = totalSpecs > 0 ? (totalFlakes / totalSpecs) * 100 : 0;

  flakeResults.summary = {
    totalRuns,
    totalSpecs,
    totalFlakes,
    flakeRate: `${flakeRate.toFixed(2)}%`,
    flakesByCategory: Object.fromEntries(
      Object.entries(flakeResults.flakes).map(([cat, flakes]) => [cat, flakes.length])
    )
  };

  // Salvar resultados
  const outputPath = path.join(process.cwd(), 'flake-hunting-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(flakeResults, null, 2));

  // Exibir relatório
  console.log('\n📊 RELATÓRIO DE FLAKES\n');
  console.log('='.repeat(50));
  console.log(`Total de specs executados: ${totalSpecs}`);
  console.log(`Total de flakes encontrados: ${totalFlakes}`);
  console.log(`Taxa de flake: ${flakeRate.toFixed(2)}%`);
  console.log(`Critério < 1%: ${flakeRate < 1 ? '✅ PASSOU' : '❌ FALHOU'}`);

  console.log('\n🔍 Flakes por categoria:');
  Object.entries(flakeResults.summary.flakesByCategory)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count} flakes`);
    });

  if (totalFlakes > 0) {
    console.log('\n🔧 Top 5 flakes encontrados:');
    const allFlakes = Object.values(flakeResults.flakes).flat();
    allFlakes.slice(0, 5).forEach((flake, i) => {
      console.log(`  ${i + 1}. [${flake.category}] ${flake.spec}`);
      console.log(`     ${flake.error.substring(0, 100)}${flake.error.length > 100 ? '...' : ''}`);
    });
  }

  console.log(`\n📄 Relatório completo salvo em: ${outputPath}`);
}

main().catch(console.error);
