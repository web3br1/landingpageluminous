#!/usr/bin/env node

/**
 * Consolidator de Relatórios de Testes
 * Estratégia: Unificar métricas de Vitest + Playwright em relatório único
 */

const fs = require("fs");
const path = require("path");

class TestReportConsolidator {
  constructor() {
    this.reportsDir = path.join(process.cwd(), "test-results");
    this.ensureReportsDir();
  }

  ensureReportsDir() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  loadJsonReport(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
      }
    } catch (err) {
      console.warn(`⚠️  Erro ao carregar relatório ${filePath}:`, err.message);
    }
    return null;
  }

  collectAllReports() {
    const reports = {};

    // Vitest reports (por lote)
    const vitestBatches = [
      "vitest-unit",
      "vitest-components",
      "vitest-lib",
      "vitest-dom",
      "vitest-utils",
      "vitest-integration",
      "vitest-browser",
      "vitest-ssr",
      "vitest-a11y",
      "vitest-hydration",
    ];

    vitestBatches.forEach((batch) => {
      const reportPath = path.join(this.reportsDir, `${batch}.json`);
      const report = this.loadJsonReport(reportPath);
      if (report) {
        reports[batch] = { type: "vitest", data: report };
      }
    });

    // Playwright reports (por projeto)
    const playwrightProjects = [
      "core-critical",
      "landing-page",
      "accessibility",
      "performance",
      "visual-regression",
      "critical-flows",
      "stress-load",
      "integration",
      "cross-browser",
    ];

    playwrightProjects.forEach((project) => {
      const reportPath = path.join(
        this.reportsDir,
        `playwright-${project}.json`,
      );
      const report = this.loadJsonReport(reportPath);
      if (report) {
        reports[`playwright-${project}`] = { type: "playwright", data: report };
      }
    });

    return reports;
  }

  parseVitestReport(report) {
    if (!report || !report.testResults) return null;

    const suites = report.testResults;
    let totalTests = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let duration = 0;

    suites.forEach((suite) => {
      if (suite.testResults) {
        suite.testResults.forEach((test) => {
          totalTests++;
          duration += test.duration || 0;

          switch (test.status) {
            case "passed":
              passed++;
              break;
            case "failed":
              failed++;
              break;
            case "skipped":
              skipped++;
              break;
          }
        });
      }
    });

    return {
      totalTests,
      passed,
      failed,
      skipped,
      duration,
      successRate: totalTests > 0 ? (passed / totalTests) * 100 : 0,
    };
  }

  parsePlaywrightReport(report) {
    if (!report || !report.suites) return null;

    let totalTests = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let duration = 0;

    function traverseSuites(suites) {
      suites.forEach((suite) => {
        if (suite.specs) {
          suite.specs.forEach((spec) => {
            if (spec.tests) {
              spec.tests.forEach((test) => {
                if (test.results && test.results.length > 0) {
                  const result = test.results[0];
                  totalTests++;
                  duration += result.duration || 0;

                  switch (result.status) {
                    case "passed":
                      passed++;
                      break;
                    case "failed":
                      failed++;
                      break;
                    case "skipped":
                      skipped++;
                      break;
                  }
                }
              });
            }
          });
        }
        if (suite.suites) {
          traverseSuites(suite.suites);
        }
      });
    }

    traverseSuites(report.suites);

    return {
      totalTests,
      passed,
      failed,
      skipped,
      duration,
      successRate: totalTests > 0 ? (passed / totalTests) * 100 : 0,
    };
  }

  consolidateReports() {
    const reports = this.collectAllReports();
    const consolidated = {
      timestamp: new Date().toISOString(),
      summary: {
        vitest: {
          totalTests: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0,
        },
        playwright: {
          totalTests: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0,
        },
        overall: {
          totalTests: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0,
        },
      },
      batches: {},
    };

    Object.entries(reports).forEach(([batchKey, { type, data }]) => {
      let metrics = null;

      if (type === "vitest") {
        metrics = this.parseVitestReport(data);
      } else if (type === "playwright") {
        metrics = this.parsePlaywrightReport(data);
      }

      if (metrics) {
        consolidated.batches[batchKey] = {
          type,
          metrics,
          status:
            metrics.failed > 0
              ? "failed"
              : metrics.passed > 0
                ? "passed"
                : "empty",
        };

        // Acumular no summary
        consolidated.summary[type].totalTests += metrics.totalTests;
        consolidated.summary[type].passed += metrics.passed;
        consolidated.summary[type].failed += metrics.failed;
        consolidated.summary[type].skipped += metrics.skipped;
        consolidated.summary[type].duration += metrics.duration;

        consolidated.summary.overall.totalTests += metrics.totalTests;
        consolidated.summary.overall.passed += metrics.passed;
        consolidated.summary.overall.failed += metrics.failed;
        consolidated.summary.overall.skipped += metrics.skipped;
        consolidated.summary.overall.duration += metrics.duration;
      }
    });

    // Calcular taxas de sucesso
    Object.keys(consolidated.summary).forEach((key) => {
      const summary = consolidated.summary[key];
      summary.successRate =
        summary.totalTests > 0
          ? (summary.passed / summary.totalTests) * 100
          : 0;
    });

    return consolidated;
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes}m${remainingSeconds}s`
      : `${minutes}m`;
  }

  generateReport() {
    const data = this.consolidateReports();

    let report = "";
    report += "🧪 RELATÓRIO CONSOLIDADO DE TESTES\n";
    report += "=".repeat(60) + "\n\n";

    report += `📅 Timestamp: ${new Date(data.timestamp).toLocaleString("pt-BR")}\n\n`;

    // Summary geral
    const overall = data.summary.overall;
    report += "📊 RESUMO GERAL:\n";
    report += `  ✅ Passaram: ${overall.passed}\n`;
    report += `  ❌ Falharam: ${overall.failed}\n`;
    report += `  ⏭️  Pulados: ${overall.skipped}\n`;
    report += `  📊 Total: ${overall.totalTests}\n`;
    report += `  ⏱️  Tempo total: ${this.formatDuration(overall.duration)}\n`;
    report += `  📈 Taxa de sucesso: ${overall.successRate.toFixed(1)}%\n\n`;

    // Summary por tipo
    report += "📋 POR TIPO DE TESTE:\n";
    Object.entries(data.summary).forEach(([type, summary]) => {
      if (type !== "overall" && summary.totalTests > 0) {
        const typeName =
          type === "vitest" ? "🔬 Vitest (Unitários)" : "🎭 Playwright (E2E)";
        report += `  ${typeName}:\n`;
        report += `    📊 Total: ${summary.totalTests} | ✅ ${summary.passed} | ❌ ${summary.failed} | ⏱️ ${this.formatDuration(summary.duration)}\n`;
      }
    });
    report += "\n";

    // Detalhes por lote
    report += "🎯 DETALHES POR LOTE:\n";
    Object.entries(data.batches).forEach(
      ([batchKey, { type, metrics, status }]) => {
        const statusIcon =
          status === "passed" ? "✅" : status === "failed" ? "❌" : "⏭️";
        const typeIcon = type === "vitest" ? "🔬" : "🎭";
        const duration = this.formatDuration(metrics.duration);
        const successRate = metrics.successRate.toFixed(1);

        report += `  ${statusIcon} ${typeIcon} ${batchKey}:\n`;
        report += `    📊 ${metrics.totalTests} testes | ✅ ${metrics.passed} | ❌ ${metrics.failed} | ⏱️ ${duration} | 📈 ${successRate}%\n`;
      },
    );

    return report;
  }

  saveReport() {
    const report = this.generateReport();
    const reportPath = path.join(this.reportsDir, "consolidated-report.txt");
    fs.writeFileSync(reportPath, report);
    console.log(`💾 Relatório salvo em: ${reportPath}`);
    return reportPath;
  }

  printReport() {
    const report = this.generateReport();
    console.log(report);
  }

  getSummary() {
    const data = this.consolidateReports();
    return {
      totalTests: data.summary.overall.totalTests,
      passed: data.summary.overall.passed,
      failed: data.summary.overall.failed,
      skipped: data.summary.overall.skipped,
      duration: data.summary.overall.duration,
      successRate: data.summary.overall.successRate,
      batchesCount: Object.keys(data.batches).length,
      vitestTests: data.summary.vitest.totalTests,
      playwrightTests: data.summary.playwright.totalTests,
    };
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const consolidator = new TestReportConsolidator();

  switch (command) {
    case "print":
      consolidator.printReport();
      break;

    case "save":
      const path = consolidator.saveReport();
      console.log(`✅ Relatório salvo com sucesso`);
      break;

    case "summary":
      const summary = consolidator.getSummary();
      console.log(JSON.stringify(summary, null, 2));
      break;

    case "check":
      const summaryCheck = consolidator.getSummary();
      const hasFailures = summaryCheck.failed > 0;
      console.log(
        `${hasFailures ? "❌" : "✅"} ${summaryCheck.failed} falhas encontradas`,
      );
      process.exit(hasFailures ? 1 : 0);

    default:
      console.log(`
📊 CONSOLIDADOR DE RELATÓRIOS DE TESTES

📖 USO:
  node scripts/test-report-consolidator.js <comando>

📋 COMANDOS:
  print     - Exibe relatório consolidado no terminal
  save      - Salva relatório em arquivo
  summary   - Retorna resumo em JSON
  check     - Verifica se há falhas (código de saída)

📝 EXEMPLOS:
  node scripts/test-report-consolidator.js print
  node scripts/test-report-consolidator.js save
  node scripts/test-report-consolidator.js summary
  node scripts/test-report-consolidator.js check
`);
  }
}

if (require.main === module) {
  main();
}

module.exports = TestReportConsolidator;
