#!/usr/bin/env node

/**
 * Informações sobre os Lotes de Testes Playwright
 * Executa: node scripts/test-batches-info.js
 */

const batches = {
  "core-critical": {
    name: "🏗️ Core/Critical",
    description: "Testes essenciais de funcionamento (hidratação, SSR)",
    tests: "~5 testes",
    duration: "~30s",
    critical: true,
    ci: true,
  },
  "landing-page": {
    name: "🏠 Landing Page",
    description: "Funcionalidades da landing page e formulários",
    tests: "~15 testes",
    duration: "~2-3min",
    critical: true,
    ci: true,
  },
  accessibility: {
    name: "♿ Accessibility",
    description: "Conformidade WCAG 2.1 AA (navegação, contraste, semântica)",
    tests: "~40 testes",
    duration: "~4-5min",
    critical: true,
    ci: true,
  },
  performance: {
    name: "⚡ Performance",
    description: "Core Web Vitals (LCP, CLS, INP, TBT)",
    tests: "~25 testes",
    duration: "~6-8min",
    critical: false,
    ci: true,
  },
  "visual-regression": {
    name: "👁️ Visual Regression",
    description: "Comparação visual de screenshots",
    tests: "~20 testes",
    duration: "~5-7min",
    critical: false,
    ci: false,
  },
  "critical-flows": {
    name: "🔄 Critical Flows",
    description: "Fluxos críticos: signup, trial, checkout, navegação",
    tests: "~30 testes",
    duration: "~8-10min",
    critical: true,
    ci: true,
  },
  "stress-load": {
    name: "📊 Stress/Load",
    description: "Carga, vazamentos de memória, falhas de rede",
    tests: "~10 testes",
    duration: "~15-20min",
    critical: false,
    ci: false,
  },
  integration: {
    name: "🔗 Integration",
    description: "APIs, serviços externos, CMS",
    tests: "~5 testes",
    duration: "~2-3min",
    critical: false,
    ci: true,
  },
  "cross-browser": {
    name: "🌐 Cross-Browser",
    description: "Compatibilidade Chrome, Firefox, Safari",
    tests: "~3 testes",
    duration: "~1-2min",
    critical: false,
    ci: false,
  },
};

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0
    ? `${minutes}m${remainingSeconds}s`
    : `${minutes}m`;
}

function printHeader() {
  console.log("🎭 LOTES DE TESTES PLAYWRIGHT - LANDING PAGE SAAS\n");
  console.log(
    "📋 Estratégia de execução organizada por prioridade e tipo de teste\n",
  );
}

function printTable() {
  console.log(
    "┌─────────────────┬─────────────────────┬─────────────┬──────────┬─────────┬─────┐",
  );
  console.log(
    "│ Lote           │ Descrição          │ Testes     │ Duração │ Crítico │ CI  │",
  );
  console.log(
    "├─────────────────┼─────────────────────┼─────────────┼──────────┼─────────┼─────┤",
  );

  Object.entries(batches).forEach(([key, batch]) => {
    const name = batch.name.padEnd(15);
    const desc = batch.description.substring(0, 19).padEnd(19);
    const tests = batch.tests.padEnd(11);
    const duration = batch.duration.padEnd(8);
    const critical = (batch.critical ? "✅" : "❌").padEnd(7);
    const ci = batch.ci ? "✅" : "❌";

    console.log(
      `│ ${key.padEnd(15)} │ ${desc} │ ${tests} │ ${duration} │ ${critical} │ ${ci} │`,
    );
  });

  console.log(
    "└─────────────────┴─────────────────────┴─────────────┴──────────┴─────────┴─────┘\n",
  );
}

function printCommands() {
  console.log("🚀 COMANDOS DISPONÍVEIS:\n");

  console.log("📦 LOTES INDIVIDUAIS:");
  Object.keys(batches).forEach((key) => {
    console.log(`  pnpm test:batch:${key}`);
  });

  console.log("\n🎯 EXECUÇÃO SEQUENCIAL:");
  console.log(
    "  pnpm test:batches:essential    # Core + Landing + A11y (recomendado)",
  );
  console.log("  pnpm test:batches:all         # Todos os lotes críticos");
  console.log("  pnpm test:batches:extended    # Todos + Stress + Integration");
  console.log(
    "  pnpm test:batches:full        # Tudo, incluindo cross-browser",
  );

  console.log("\n⚡ EXECUÇÃO PARALELA (CI):");
  console.log("  pnpm test:parallel:fast       # Essenciais em paralelo");
  console.log("  pnpm test:parallel:complete   # Essenciais + Critical Flows");

  console.log("\n📊 MONITORAMENTO:");
  console.log(
    "  pnpm test:timing              # Análise de tempos de execução",
  );
  console.log(
    "  pnpm test:smart               # Execução inteligente baseada em mudanças",
  );
}

function printStrategy() {
  console.log("🎯 ESTRATÉGIAS RECOMENDADAS:\n");

  console.log("🔥 DESENVOLVIMENTO RÁPIDO:");
  console.log(
    "  1. pnpm test:batch:core           # Verifica funcionamento básico",
  );
  console.log(
    "  2. pnpm test:batch:landing        # Testa funcionalidades principais",
  );
  console.log("  3. pnpm test:batches:essential    # Suite completa essencial");

  console.log("\n🏗️ PR/CI CONTÍNUO:");
  console.log(
    "  1. pnpm test:batches:essential    # Testes críticos (5-10min)",
  );
  console.log("  2. pnpm test:batches:all         # Suite completa (20-30min)");
  console.log(
    "  3. pnpm test:parallel:complete   # Paralelo para CI otimizado",
  );

  console.log("\n🌙 RELEASE/PRE-PROD:");
  console.log(
    "  1. pnpm test:batches:extended    # Testes estendidos (30-40min)",
  );
  console.log("  2. pnpm test:batches:full        # Suite completa (45-60min)");

  console.log("\n⚠️  NOTAS:");
  console.log(
    "  • Testes de Stress/Load são pesados e podem afetar outros processos",
  );
  console.log("  • Visual Regression requer screenshots baseline atualizados");
  console.log("  • Cross-browser testa apenas funcionalidades críticas");
  console.log(
    "  • Todos os lotes usam Chrome por padrão, exceto cross-browser",
  );
}

function main() {
  printHeader();
  printTable();
  printCommands();
  printStrategy();

  console.log("\n💡 DICAS:");
  console.log("  • Use --reporter=line para output mais limpo");
  console.log("  • Use --workers=N para controlar paralelismo");
  console.log('  • Use --grep="pattern" para executar testes específicos');
  console.log("  • Use --project=lote para executar apenas um lote");
  console.log("  • Use --headed para ver testes em execução");
}

if (require.main === module) {
  main();
}

module.exports = { batches };
