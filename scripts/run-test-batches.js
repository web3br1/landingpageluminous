#!/usr/bin/env node

/**
 * Sistema Inteligente de Execução de Lotes de Testes
 * Estratégia: Fast/Medium/Slow lanes para otimização de tempo e recursos
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const TestCacheManager = require("./test-cache-manager.js");
const TestReportConsolidator = require("./test-report-consolidator.js");

// ===== CONFIGURAÇÃO DOS LOTES =====

const BATCHES = {
  // 🧪 LOTES VITEST (Unitários/Componentes)
  vitest: {
    unit: {
      name: "🔬 Unit Tests",
      cmd: "vitest run --config vitest.unit.config.ts",
      duration: "~10-15s",
      priority: 1,
      parallel: true,
      critical: true,
      depends: [],
    },
    components: {
      name: "🧩 Components",
      cmd: "vitest run --config vitest.components.config.ts",
      duration: "~20-30s",
      priority: 1,
      parallel: true,
      critical: true,
      depends: [],
    },
    lib: {
      name: "📚 Lib Utils",
      cmd: "vitest run tests/lib/",
      duration: "~10-15s",
      priority: 2,
      parallel: true,
      critical: false,
      depends: [],
    },
    dom: {
      name: "🌐 DOM Tests",
      cmd: "vitest run tests/dom/",
      duration: "~5-10s",
      priority: 2,
      parallel: true,
      critical: false,
      depends: [],
    },
    utils: {
      name: "🛠️ Utils Advanced",
      cmd: "vitest run tests/utils/",
      duration: "~15-20s",
      priority: 2,
      parallel: true,
      critical: false,
      depends: [],
    },
    integration: {
      name: "🔗 Integration",
      cmd: "vitest run tests/integration/",
      duration: "~20-30s",
      priority: 2,
      parallel: true,
      critical: false,
      depends: [],
    },
    browser: {
      name: "🌍 Browser Compat",
      cmd: "vitest run tests/browser-compatibility/",
      duration: "~10-15s",
      priority: 3,
      parallel: true,
      critical: false,
      depends: [],
    },
    ssr: {
      name: "⚙️ SSR Tests",
      cmd: "vitest run --config vitest.ssr.config.ts",
      duration: "~30-45s",
      priority: 3,
      parallel: false,
      critical: true,
      depends: [],
    },
    a11y: {
      name: "♿ Accessibility",
      cmd: "vitest run --config vitest.a11y.config.ts",
      duration: "~2-3min",
      priority: 3,
      parallel: false,
      critical: true,
      depends: [],
    },
    hydration: {
      name: "💧 Hydration",
      cmd: "vitest run tests/hydration*.test.tsx",
      duration: "~1-2min",
      priority: 2,
      parallel: false,
      critical: true,
      depends: [],
    },
  },

  // 🎭 LOTES PLAYWRIGHT (E2E)
  playwright: {
    "core-critical": {
      name: "🏗️ Core/Critical",
      cmd: "npx playwright test --project=core-critical --reporter=line",
      duration: "~30s",
      priority: 1,
      parallel: true,
      critical: true,
      depends: [],
    },
    "landing-page": {
      name: "🏠 Landing Page",
      cmd: "npx playwright test --project=landing-page --reporter=line",
      duration: "~2-3min",
      priority: 1,
      parallel: true,
      critical: true,
      depends: [],
    },
    accessibility: {
      name: "♿ A11y E2E",
      cmd: "npx playwright test --project=accessibility --reporter=line",
      duration: "~4-5min",
      priority: 2,
      parallel: true,
      critical: true,
      depends: [],
    },
    performance: {
      name: "⚡ Performance",
      cmd: "npx playwright test --project=performance --reporter=line",
      duration: "~6-8min",
      priority: 3,
      parallel: false,
      critical: false,
      depends: [],
    },
    "visual-regression": {
      name: "👁️ Visual Regression",
      cmd: "npx playwright test --project=visual-regression --reporter=line",
      duration: "~5-7min",
      priority: 3,
      parallel: false,
      critical: false,
      depends: [],
    },
    "critical-flows": {
      name: "🔄 Critical Flows",
      cmd: "npx playwright test --project=critical-flows --reporter=line",
      duration: "~8-10min",
      priority: 2,
      parallel: true,
      critical: true,
      depends: [],
    },
  },
};

// ===== ESTRATÉGIAS DE EXECUÇÃO =====

const STRATEGIES = {
  // Estratégia para desenvolvimento rápido
  fast: {
    name: "🚀 FAST DEV",
    batches: [
      "vitest:unit",
      "vitest:components",
      "vitest:hydration",
      "playwright:core-critical",
      "playwright:landing-page",
    ],
    parallel: true,
    maxWorkers: 3,
    description: "Testes essenciais para desenvolvimento rápido",
  },

  // Estratégia para CI básica
  ci: {
    name: "🏗️ CI BASIC",
    batches: [
      "vitest:unit",
      "vitest:components",
      "vitest:ssr",
      "vitest:a11y",
      "vitest:hydration",
      "playwright:core-critical",
      "playwright:landing-page",
      "playwright:accessibility",
    ],
    parallel: true,
    maxWorkers: 4,
    description: "Suite completa para CI básico",
  },

  // Estratégia completa para release
  full: {
    name: "🎯 FULL RELEASE",
    batches: Object.keys(BATCHES.vitest)
      .map((k) => `vitest:${k}`)
      .concat(Object.keys(BATCHES.playwright).map((k) => `playwright:${k}`)),
    parallel: true,
    maxWorkers: 6,
    description: "Suite completa para release/production",
  },

  // Estratégia para mudanças críticas
  critical: {
    name: "🚨 CRITICAL ONLY",
    batches: [
      "vitest:unit",
      "vitest:components",
      "vitest:ssr",
      "vitest:hydration",
      "playwright:core-critical",
      "playwright:landing-page",
    ],
    parallel: true,
    maxWorkers: 4,
    description: "Apenas testes críticos de funcionamento",
  },

  // Estratégia para mudanças de UI
  ui: {
    name: "🎨 UI CHANGES",
    batches: [
      "vitest:components",
      "vitest:a11y",
      "vitest:hydration",
      "playwright:landing-page",
      "playwright:accessibility",
      "playwright:visual-regression",
    ],
    parallel: true,
    maxWorkers: 3,
    description: "Foco em mudanças de interface",
  },

  // Estratégia para performance
  perf: {
    name: "⚡ PERFORMANCE",
    batches: [
      "playwright:performance",
      "vitest:hydration",
      "playwright:core-critical",
    ],
    parallel: false,
    maxWorkers: 1,
    description: "Foco em testes de performance",
  },
};

// ===== UTILITÁRIOS =====

function parseBatchKey(key) {
  const [framework, batch] = key.split(":");
  return { framework, batch, key };
}

function getBatchInfo(key) {
  const { framework, batch } = parseBatchKey(key);
  return BATCHES[framework]?.[batch];
}

function getBatchCmd(key) {
  const info = getBatchInfo(key);
  if (!info) return null;

  // Por enquanto, usar apenas os comandos base sem JSON reports
  // para focar em fazer os testes passarem
  return info.cmd;
}

async function executeCommand(cmd, options = {}) {
  const { timeout = 300000, cwd = path.resolve(__dirname, "..") } = options;

  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const [command, ...args] = isWindows
      ? ["cmd", "/c", ...cmd.split(" ")]
      : cmd.split(" ");

    console.log(`▶️  Executando: ${cmd}`);

    const child = spawn(command, args, {
      stdio: ["inherit", "pipe", "pipe"],
      cwd,
      detached: false,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output);
    });

    child.stderr.on("data", (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output);
    });

    const timeoutId = setTimeout(() => {
      console.log(`⏰ Timeout: ${cmd}`);
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 5000);
      resolve({ success: false, code: 1, timeout: true, stdout, stderr });
    }, timeout);

    child.on("close", (code) => {
      clearTimeout(timeoutId);
      const success = code === 0;
      resolve({ success, code, timeout: false, stdout, stderr });
    });

    child.on("error", (err) => {
      clearTimeout(timeoutId);
      console.error(`❌ Erro na execução: ${err.message}`);
      resolve({ success: false, code: 1, timeout: false, stdout, stderr });
    });
  });
}

async function runBatch(key, options = {}) {
  const info = getBatchInfo(key);
  if (!info) {
    console.error(`❌ Lote não encontrado: ${key}`);
    return { success: false, code: 1 };
  }

  console.log(`\n🎯 EXECUTANDO ${info.name} (${key})`);
  console.log(`   📋 Descrição: ${info.description || "N/A"}`);
  console.log(`   ⏱️  Duração estimada: ${info.duration}`);
  console.log(`   🔄 Paralelo: ${info.parallel ? "Sim" : "Não"}`);
  console.log(`   🚨 Crítico: ${info.critical ? "Sim" : "Não"}`);
  console.log("─".repeat(60));

  const cmd = getBatchCmd(key);
  if (!cmd) {
    console.error(`❌ Comando não encontrado para: ${key}`);
    return { success: false, code: 1 };
  }

  const result = await executeCommand(cmd, options);

  console.log(
    `${result.success ? "✅" : "❌"} FINALIZADO ${info.name} (${result.code})`,
  );

  if (result.timeout) {
    console.log(`   ⏰ Timeout após ${options.timeout || 300000}ms`);
  }

  return result;
}

async function runSequential(batches, options = {}) {
  const results = [];
  const cacheManager = options.useCache ? new TestCacheManager() : null;

  for (const batch of batches) {
    // Verificar cache se habilitado
    if (cacheManager && !cacheManager.shouldRunBatch(batch)) {
      console.log(`⏭️  ${batch} pulado (cache hit)`);
      results.push({
        batch,
        success: true,
        code: 0,
        timeout: false,
        skipped: true,
        cached: true,
      });
      continue;
    }

    const result = await runBatch(batch, options);
    results.push({ batch, ...result });

    if (!result.success && options.failFast) {
      console.log("\n🛑 Execução interrompida por falha crítica");
      break;
    }
  }

  return results;
}

async function runParallel(batches, maxWorkers = 3, options = {}) {
  const results = [];
  const queue = [...batches];
  const cacheManager = options.useCache ? new TestCacheManager() : null;

  async function worker() {
    while (queue.length > 0) {
      const batch = queue.shift();
      if (batch) {
        // Verificar cache se habilitado
        if (cacheManager && !cacheManager.shouldRunBatch(batch)) {
          console.log(`⏭️  ${batch} pulado (cache hit)`);
          results.push({
            batch,
            success: true,
            code: 0,
            timeout: false,
            skipped: true,
            cached: true,
          });
        } else {
          const result = await runBatch(batch, options);
          results.push({ batch, ...result });
        }
      }
    }
  }

  const workers = Array(Math.min(maxWorkers, batches.length))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);
  return results;
}

// ===== FUNÇÃO PRINCIPAL =====

async function main() {
  const args = process.argv.slice(2);
  const strategy = args[0] || "help";

  if (strategy === "help" || strategy === "--help") {
    printHelp();
    return;
  }

  if (strategy === "list") {
    printBatches();
    return;
  }

  if (strategy === "strategies") {
    printStrategies();
    return;
  }

  const strat = STRATEGIES[strategy];
  if (!strat) {
    console.error(`❌ Estratégia não encontrada: ${strategy}`);
    console.log("\n📋 Estratégias disponíveis:");
    Object.keys(STRATEGIES).forEach((s) => console.log(`   • ${s}`));
    return;
  }

  // Criar diretório de resultados se não existir
  const resultsDir = path.join(__dirname, "..", "test-results");
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
    console.log(`📁 Criado diretório: ${resultsDir}`);
  }

  console.log(`\n🎭 EXECUTANDO ESTRATÉGIA: ${strat.name}`);
  console.log(`📝 Descrição: ${strat.description}`);
  console.log(`📦 Lotes: ${strat.batches.length}`);
  console.log(`👥 Workers: ${strat.maxWorkers}`);
  console.log(`🔄 Paralelo: ${strat.parallel ? "Sim" : "Não"}`);
  console.log("═".repeat(80));

  const startTime = Date.now();

  // Verificar se deve usar cache (padrão: sim, exceto em CI ou quando desabilitado)
  const useCache = !args.includes("--no-cache") && !process.env.CI;

  let results;
  if (strat.parallel) {
    results = await runParallel(strat.batches, strat.maxWorkers, {
      failFast: true,
      useCache,
    });
  } else {
    results = await runSequential(strat.batches, { failFast: true, useCache });
  }

  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(1);

  // Análise de resultados
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const cached = results.filter((r) => r.cached).length;
  const total = results.length;

  console.log("\n" + "═".repeat(80));
  console.log("📊 RESULTADO FINAL");
  console.log(`✅ Passaram: ${passed}`);
  console.log(`❌ Falharam: ${failed}`);
  console.log(`⏭️  Em cache: ${cached}`);
  console.log(`📊 Total executado: ${total - cached}/${total}`);
  console.log(`⏱️  Tempo total: ${totalTime}s`);
  console.log(`📈 Taxa de sucesso: ${((passed / total) * 100).toFixed(1)}%`);

  if (cached > 0) {
    const cacheSavings = ((cached / total) * 100).toFixed(1);
    console.log(`⚡ Economia de cache: ${cacheSavings}% dos lotes`);
  }

  if (failed > 0) {
    console.log("\n❌ LOTES COM FALHA:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   • ${r.batch}`);
      });
  }

  // Gerar relatório consolidado se solicitado
  if (args.includes("--report") || args.includes("--save-report")) {
    console.log("\n📊 Gerando relatório consolidado...");
    const consolidator = new TestReportConsolidator();

    if (args.includes("--save-report")) {
      const reportPath = consolidator.saveReport();
      console.log(`💾 Relatório salvo: ${reportPath}`);
    } else {
      consolidator.printReport();
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

// ===== FUNÇÕES DE HELP =====

function printHelp() {
  console.log(`
🎭 SISTEMA DE LOTES DE TESTES - LANDING PAGE SAAS

📖 USO:
  node scripts/run-test-batches.js <estratégia> [opções]

🎯 ESTRATÉGIAS:
  fast      - Desenvolvimento rápido (testes essenciais)
  ci        - CI básico (suite completa para CI)
  full      - Release completo (todos os testes)
  critical  - Apenas testes críticos
  ui        - Foco em mudanças de interface
  perf      - Foco em performance

📋 UTILITÁRIOS:
  list      - Lista todos os lotes disponíveis
  strategies- Mostra informações das estratégias

📝 EXEMPLOS:
  npm run test:batches:fast
  npm run test:batches:ci
  node scripts/run-test-batches.js fast
  node scripts/run-test-batches.js list
`);
}

function printBatches() {
  console.log("\n🔬 LOTES VITEST (UNITÁRIOS/COMPONENTES):");
  Object.entries(BATCHES.vitest).forEach(([key, info]) => {
    console.log(
      `  ${key.padEnd(12)} | ${info.name.padEnd(20)} | ${info.duration.padEnd(8)} | ${info.critical ? "🚨" : "📋"} ${info.parallel ? "🔄" : "📊"}`,
    );
  });

  console.log("\n🎭 LOTES PLAYWRIGHT (E2E):");
  Object.entries(BATCHES.playwright).forEach(([key, info]) => {
    console.log(
      `  ${key.padEnd(12)} | ${info.name.padEnd(20)} | ${info.duration.padEnd(8)} | ${info.critical ? "🚨" : "📋"} ${info.parallel ? "🔄" : "📊"}`,
    );
  });

  console.log("\n📊 LEGENDA:");
  console.log("  🚨 Crítico  🔄 Paralelo  📊 Sequencial");
}

function printStrategies() {
  console.log("\n🎯 ESTRATÉGIAS DISPONÍVEIS:\n");
  Object.entries(STRATEGIES).forEach(([key, strat]) => {
    console.log(`${key.padEnd(10)} | ${strat.name}`);
    console.log(`          | ${strat.description}`);
    console.log(
      `          | Lotes: ${strat.batches.length}, Workers: ${strat.maxWorkers}, Paralelo: ${strat.parallel ? "Sim" : "Não"}`,
    );
    console.log("");
  });
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch((err) => {
    console.error("❌ Erro fatal:", err);
    process.exit(1);
  });
}

module.exports = { runBatch, runSequential, runParallel, BATCHES, STRATEGIES };
