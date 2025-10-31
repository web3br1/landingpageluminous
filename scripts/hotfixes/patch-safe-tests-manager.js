#!/usr/bin/env node

/**
 * Hotfix H1: Build Breaker — safe-tests-manager
 * Adicionar propriedade 'e2e' ao tipo de cobertura e corrigir referências
 */

const fs = require("fs");
const path = require("path");

const safeTestsManagerPath = path.join(
  process.cwd(),
  "tools",
  "tdd",
  "signals",
  "safe-tests-manager.ts",
);

console.log("🔧 Aplicando hotfix H1: safe-tests-manager build breaker");

try {
  let content = fs.readFileSync(safeTestsManagerPath, "utf8");

  // 1. Adicionar inicialização do e2e no subset
  content = content.replace(
    /coverage: \{\s*unit: 0,\s*component: 0,\s*integration: 0,\s*total: 0\s*\}/,
    "coverage: {\n        unit: 0,\n        component: 0,\n        integration: 0,\n        e2e: 0,\n        total: 0\n      }",
  );

  // 2. Adicionar atribuição para e2e na criação do subset
  content = content.replace(
    /\/\/ Atualiza cobertura\s*subset\.coverage\[candidate\.category\] =\s*\(subset\.coverage\[candidate\.category\] \|\| 0\) \+ 1\s*subset\.coverage\.total\+\+/,
    `      // Atualiza cobertura
      subset.coverage[candidate.category] =
        (subset.coverage[candidate.category] || 0) + 1
      subset.coverage.total++`,
  );

  // 3. Adicionar cálculo de e2e na atualização baseada no histórico
  content = content.replace(
    /subset\.coverage\.integration = subset\.tests\.filter\(t => t\.category === 'integration'\)\.length/,
    `    subset.coverage.integration = subset.tests.filter(t => t.category === 'integration').length
    subset.coverage.e2e = subset.tests.filter(t => t.category === 'e2e').length`,
  );

  fs.writeFileSync(safeTestsManagerPath, content);

  console.log("✅ Hotfix H1 aplicado com sucesso");
  console.log("📝 Alterações:");
  console.log("   - Adicionada propriedade e2e ao coverage");
  console.log("   - Corrigida atribuição de coverage por categoria");
  console.log("   - Adicionado cálculo de e2e no updateSubsetFromHistory");
} catch (error) {
  console.error("❌ Erro ao aplicar hotfix H1:", error.message);
  process.exit(1);
}
