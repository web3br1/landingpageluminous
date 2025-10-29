#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Verificar se Playwright está instalado
if (!fs.existsSync("node_modules/.bin/playwright")) {
  console.error("❌ Playwright not installed. Run: npx playwright install");
  process.exit(1);
}

// Arquivos de teste e argumentos a executar (passados como argumentos)
const args = process.argv.slice(2);
let grepPattern = null;
const testFiles = [];

// Processar argumentos para encontrar --grep
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--grep" && i + 1 < args.length) {
    grepPattern = args[i + 1];
    i++; // skip next arg
  } else {
    testFiles.push(args[i]);
  }
}

// Comando playwright
const playwrightArgs = [
  "playwright",
  "test",
  "--reporter=line,json:./test-results/results.json",
];

if (grepPattern) {
  playwrightArgs.push("--grep", grepPattern);
}

playwrightArgs.push(...testFiles);

// Timeout inteligente baseado na categoria do teste
let TIMEOUT_SECONDS = 30; // default mínimo

// Detecção automática de categoria baseada nos arquivos de teste
const hasPerformanceTests = testFiles.some(
  (file) => file.includes("performance") || file.includes("load-performance"),
);

const hasComplexE2ETests = testFiles.some(
  (file) =>
    file.includes("complete-user-journey") || file.includes("critical-flows"),
);

const hasMultipleFiles = testFiles.length > 2;
const hasVisualRegression = testFiles.some((file) =>
  file.includes("visual-regression"),
);

if (process.env.TEST_TIMEOUT && process.env.TEST_TIMEOUT !== "45") {
  TIMEOUT_SECONDS = parseInt(process.env.TEST_TIMEOUT);
  console.log(`📝 Timeout customizado: ${TIMEOUT_SECONDS}s`);
} else if (process.env.CI) {
  TIMEOUT_SECONDS = 300;
  console.log(`📝 Ambiente CI: ${TIMEOUT_SECONDS}s`);
} else if (hasPerformanceTests) {
  TIMEOUT_SECONDS = 120; // testes de performance precisam de mais tempo
  console.log(`📊 Testes de Performance: ${TIMEOUT_SECONDS}s`);
} else if (hasComplexE2ETests) {
  TIMEOUT_SECONDS = 90; // user journeys complexos
  console.log(`🔄 E2E Complexo: ${TIMEOUT_SECONDS}s`);
} else if (hasMultipleFiles) {
  TIMEOUT_SECONDS = 60; // múltiplos arquivos
  console.log(`📁 Múltiplos arquivos: ${TIMEOUT_SECONDS}s`);
} else if (hasVisualRegression) {
  TIMEOUT_SECONDS = 45; // visual regression
  console.log(`👁️ Visual Regression: ${TIMEOUT_SECONDS}s`);
} else {
  console.log(`🚀 Timeout padrão: ${TIMEOUT_SECONDS}s`);
}

// Se estamos no Windows, usamos cmd /c
const isWindows = process.platform === "win32";
const command = isWindows ? "cmd" : "npx";
const finalArgs = isWindows ? ["/c", "npx", ...playwrightArgs] : playwrightArgs;

console.log(
  `🚀 Executando testes com timeout inteligente de ${TIMEOUT_SECONDS}s...`,
);
console.log(`📋 Comando: ${command} ${finalArgs.join(" ")}`);
console.log("─".repeat(80));

// Buffers para capturar saída
let stdoutBuffer = "";
let stderrBuffer = "";
let hasErrors = false;

// Flag para controlar se já finalizamos
let finished = false;

// Timeout inteligente para forçar saída se necessário
const timeout = setTimeout(() => {
  if (finished) return;

  console.log(`\n⏰ TIMEOUT: ${TIMEOUT_SECONDS}s atingido. Forçando saída...`);
  finished = true;

  console.log("\n" + "─".repeat(80));
  console.log("❌ RESUMO DO TIMEOUT:");
  console.log(`⏱️  Timeout configurado: ${TIMEOUT_SECONDS}s`);
  console.log(`🕒 Tempo decorrido: ${TIMEOUT_SECONDS}s`);
  console.log(`📊 Código de saída: 1 (timeout)`);

  if (stdoutBuffer) {
    // Conta testes executados até o timeout
    const passedMatch = stdoutBuffer.match(/(\d+)\s+passed/);
    const failedMatch = stdoutBuffer.match(/(\d+)\s+failed/);
    const skippedMatch = stdoutBuffer.match(/(\d+)\s+skipped/);

    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;

    console.log(`\n📈 ÚLTIMO STATUS CONHECIDO:`);
    console.log(`  ✅ Passaram: ${passed}`);
    console.log(`  ❌ Falharam: ${failed}`);
    console.log(`  ⏭️  Pulados: ${skipped}`);
    console.log(`  📊 Total processado: ${passed + failed + skipped}`);
  }

  console.log(`\n💡 DICAS PARA OTIMIZAR:`);
  console.log(`  - Aumente o timeout: TEST_TIMEOUT=180 npm run ...`);
  console.log(`  - Execute menos testes: npm run test:fast`);
  console.log(`  - Verifique testes específicos que podem estar travando`);

  // Mata o processo e todos os filhos
  try {
    if (isWindows) {
      // No Windows, usa taskkill para processos node
      spawn("taskkill", ["/f", "/t", "/pid", child.pid], {
        stdio: "inherit",
        detached: true,
      });
    } else {
      process.kill(-child.pid); // Mata o grupo de processos
    }
  } catch (err) {
    console.log("⚠️  Erro ao matar processo:", err.message);
  }

  setTimeout(() => process.exit(1), 1000); // Dá tempo para cleanup
}, TIMEOUT_SECONDS * 1000);

const child = spawn(command, finalArgs, {
  stdio: ["inherit", "pipe", "pipe"], // stdin herda, stdout/stderr capturam
  cwd: path.resolve(__dirname, ".."),
  detached: true, // Permite matar processos filhos
});

// Captura stdout
child.stdout.on("data", (data) => {
  const output = data.toString();
  stdoutBuffer += output;
  process.stdout.write(output); // Mostra em tempo real
});

// Captura stderr
child.stderr.on("data", (data) => {
  const output = data.toString();
  stderrBuffer += output;
  hasErrors = true;
  process.stderr.write(output); // Mostra em tempo real
});

// Função para finalizar limpo
const cleanup = (code = 0) => {
  if (finished) return;
  finished = true;

  clearTimeout(timeout);

  console.log("\n" + "─".repeat(80));
  console.log("📊 ANÁLISE DE PERFORMANCE - TEMPOS DE EXECUÇÃO");

  // Preparar dados para análise
  const lines = stdoutBuffer.split("\n");

  // Tenta ler o arquivo JSON de resultados para análise detalhada
  try {
    const fs = require("fs");
    const path = require("path");
    const resultsPath = path.join(
      process.cwd(),
      "test-results",
      "results.json",
    );

    // Criar diretório se não existir
    const dir = path.dirname(resultsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));

      console.log("\n⏱️  TEMPOS DETALHADOS DOS TESTES:");
      results.suites.forEach((suite) => {
        if (suite.specs) {
          suite.specs.forEach((spec) => {
            if (spec.tests) {
              spec.tests.forEach((test) => {
                if (test.results && test.results.length > 0) {
                  const result = test.results[0];
                  const duration = result.duration || 0;
                  const timeFormatted =
                    duration >= 1000
                      ? `${(duration / 1000).toFixed(2)}s`
                      : `${duration}ms`;
                  const status =
                    duration > 5000 ? "🐌" : duration > 2000 ? "⚡" : "🚀";
                  const outcome =
                    test.outcome === "skipped"
                      ? "⏭️"
                      : result.status === "passed"
                        ? "✅"
                        : "❌";
                  console.log(
                    `  ${status} ${timeFormatted} ${outcome} ${spec.title} › ${test.title}`,
                  );
                }
              });
            }
          });
        }
      });
    }
  } catch (err) {
    // Fallback para análise do stdout se JSON falhar
    console.log("\n⏱️  ANÁLISE BÁSICA (JSON não disponível):");

    const testTimeLines = lines.filter(
      (line) =>
        /\d+\.\d+s$/.test(line.trim()) &&
        (line.includes("›") ||
          line.includes("test(") ||
          line.includes("describe(")),
    );

    testTimeLines.forEach((line, i) => {
      const timeMatch = line.match(/(\d+\.\d+)s$/);
      if (timeMatch) {
        const time = parseFloat(timeMatch[1]);
        const timeFormatted = `${time}s`;
        const cleanLine = line.replace(/\s*\d+\.\d+s$/, "").trim();
        const status = time > 5 ? "🐌" : time > 2 ? "⚡" : "🚀";
        console.log(`  ${status} ${timeFormatted} - ${cleanLine}`);
      }
    });
  }

  // Estatísticas gerais
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

  // Procurar por tempo total nos logs
  const totalTimeMatch = stdoutBuffer.match(/Total time: ([\d.]+)([sm])/);
  if (totalTimeMatch) {
    const time = parseFloat(totalTimeMatch[1]);
    const unit = totalTimeMatch[2];
    console.log(`  ⏱️  Tempo total: ${time}${unit}`);
  } else {
    // Fallback para tempo aproximado
    const approxMatch = stdoutBuffer.match(/(\d+\.\d+)s/);
    if (approxMatch) {
      console.log(`  ⏱️  Tempo aproximado: ${approxMatch[1]}s`);
    }
  }

  if (code !== 0 || hasErrors) {
    console.log("\n❌ ERROS ENCONTRADOS:");

    if (stderrBuffer.trim()) {
      console.log("\n🔴 STDERR:");
      console.log(stderrBuffer.trim());
    }

    // Testes que falharam
    const failedTests = lines.filter(
      (line) =>
        line.includes("failed") ||
        line.includes("Error:") ||
        (line.includes("expect(") && line.includes("failed")),
    );

    if (failedTests.length > 0) {
      console.log("\n📋 TESTES QUE FALHARAM:");
      failedTests.slice(-5).forEach((line, i) => {
        console.log(`  ${i + 1}. ${line.trim()}`);
      });
    }
  } else {
    console.log("\n✅ Todos os testes passaram sem erros!");
  }

  console.log(`\n🏁 Processo finalizado com código: ${code}`);
  process.exit(code);
};

// Limpa timeout se processo terminar (normalmente ou com erro)
child.on("close", (code) => cleanup(code));
child.on("exit", (code) => cleanup(code));

child.on("error", (err) => {
  console.error("❌ Erro ao executar playwright:", err);
  cleanup(1);
});

// Trata sinais de interrupção (Ctrl+C)
process.on("SIGINT", () => {
  console.log(
    "\n🛑 Interrupção detectada (Ctrl+C). Aguardando conclusão natural...",
  );
  // Não força saída, apenas informa ao usuário
});
