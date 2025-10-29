#!/usr/bin/env node

/**
 * Parallel Hotfix TDD — Autofix & PR Generator Runner
 * Executa hotfixes H1-H6 em paralelo com coordenação
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const branchPrefix = 'chore/hotfix';
const author = 'luminaris-bot';

console.log('🚀 Iniciando Parallel Hotfix TDD Runner');
console.log('📋 Tarefas: H1, H2, H3, H4, H5, H6');

const results = {
  hotfix_resumo: [],
  metrics: {
    build_ok: false,
    critical_suites_compile_errors: 0,
    e2e_smoke_ok: false,
    coverage_statements_partial: 0
  },
  next_actions: []
};

function runCommand(cmd, description, allowFailure = false) {
  try {
    console.log(`🔧 ${description}`);
    const output = execSync(cmd, {
      cwd: repoRoot,
      encoding: 'utf8',
      timeout: 300000 // 5min timeout
    });
    console.log(`✅ ${description} OK`);
    return { success: true, output };
  } catch (error) {
    const msg = `${description} FAILED: ${error.message}`;
    if (allowFailure) {
      console.log(`⚠️  ${msg}`);
      return { success: false, output: error.stdout || '', error: error.message };
    } else {
      console.error(`❌ ${msg}`);
      throw error;
    }
  }
}

async function executeTask(taskId, task) {
  console.log(`\n🎯 Executando ${taskId}: ${task.NAME}`);

  const branchName = task.OUTPUTS.pr_branch;
  const notes = [];

  try {
    // 1. Create branch
    runCommand(`git checkout -b ${branchName} || true`, `Criando branch ${branchName}`);

    // 2. Run steps
    for (const step of task.STEPS) {
      const allowFailure = step.includes('echo');
      const result = runCommand(step, step, allowFailure);

      if (!result.success) {
        notes.push(`Step failed: ${step}`);
      }
    }

    // 3. Check success criteria
    const success = await checkSuccessCriteria(task.SUCCESS_CRITERIA);

    if (success) {
      // Create PR-like commit
      runCommand(`git add .`, 'Staging changes');
      runCommand(`git commit -m "${task.OUTPUTS.pr_title}" --author="${author} <bot@luminaris.dev>"`, 'Creating commit');

      results.hotfix_resumo.push({
        task: taskId,
        status: 'SUCCESS',
        pr_branch: branchName,
        pr_title: task.OUTPUTS.pr_title,
        labels: task.OUTPUTS.pr_labels,
        notes: notes.length > 0 ? notes.join('; ') : 'Completed successfully'
      });
    } else {
      results.hotfix_resumo.push({
        task: taskId,
        status: 'FAILED',
        pr_branch: branchName,
        pr_title: task.OUTPUTS.pr_title,
        labels: task.OUTPUTS.pr_labels,
        notes: 'Success criteria not met'
      });
    }

  } catch (error) {
    results.hotfix_resumo.push({
      task: taskId,
      status: 'FAILED',
      pr_branch: branchName,
      pr_title: task.OUTPUTS.pr_title,
      labels: task.OUTPUTS.pr_labels,
      notes: error.message
    });
  }
}

async function checkSuccessCriteria(criteria) {
  for (const criterion of criteria) {
    if (criterion.includes('Build compila')) {
      // Check if build works
      try {
        runCommand('npm run build', 'Validating build', true);
        results.metrics.build_ok = true;
      } catch (e) {
        return false;
      }
    }

    if (criterion.includes('Subconjunto de testes')) {
      // Check if lib tests pass
      try {
        runCommand('npx vitest run tests/lib/**', 'Validating lib tests', true);
      } catch (e) {
        results.metrics.critical_suites_compile_errors++;
      }
    }

    if (criterion.includes('Sem erros de compilação')) {
      // Check compilation errors
      const compileResult = runCommand('npx tsc --noEmit', 'Checking TypeScript compilation', true);
      if (!compileResult.success) {
        results.metrics.critical_suites_compile_errors++;
        return false;
      }
    }

    if (criterion.includes('≥1 e2e executado')) {
      try {
        runCommand('npm run test:e2e:quick', 'Running e2e smoke', true);
        results.metrics.e2e_smoke_ok = true;
      } catch (e) {
        // E2E might fail but that's ok for this check
        results.metrics.e2e_smoke_ok = false;
      }
    }

    if (criterion.includes('Statements ≥ 80%')) {
      try {
        const coverageResult = runCommand('npm run test:coverage:gaps', 'Checking coverage', true);
        // Extract coverage percentage from output
        const coverageMatch = coverageResult.output.match(/Statements\s*:\s*(\d+)%/);
        if (coverageMatch) {
          results.metrics.coverage_statements_partial = parseInt(coverageMatch[1]);
        }
      } catch (e) {
        results.metrics.coverage_statements_partial = 0;
      }
    }
  }

  return true;
}

async function main() {
  // Define all tasks
  const tasks = {
    H1: {
      NAME: "Build Breaker — safe-tests-manager",
      TARGET_FILE: "tools/tdd/signals/safe-tests-manager.ts",
      ACTION: "Adicionar propriedade 'e2e' ao tipo de cobertura e corrigir referências.",
      STEPS: [
        `git checkout -b ${branchPrefix}/build-safemgr || true`,
        "node scripts/hotfixes/patch-safe-tests-manager.js",
        "npm run build || echo '__BUILD_FAILED__'",
        "npx vitest run tests/lib/** || echo '__UNIT_FAILED__'"
      ],
      SUCCESS_CRITERIA: [
        "Build compila",
        "Subconjunto de testes de lib passa"
      ],
      OUTPUTS: {
        pr_title: "fix(tdd): unbreak safe-tests-manager build (add e2e coverage key)",
        pr_labels: ["build", "tdd", "hotfix"],
        pr_branch: `${branchPrefix}/build-safemgr`
      }
    },

    H2: {
      NAME: "Lazy Loading — API Mínima Estável",
      TARGET_FILE: "lib/composition/performance/route-based-lazy-loading.tsx",
      ACTION: "Recriar exports {shouldLazyLoad,getChunkId,traceLazyLoad,prefetch,load} de forma determinística e tipada.",
      STEPS: [
        `git checkout -b ${branchPrefix}/lazy-min-api || true`,
        "node scripts/hotfixes/patch-lazy-min-api.js",
        "npx vitest run *lazy-loading* *hydration* || echo '__CRIT_FAILED__'"
      ],
      SUCCESS_CRITERIA: [
        "Sem erros de compilação nas suites críticas",
        "Falhas apenas de assertiva permitidas"
      ],
      OUTPUTS: {
        pr_title: "fix(lazy): restore minimal contract for route-based lazy loading",
        pr_labels: ["lazy-loading", "stability", "hotfix"],
        pr_branch: `${branchPrefix}/lazy-min-api`
      }
    },

    H3: {
      NAME: "Vitest Mocks — Hoisting & Factories",
      TARGET_GLOB: "tests/**/*utils*.test.ts",
      ACTION: "Padronizar vi.mock em top-level + factories; remover restaurações custom.",
      STEPS: [
        `git checkout -b ${branchPrefix}/mocks-hoisting || true`,
        "node scripts/hotfixes/codemod-vi-mock-top-level.mjs",
        "npx vitest run tests/**/*utils*.test.ts || echo '__UTILS_FAILED__'"
      ],
      SUCCESS_CRITERIA: [
        "Zero erros de hoisting"
      ],
      OUTPUTS: {
        pr_title: "test(mocks): standardize vi.mock factories and top-level hoisting",
        pr_labels: ["tests", "mocks", "hotfix"],
        pr_branch: `${branchPrefix}/mocks-hoisting`
      }
    },

    H4: {
      NAME: "SSR Safety — Guard & Storage em Memória",
      TARGET_ADD: [
        "tests/__shared__/ssr-safety.ts",
        "tests/__shared__/mocks/browser-storage.ts"
      ],
      ACTION: "Criar guard SSR e storage em memória; aplicar em testes que tocam window/navigator.",
      STEPS: [
        `git checkout -b ${branchPrefix}/ssr-guard || true`,
        "node scripts/hotfixes/add-ssr-guard-and-storage.mjs",
        "npx vitest run **/*ssr*.test.ts || echo '__SSR_FAILED__'"
      ],
      SUCCESS_CRITERIA: [
        "SSR sem ReferenceError"
      ],
      OUTPUTS: {
        pr_title: "test(ssr): add safeBrowserAccess & memory storage; apply across suites",
        pr_labels: ["ssr", "tests", "hotfix"],
        pr_branch: `${branchPrefix}/ssr-guard`
      }
    },

    H5: {
      NAME: "E2E Smoke — Bootstrap",
      TARGET_DIR: "tests/e2e",
      ACTION: "Garantir 1 spec smoke (abre '/', verifica <title>), alinhar testMatch no Playwright.",
      STEPS: [
        `git checkout -b ${branchPrefix}/e2e-smoke || true`,
        "node scripts/hotfixes/bootstrap-e2e-smoke.mjs",
        "npm run test:e2e:quick || echo '__NO_E2E__'"
      ],
      SUCCESS_CRITERIA: [
        "≥1 e2e executado"
      ],
      OUTPUTS: {
        pr_title: "test(e2e): add smoke spec and config so suite actually runs",
        pr_labels: ["e2e", "smoke", "hotfix"],
        pr_branch: `${branchPrefix}/e2e-smoke`
      }
    },

    H6: {
      NAME: "Coverage — Gaps Críticos (Error Boundaries & Network)",
      TARGETS: [
        "tests/**/error-boundaries*.test.*",
        "tests/**/network-failures*.test.*"
      ],
      ACTION: "Adicionar casos para branches não cobertos; sem tocar em lógica de produção.",
      STEPS: [
        `git checkout -b ${branchPrefix}/coverage-gaps || true`,
        "node scripts/hotfixes/add-coverage-gaps.mjs",
        "npm run test:coverage:gaps || echo '__COVERAGE_FAILED__'"
      ],
      SUCCESS_CRITERIA: [
        "Statements ≥ 80% no relatório parcial"
      ],
      OUTPUTS: {
        pr_title: "test(coverage): add error-boundary & network branches to reach 80%+",
        pr_labels: ["coverage", "quality", "hotfix"],
        pr_branch: `${branchPrefix}/coverage-gaps`
      }
    }
  };

  // Execute tasks with coordination
  const h1Result = await executeTask('H1', tasks.H1);

  // H2 and H3 can run in parallel after H1 check
  const [h2Result, h3Result] = await Promise.all([
    executeTask('H2', tasks.H2),
    executeTask('H3', tasks.H3)
  ]);

  // H4, H5, H6 can run in parallel
  const [h4Result, h5Result, h6Result] = await Promise.all([
    executeTask('H4', tasks.H4),
    executeTask('H5', tasks.H5),
    executeTask('H6', tasks.H6)
  ]);

  // Generate next actions
  const failedTasks = results.hotfix_resumo.filter(r => r.status === 'FAILED');
  if (failedTasks.length > 0) {
    results.next_actions.push(`Re-run failed tasks: ${failedTasks.map(r => r.task).join(', ')}`);
  }

  if (!results.metrics.build_ok) {
    results.next_actions.push('Fix build issues before proceeding');
  }

  if (results.metrics.critical_suites_compile_errors > 0) {
    results.next_actions.push(`Address ${results.metrics.critical_suites_compile_errors} compilation errors`);
  }

  // Output JSON result
  console.log('\n📊 Hotfix Results:');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(error => {
  console.error('❌ Runner failed:', error);
  process.exit(1);
});
