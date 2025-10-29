#!/usr/bin/env node

/**
 * Basic Mutation Testing Simulator
 *
 * Simula mutation testing executando testes com modificações simples
 * em arquivos críticos para detectar testes fracos.
 *
 * Escopo reduzido: 3-5 arquivos críticos (lazy, error boundary, network handler)
 * Meta: Mutation score ≥ 25% nesta rodada
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class MutationTester {
  constructor() {
    this.criticalFiles = [
      "lib/composition/performance/route-based-lazy-loading.tsx",
      "lib/error/Boundary.tsx",
      "lib/utils/browser-storage.ts"
    ];
    this.results = {
      total: 0,
      killed: 0,
      survived: 0,
      mutations: []
    };
  }

  /**
   * Run mutation testing on critical files
   */
  async run() {
    console.log("🧬 Running Basic Mutation Testing...\n");

    for (const file of this.criticalFiles) {
      await this.testFileMutations(file);
    }

    this.displayResults();
    return this.results;
  }

  /**
   * Test mutations on a single file
   */
  async testFileMutations(filePath) {
    console.log(`🔬 Testing mutations on ${filePath}`);

    const content = fs.readFileSync(filePath, "utf8");
    const mutations = this.generateMutations(content);

    for (const mutation of mutations) {
      const mutatedContent = this.applyMutation(content, mutation);

      try {
        // Write mutated file
        fs.writeFileSync(filePath, mutatedContent);

        // Run tests
        const testCommand = `npx vitest run --config vitest.config.ts --reporter=json --testTimeout=10000`;
        const output = execSync(testCommand, { encoding: "utf8", timeout: 30000 });

        const testResults = JSON.parse(output);
        const { numFailedTests = 0 } = testResults;

        const killed = numFailedTests > 0;
        const survived = numFailedTests === 0;

        this.results.total++;
        if (killed) this.results.killed++;
        if (survived) this.results.survived++;

        this.results.mutations.push({
          file: filePath,
          mutation: mutation.description,
          killed,
          survived
        });

        console.log(`   ${killed ? "💀" : "🧟"} ${mutation.description}: ${killed ? "KILLED" : "SURVIVED"}`);

      } catch (error) {
        // Test execution failed - assume mutation was killed
        this.results.total++;
        this.results.killed++;

        this.results.mutations.push({
          file: filePath,
          mutation: mutation.description,
          killed: true,
          survived: false,
          error: (error as Error).message
        });

        console.log(`   💀 ${mutation.description}: KILLED (test execution failed)`);

      } finally {
        // Restore original file
        fs.writeFileSync(filePath, content);
      }
    }
  }

  /**
   * Generate simple mutations for a file
   */
  generateMutations(content) {
    const mutations = [];

    // Mutation 1: Flip boolean literals
    if (content.includes("true")) {
      mutations.push({
        description: "Flip 'true' to 'false'",
        type: "boolean_flip",
        pattern: /\btrue\b/g,
        replacement: "false"
      });
    }

    if (content.includes("false")) {
      mutations.push({
        description: "Flip 'false' to 'true'",
        type: "boolean_flip",
        pattern: /\bfalse\b/g,
        replacement: "true"
      });
    }

    // Mutation 2: Change comparison operators
    if (content.includes("===")) {
      mutations.push({
        description: "Change '===' to '!=='",
        type: "comparison_flip",
        pattern: /===/g,
        replacement: "!=="
      });
    }

    if (content.includes("!==")) {
      mutations.push({
        description: "Change '!==' to '==='",
        type: "comparison_flip",
        pattern: /!==/g,
        replacement: "==="
      });
    }

    // Mutation 3: Change arithmetic operators
    if (content.includes("+")) {
      mutations.push({
        description: "Change '+' to '-'",
        type: "arithmetic_flip",
        pattern: /\+(?![+=])/g, // Avoid += and ++
        replacement: "-"
      });
    }

    if (content.includes("-")) {
      mutations.push({
        description: "Change '-' to '+'",
        type: "arithmetic_flip",
        pattern: /-(?![-=])/g, // Avoid -= and --
        replacement: "+"
      });
    }

    // Mutation 4: Remove return statements (simple)
    if (content.includes("return")) {
      mutations.push({
        description: "Remove return statements",
        type: "return_removal",
        pattern: /^\s*return\s+[^;]+;/gm,
        replacement: "// return removed by mutation"
      });
    }

    // Limit to 3 mutations per file for this basic implementation
    return mutations.slice(0, 3);
  }

  /**
   * Apply a mutation to content
   */
  applyMutation(content, mutation) {
    return content.replace(mutation.pattern, mutation.replacement);
  }

  /**
   * Display results
   */
  displayResults() {
    const score = this.results.total > 0 ? (this.results.killed / this.results.total) * 100 : 0;

    console.log("\n🧬 MUTATION TESTING RESULTS");
    console.log("=".repeat(50));
    console.log(`Total mutations: ${this.results.total}`);
    console.log(`Killed: ${this.results.killed}`);
    console.log(`Survived: ${this.results.survived}`);
    console.log(`Mutation Score: ${score.toFixed(1)}%`);

    const threshold = 25;
    const passed = score >= threshold;

    console.log(`\n${passed ? "✅" : "❌"} Threshold: ${threshold}% (${passed ? "PASSED" : "FAILED"})`);

    if (this.results.survived > 0) {
      console.log("\n🧟 SURVIVED MUTATIONS (weak tests):");
      this.results.mutations
        .filter(m => m.survived)
        .forEach(m => {
          console.log(`   - ${m.file}: ${m.mutation}`);
        });
    }

    console.log("\n💡 Recommendation: Improve tests for survived mutations");
  }

  /**
   * Get results
   */
  getResults() {
    const score = this.results.total > 0 ? (this.results.killed / this.results.total) * 100 : 0;
    return {
      ...this.results,
      score,
      passed: score >= 25
    };
  }
}

// CLI interface
if (require.main === module) {
  const tester = new MutationTester();

  tester.run()
    .then(results => {
      const exitCode = results.passed ? 0 : 1;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error("Fatal error in mutation testing:", error);
      process.exit(1);
    });
}

module.exports = MutationTester;
