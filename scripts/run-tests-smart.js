#!/usr/bin/env node

/**
 * Script Inteligente de Execução de Testes
 * Estratégia: Fast/Medium/Slow lanes para otimização de tempo
 */

const { spawn } = require("child_process");
const path = require("path");
const TestCacheManager = require("./test-cache-manager.js");

// Configurações de timeout por categoria (mais granulares)
const TIMEOUTS = {
  fast: 30, // Testes funcionais básicos
  medium: 60, // E2E e visuais
  slow: 180, // Performance e user journeys
  ci: 300, // Ambiente CI
};

// Categorias de teste com padrões de identificação
const TEST_CATEGORIES = {
  fast: [/functional.*test/i, /basic.*test/i, /unit.*test/i, /simple.*test/i],
  medium: [
    /e2e.*test/i,
    /visual.*regression/i,
    /accessibility.*test/i,
    /a11y.*test/i,
    /hydration.*test/i,
    /ssr.*test/i,
  ],
  slow: [
    /performance.*test/i,
    /load.*performance/i,
    /complete.*user.*journey/i,
    /critical.*flows/i,
    /stress.*test/i,
  ],
};

// Estratégias de execução por projeto Playwright
const EXECUTION_STRATEGIES = {
  "fast-tests": { timeout: 30, workers: 4, parallel: true },
  "e2e-tests": { timeout: 60, workers: 3, parallel: true },
  "visual-tests": { timeout: 90, workers: 2, parallel: true },
  "performance-tests": { timeout: 180, workers: 1, parallel: false },
  "accessibility-tests": { timeout: 45, workers: 2, parallel: true },
};

/**
 * Detecta categoria do teste baseada no arquivo/padrão
 */
function detectCategory(args) {
  const hasFiles = args.some((arg) => !arg.startsWith("--"));

  if (!hasFiles) {
    // Executando todos os testes - usar estratégia balanceada
    return "medium";
  }

  const fileNames = args.filter((arg) => !arg.startsWith("--")).join(" ");

  for (const [category, patterns] of Object.entries(TEST_CATEGORIES)) {
    if (patterns.some((pattern) => pattern.test(fileNames))) {
      return category;
    }
  }

  return "medium"; // default
}

/**
 * Detecta estratégia baseada nos projetos Playwright
 */
function detectStrategy(args) {
  const projects = [
    "fast-tests",
    "e2e-tests",
    "visual-tests",
    "performance-tests",
    "accessibility-tests",
  ];
  const projectArg = args.find((arg) => arg.startsWith("--project="));

  if (projectArg) {
    const project = projectArg.split("=")[1];
    return EXECUTION_STRATEGIES[project] || EXECUTION_STRATEGIES["e2e-tests"];
  }

  return null; // usar detecção automática
}

/**
 * Executa testes com estratégia otimizada
 */
async function runSmartTests(args) {
  const category = detectCategory(args);
  const strategy = detectStrategy(args);

  // Determinar configuração final
  let timeout, workers, parallel;

  if (strategy) {
    // Usar estratégia específica do projeto
    timeout = strategy.timeout;
    workers = strategy.workers;
    parallel = strategy.parallel;
  } else {
    // Usar categoria detectada
    timeout = process.env.CI ? TIMEOUTS.ci : TIMEOUTS[category];

    // Configuração de workers baseada na categoria
    const workerConfig = {
      fast: process.env.CI ? 2 : 4,
      medium: process.env.CI ? 1 : 3,
      slow: 1, // sempre sequencial para testes pesados
      ci: 1,
    };

    workers = workerConfig[process.env.CI ? "ci" : category];
    parallel = category !== "slow";
  }

  // Construir comando Playwright otimizado
  const playwrightArgs = [
    "playwright",
    "test",
    "--reporter=line,json:./test-results/results.json",
  ];

  // Adicionar configuração de workers se especificada
  if (workers) {
    playwrightArgs.push("--workers", workers.toString());
  }

  // Adicionar configuração de paralelização
  if (!parallel) {
    playwrightArgs.push("--max-failures=1"); // Para testes pesados, parar no primeiro erro
  }

  // Adicionar argumentos originais
  playwrightArgs.push(...args);

  console.log(`🚀 EXECUÇÃO INTELIGENTE DETECTADA:`);
  console.log(`   📂 Categoria: ${category.toUpperCase()}`);
  console.log(`   ⏱️  Timeout: ${timeout}s`);
  console.log(`   👥 Workers: ${workers}`);
  console.log(`   🔄 Paralelo: ${parallel ? "Sim" : "Não"}`);
  console.log(`   📋 Comando: npx ${playwrightArgs.join(" ")}`);
  console.log("─".repeat(80));

  return executeWithTimeout(playwrightArgs, timeout);
}

/**
 * Executa comando com timeout inteligente
 */
function executeWithTimeout(args, timeoutSeconds) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const command = isWindows ? "cmd" : "npx";
    const finalArgs = isWindows ? ["/c", "npx", ...args] : args;

    let stdoutBuffer = "";
    let stderrBuffer = "";
    let hasErrors = false;
    let finished = false;

    // Timeout inteligente
    const timeout = setTimeout(() => {
      if (finished) return;

      console.log(
        `\n⏰ TIMEOUT: ${timeoutSeconds}s atingido. Finalizando execução...`,
      );
      finished = true;

      // Análise de performance mesmo com timeout
      analyzePerformance(stdoutBuffer, stderrBuffer, hasErrors, 1);
      resolve(1);
    }, timeoutSeconds * 1000);

    const child = spawn(command, finalArgs, {
      stdio: ["inherit", "pipe", "pipe"],
      cwd: path.resolve(__dirname, ".."),
      detached: true,
    });

    // Captura saída
    child.stdout.on("data", (data) => {
      const output = data.toString();
      stdoutBuffer += output;
      process.stdout.write(output);
    });

    child.stderr.on("data", (data) => {
      const output = data.toString();
      stderrBuffer += output;
      hasErrors = true;
      process.stderr.write(output);
    });

    // Limpeza ao finalizar
    const cleanup = (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      analyzePerformance(stdoutBuffer, stderrBuffer, hasErrors, code);
      resolve(code);
    };

    child.on("close", cleanup);
    child.on("exit", cleanup);
    child.on("error", (err) => {
      console.error("❌ Erro na execução:", err);
      cleanup(1);
    });
  });
}

/**
 * Análise detalhada de performance
 */
function analyzePerformance(stdoutBuffer, stderrBuffer, hasErrors, exitCode) {
  console.log("\n" + "─".repeat(80));
  console.log("📊 ANÁLISE DE PERFORMANCE DETALHADA");

  // Estatísticas básicas
  const passedMatch = stdoutBuffer.match(/(\d+)\s+passed/);
  const failedMatch = stdoutBuffer.match(/(\d+)\s+failed/);
  const skippedMatch = stdoutBuffer.match(/(\d+)\s+skipped/);

  const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
  const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
  const skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;
  const total = passed + failed + skipped;

  console.log(`\n📈 RESULTADO FINAL:`);
  console.log(`  ✅ Passaram: ${passed}`);
  console.log(`  ❌ Falharam: ${failed}`);
  console.log(`  ⏭️  Pulados: ${skipped}`);
  console.log(`  📊 Total: ${total}`);

  // Tempo total
  const timeMatch = stdoutBuffer.match(/Total time: ([\d.]+)([sm])/);
  if (timeMatch) {
    const time = parseFloat(timeMatch[1]);
    const unit = timeMatch[2];
    console.log(`  ⏱️  Tempo total: ${time}${unit}`);
  }

  // Análise de tempos por teste (se disponível)
  try {
    const fs = require("fs");
    const resultsPath = path.join(
      process.cwd(),
      "test-results",
      "results.json",
    );

    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));

      console.log("\n⏱️  ANÁLISE POR TESTE:");

      const testDurations = [];

      results.suites?.forEach((suite) => {
        suite.specs?.forEach((spec) => {
          spec.tests?.forEach((test) => {
            if (test.results?.length > 0) {
              const result = test.results[0];
              const duration = result.duration || 0;
              testDurations.push({
                name: `${spec.title} › ${test.title}`,
                duration,
                status: result.status,
              });
            }
          });
        });
      });

      // Ordenar por duração (mais lentos primeiro)
      testDurations.sort((a, b) => b.duration - a.duration);

      // Mostrar top 10 mais lentos
      console.log("\n🐌 TOP 10 TESTES MAIS LENTOS:");
      testDurations.slice(0, 10).forEach((test, i) => {
        const timeFormatted =
          test.duration >= 1000
            ? `${(test.duration / 1000).toFixed(2)}s`
            : `${test.duration}ms`;
        const status =
          test.duration > 10000 ? "🐌" : test.duration > 5000 ? "⚡" : "🚀";
        const outcome =
          test.status === "passed"
            ? "✅"
            : test.status === "failed"
              ? "❌"
              : "⏭️";
        console.log(
          `  ${i + 1}. ${status} ${timeFormatted} ${outcome} ${test.name}`,
        );
      });

      // Estatísticas de distribuição
      const fast = testDurations.filter((t) => t.duration < 2000).length;
      const medium = testDurations.filter(
        (t) => t.duration >= 2000 && t.duration < 10000,
      ).length;
      const slow = testDurations.filter((t) => t.duration >= 10000).length;

      console.log("\n📊 DISTRIBUIÇÃO DE PERFORMANCE:");
      console.log(`  🚀 Rápidos (<2s): ${fast} testes`);
      console.log(`  ⚡ Médios (2-10s): ${medium} testes`);
      console.log(`  🐌 Lentos (>10s): ${slow} testes`);
    }
  } catch (err) {
    console.log("\n⏱️  Análise detalhada não disponível (JSON não encontrado)");
  }

  // Recomendações
  console.log("\n💡 RECOMENDAÇÕES DE OTIMIZAÇÃO:");

  if (total > 0) {
    const successRate = (passed / total) * 100;
    if (successRate < 95) {
      console.log("  - 🔧 Focar em estabilidade: corrigir testes falhando");
    }

    if (slow > fast) {
      console.log(
        "  - ⚡ Otimizar testes lentos: paralelização ou simplificação",
      );
    }

    if (parallel && workers === 1) {
      console.log("  - 👥 Aumentar paralelização se recursos permitirem");
    }
  }

  console.log(`\n🏁 Processo finalizado com código: ${exitCode}`);

  if (exitCode !== 0) {
    console.log("\n❌ VERIFICAR ERROS:");
    if (stderrBuffer.trim()) {
      console.log(
        "  🔴 STDERR:",
        stderrBuffer.trim().split("\n").slice(-3).join("\n"),
      );
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);
  runSmartTests(args)
    .then((code) => {
      process.exit(code);
    })
    .catch((err) => {
      console.error("❌ Erro fatal:", err);
      process.exit(1);
    });
}

module.exports = { runSmartTests, detectCategory, detectStrategy };
