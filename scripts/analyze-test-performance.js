#!/usr/bin/env node

/**
 * Analisador de Performance de Testes
 * Gera relatórios detalhados e recomendações de otimização
 */

const fs = require("fs");
const path = require("path");

// Thresholds de performance (em ms)
const PERFORMANCE_THRESHOLDS = {
  excellent: 2000, // < 2s
  good: 5000, // 2-5s
  acceptable: 10000, // 5-10s
  slow: 30000, // 10-30s
  critical: 60000, // > 60s (problema)
};

// Categorias de teste para análise
const TEST_CATEGORIES = {
  functional: /functional/i,
  e2e: /e2e/i,
  visual: /visual.*regression/i,
  performance: /performance/i,
  accessibility: /a11y|accessibility/i,
  hydration: /hydration/i,
  ssr: /ssr/i,
};

/**
 * Analisa arquivo de resultados do Playwright
 */
function analyzeResults(resultsPath) {
  if (!fs.existsSync(resultsPath)) {
    console.error(`❌ Arquivo de resultados não encontrado: ${resultsPath}`);
    return null;
  }

  try {
    const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
    return parseResults(results);
  } catch (err) {
    console.error(`❌ Erro ao ler resultados: ${err.message}`);
    return null;
  }
}

/**
 * Processa dados dos resultados
 */
function parseResults(results) {
  const testData = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    tests: [],
    categories: {},
  };

  // Inicializar categorias
  Object.keys(TEST_CATEGORIES).forEach((cat) => {
    testData.categories[cat] = {
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      tests: [],
    };
  });

  // Processar suites e specs
  results.suites?.forEach((suite) => {
    suite.specs?.forEach((spec) => {
      spec.tests?.forEach((test) => {
        if (test.results?.length > 0) {
          const result = test.results[0];
          const duration = result.duration || 0;
          const testName = `${spec.title} › ${test.title}`;

          // Dados básicos
          testData.total++;
          if (result.status === "passed") testData.passed++;
          else if (result.status === "failed") testData.failed++;
          else if (result.status === "skipped") testData.skipped++;

          testData.duration += duration;

          // Categorizar teste
          const category = categorizeTest(testName);
          if (testData.categories[category]) {
            testData.categories[category].count++;
            testData.categories[category].totalDuration += duration;
            testData.categories[category].tests.push({
              name: testName,
              duration,
              status: result.status,
            });
          }

          // Adicionar à lista geral
          testData.tests.push({
            name: testName,
            duration,
            status: result.status,
            category,
          });
        }
      });
    });
  });

  // Calcular médias
  Object.keys(testData.categories).forEach((cat) => {
    const catData = testData.categories[cat];
    if (catData.count > 0) {
      catData.avgDuration = catData.totalDuration / catData.count;
    }
  });

  return testData;
}

/**
 * Categoriza teste baseado no nome
 */
function categorizeTest(testName) {
  for (const [category, pattern] of Object.entries(TEST_CATEGORIES)) {
    if (pattern.test(testName)) {
      return category;
    }
  }
  return "other";
}

/**
 * Classifica performance do teste
 */
function classifyPerformance(duration) {
  if (duration < PERFORMANCE_THRESHOLDS.excellent) return "excellent";
  if (duration < PERFORMANCE_THRESHOLDS.good) return "good";
  if (duration < PERFORMANCE_THRESHOLDS.acceptable) return "acceptable";
  if (duration < PERFORMANCE_THRESHOLDS.slow) return "slow";
  return "critical";
}

/**
 * Gera relatório detalhado
 */
function generateReport(testData) {
  console.log("🚀 RELATÓRIO DE PERFORMANCE DOS TESTES");
  console.log("=".repeat(60));

  // Estatísticas gerais
  console.log("\n📊 ESTATÍSTICAS GERAIS:");
  console.log(`   Total de testes: ${testData.total}`);
  console.log(`   ✅ Passaram: ${testData.passed}`);
  console.log(`   ❌ Falharam: ${testData.failed}`);
  console.log(`   ⏭️  Pulados: ${testData.skipped}`);
  console.log(`   ⏱️  Tempo total: ${(testData.duration / 1000).toFixed(2)}s`);
  console.log(
    `   📈 Taxa de sucesso: ${((testData.passed / testData.total) * 100).toFixed(1)}%`,
  );

  // Distribuição por categoria
  console.log("\n📂 DESEMPENHO POR CATEGORIA:");
  Object.entries(testData.categories)
    .filter(([, data]) => data.count > 0)
    .sort(([, a], [, b]) => b.totalDuration - a.totalDuration)
    .forEach(([category, data]) => {
      const avgTime = (data.avgDuration / 1000).toFixed(2);
      const totalTime = (data.totalDuration / 1000).toFixed(2);
      console.log(
        `   ${category.toUpperCase()}: ${data.count} testes, ${avgTime}s médio, ${totalTime}s total`,
      );
    });

  // Testes mais lentos
  console.log("\n🐌 TOP 10 TESTES MAIS LENTOS:");
  testData.tests
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10)
    .forEach((test, i) => {
      const time = (test.duration / 1000).toFixed(2);
      const perf = classifyPerformance(test.duration);
      const emoji = getPerformanceEmoji(perf);
      const status = getStatusEmoji(test.status);
      console.log(`   ${i + 1}. ${emoji} ${time}s ${status} ${test.name}`);
    });

  // Distribuição de performance
  const performanceDist = {
    excellent: 0,
    good: 0,
    acceptable: 0,
    slow: 0,
    critical: 0,
  };

  testData.tests.forEach((test) => {
    const perf = classifyPerformance(test.duration);
    performanceDist[perf]++;
  });

  console.log("\n📈 DISTRIBUIÇÃO DE PERFORMANCE:");
  Object.entries(performanceDist)
    .filter(([, count]) => count > 0)
    .forEach(([perf, count]) => {
      const percentage = ((count / testData.total) * 100).toFixed(1);
      const emoji = getPerformanceEmoji(perf);
      console.log(
        `   ${emoji} ${perf.toUpperCase()}: ${count} testes (${percentage}%)`,
      );
    });

  // Recomendações
  generateRecommendations(testData);
}

/**
 * Gera emoji baseado na performance
 */
function getPerformanceEmoji(performance) {
  const emojis = {
    excellent: "🚀",
    good: "⚡",
    acceptable: "🟡",
    slow: "🐌",
    critical: "🔴",
  };
  return emojis[performance] || "❓";
}

/**
 * Gera emoji baseado no status
 */
function getStatusEmoji(status) {
  const emojis = {
    passed: "✅",
    failed: "❌",
    skipped: "⏭️",
  };
  return emojis[status] || "❓";
}

/**
 * Gera recomendações de otimização
 */
function generateRecommendations(testData) {
  console.log("\n💡 RECOMENDAÇÕES DE OTIMIZAÇÃO:");

  const recommendations = [];

  // Análise de testes críticos
  const criticalTests = testData.tests.filter(
    (t) => classifyPerformance(t.duration) === "critical",
  );
  if (criticalTests.length > 0) {
    recommendations.push(
      `🔴 ${criticalTests.length} testes críticos (>60s) - investigar e otimizar`,
    );
  }

  // Análise de testes lentos
  const slowTests = testData.tests.filter(
    (t) => classifyPerformance(t.duration) === "slow",
  );
  if (slowTests.length > testData.total * 0.1) {
    recommendations.push(
      `🐌 ${slowTests.length} testes lentos - considerar paralelização ou simplificação`,
    );
  }

  // Análise de falhas
  if (testData.failed > 0) {
    recommendations.push(
      `❌ ${testData.failed} testes falhando - priorizar correção para CI`,
    );
  }

  // Análise de categorias desbalanceadas
  const categoryTimes = Object.entries(testData.categories)
    .filter(([, data]) => data.count > 0)
    .map(([cat, data]) => ({ category: cat, avgTime: data.avgDuration }));

  if (categoryTimes.length > 1) {
    const maxTime = Math.max(...categoryTimes.map((c) => c.avgTime));
    const minTime = Math.min(...categoryTimes.map((c) => c.avgTime));

    if (maxTime / minTime > 3) {
      const slowCat = categoryTimes.find((c) => c.avgTime === maxTime);
      recommendations.push(
        `⚖️ Categoria ${slowCat.category} muito mais lenta - balancear carga`,
      );
    }
  }

  // Recomendações gerais
  if (testData.total > 50) {
    recommendations.push(
      "📊 Suite grande - considerar divisão em pipelines paralelas",
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ Performance satisfatória - manter monitoramento");
  }

  recommendations.forEach((rec) => console.log(`   ${rec}`));

  // Sugestões específicas por categoria
  console.log("\n🎯 OTIMIZAÇÕES POR CATEGORIA:");
  Object.entries(testData.categories)
    .filter(([, data]) => data.count > 0)
    .forEach(([category, data]) => {
      const avgTime = data.avgDuration / 1000;
      const suggestions = getCategorySuggestions(category, avgTime, data.count);
      if (suggestions) {
        console.log(`   ${category.toUpperCase()}: ${suggestions}`);
      }
    });
}

/**
 * Sugestões específicas por categoria
 */
function getCategorySuggestions(category, avgTime, count) {
  const suggestions = {
    performance:
      avgTime > 30
        ? "Considerar cache de métricas ou simulações mais leves"
        : null,
    visual: avgTime > 15 ? "Otimizar screenshots ou usar paralelização" : null,
    e2e:
      avgTime > 20 ? "Revisar waits desnecessários ou dividir journeys" : null,
    accessibility:
      avgTime > 10
        ? "Verificar se todas as verificações são necessárias"
        : null,
    functional: avgTime > 5 ? "Possível problema de setup ou fixtures" : null,
  };

  return suggestions[category];
}

/**
 * Salva relatório em arquivo
 */
function saveReport(testData, outputPath) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testData.total,
      passed: testData.passed,
      failed: testData.failed,
      skipped: testData.skipped,
      totalDuration: testData.duration,
      successRate: (testData.passed / testData.total) * 100,
    },
    categories: testData.categories,
    slowestTests: testData.tests
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 20)
      .map((t) => ({
        name: t.name,
        duration: t.duration,
        category: t.category,
        status: t.status,
      })),
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Relatório salvo em: ${outputPath}`);
}

/**
 * Função principal
 */
function main() {
  const args = process.argv.slice(2);
  const resultsPath = args[0] || "./test-results/results.json";
  const outputPath = args[1] || "./test-results/performance-report.json";

  console.log(`📊 Analisando resultados: ${resultsPath}`);

  const testData = analyzeResults(resultsPath);
  if (!testData) {
    process.exit(1);
  }

  generateReport(testData);
  saveReport(testData, outputPath);
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  analyzeResults,
  generateReport,
  classifyPerformance,
  categorizeTest,
};
