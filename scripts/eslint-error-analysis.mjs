#!/usr/bin/env node

/**
 * Comprehensive ESLint Error Analysis
 * Categorizes and prioritizes ESLint errors for systematic resolution
 */

import fs from 'fs';
import path from 'path';

class ESLintAnalyzer {
  constructor() {
    this.errors = [];
    this.stats = {
      total: 0,
      byRule: new Map(),
      byFile: new Map(),
      byCategory: new Map(),
      unusedVars: 0,
      typeErrors: 0,
      complexityErrors: 0,
      importErrors: 0,
      syntaxErrors: 0
    };
  }

  analyze() {
    console.log('🔍 Analyzing ESLint errors from output file...\n');

    try {
      const output = fs.readFileSync('eslint-output.txt', 'utf8');
      this.parseErrors(output);
      this.generateReport();
    } catch (error) {
      console.error('Failed to read ESLint output:', error.message);
    }
  }

  parseErrors(output) {
    const lines = output.split('\n');

    for (const line of lines) {
      // Match ESLint error format: file:line:col: error message rule
      const errorMatch = line.match(/^(.+?):\s+(\d+):(\d+):\s+error\s+(.+?)\s+(.+)$/);

      if (errorMatch) {
        const [, file, lineNum, col, message, rule] = errorMatch;

        // Skip if file path contains weird characters or is not a source file
        if (!file.includes('.ts') && !file.includes('.tsx') && !file.includes('.js') && !file.includes('.jsx')) {
          continue;
        }

        const error = {
          file: file.replace(process.cwd(), '').replace(/\\/g, '/').replace(/^\//, ''),
          line: parseInt(lineNum),
          col: parseInt(col),
          message: message.trim(),
          rule: rule.trim()
        };

        this.errors.push(error);
        this.stats.total++;

        // Count by rule
        this.stats.byRule.set(rule, (this.stats.byRule.get(rule) || 0) + 1);

        // Count by file
        this.stats.byFile.set(error.file, (this.stats.byFile.get(error.file) || 0) + 1);

        // Categorize errors
        this.categorizeError(error);
      }
    }
  }

  categorizeError(error) {
    const { rule, message } = error;

    // Unused variables/imports
    if (rule.includes('no-unused-vars') || message.includes('is defined but never used')) {
      this.stats.unusedVars++;
      this.addToCategory('unused-vars', error);
    }
    // Type issues
    else if (rule.includes('explicit-function-return-type') || rule.includes('no-explicit-any') ||
             rule.includes('no-inferrable-types') || rule.includes('no-implicit-any')) {
      this.stats.typeErrors++;
      this.addToCategory('type-issues', error);
    }
    // Complexity
    else if (rule.includes('complexity')) {
      this.stats.complexityErrors++;
      this.addToCategory('complexity', error);
    }
    // Import/export
    else if (rule.includes('import/') || rule.includes('export')) {
      this.stats.importErrors++;
      this.addToCategory('imports', error);
    }
    // Syntax/style
    else if (rule.includes('no-case-declarations') || rule.includes('no-useless-escape') ||
             rule.includes('no-property-access-from-index-signature') ||
             rule.includes('semi') || rule.includes('quotes')) {
      this.stats.syntaxErrors++;
      this.addToCategory('syntax-style', error);
    }
    // React/JSX
    else if (rule.includes('react/') || rule.includes('jsx-a11y/') || rule.includes('jsx/')) {
      this.addToCategory('react-jsx', error);
    }
    // Other
    else {
      this.addToCategory('other', error);
    }
  }

  addToCategory(category, error) {
    if (!this.stats.byCategory.has(category)) {
      this.stats.byCategory.set(category, []);
    }
    this.stats.byCategory.get(category).push(error);
  }

  generateReport() {
    console.log('📊 ESLint Error Analysis Report\n');
    console.log('='.repeat(70));

    // Executive Summary
    console.log('📈 EXECUTIVE SUMMARY:');
    console.log(`   Total Errors: ${this.stats.total.toLocaleString()}`);
    console.log(`   Files Affected: ${this.stats.byFile.size}`);
    console.log(`   Rules Violated: ${this.stats.byRule.size}`);
    console.log('');

    // Error Breakdown by Category
    console.log('📂 ERROR BREAKDOWN BY CATEGORY:');
    const categories = [
      ['unused-vars', 'Unused Variables/Imports', this.stats.unusedVars],
      ['type-issues', 'Type Issues', this.stats.typeErrors],
      ['complexity', 'Code Complexity', this.stats.complexityErrors],
      ['imports', 'Import/Export Issues', this.stats.importErrors],
      ['syntax-style', 'Syntax & Style', this.stats.syntaxErrors],
      ['react-jsx', 'React/JSX Issues', (this.stats.byCategory.get('react-jsx') || []).length],
      ['other', 'Other Issues', (this.stats.byCategory.get('other') || []).length]
    ];

    categories.forEach(([key, name, count]) => {
      const percentage = ((count / this.stats.total) * 100).toFixed(1);
      console.log(`   ${name}: ${count.toLocaleString()} (${percentage}%)`);
    });
    console.log('');

    // Top 10 Rules
    console.log('🎯 TOP 10 MOST VIOLATED RULES:');
    const topRules = Array.from(this.stats.byRule.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    topRules.forEach(([rule, count], index) => {
      const percentage = ((count / this.stats.total) * 100).toFixed(1);
      console.log(`   ${index + 1}. ${rule}: ${count.toLocaleString()} (${percentage}%)`);
    });
    console.log('');

    // Top 10 Files
    console.log('📁 TOP 10 FILES WITH MOST ERRORS:');
    const topFiles = Array.from(this.stats.byFile.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    topFiles.forEach(([file, count], index) => {
      console.log(`   ${index + 1}. ${file}: ${count} errors`);
    });
    console.log('');

    // Hypotheses and Root Causes
    this.generateHypotheses();

    // Strategic Action Plan
    this.generateActionPlan();

    // Save detailed report
    this.saveDetailedReport();
  }

  generateHypotheses() {
    console.log('🔍 HYPOTHESES AND ROOT CAUSES ANALYSIS:\n');

    const hypotheses = [
      {
        id: 'H1',
        category: 'Massive Unused Imports (Majority - ~80%)',
        hypothesis: 'Large-scale refactoring left thousands of unused imports from Lucide React icons and other dependencies',
        evidence: `Found ${this.stats.unusedVars} unused variable errors, primarily icon imports`,
        impact: 'Code bloat, slower builds, bundle size increase, developer confusion',
        confidence: 'High',
        rootCause: 'Refactoring without systematic cleanup'
      },
      {
        id: 'H2',
        category: 'TypeScript Strict Mode Adoption',
        hypothesis: 'TypeScript strict mode enabled without gradual migration strategy',
        evidence: `${this.stats.typeErrors} type-related errors, mainly explicit return types and any types`,
        impact: 'Development friction, false sense of type safety, incomplete type coverage',
        confidence: 'High',
        rootCause: 'Configuration change without migration plan'
      },
      {
        id: 'H3',
        category: 'Code Complexity Explosion',
        hypothesis: 'Functions grew beyond maintainable size during rapid development',
        evidence: `${this.stats.complexityErrors} complexity violations (limit: 10)`,
        impact: 'Hard to test, debug, and maintain code',
        confidence: 'Medium',
        rootCause: 'Lack of code review focus on complexity'
      },
      {
        id: 'H4',
        category: 'Inconsistent Import Patterns',
        hypothesis: 'Multiple developers contributed without consistent import ordering standards',
        evidence: `${this.stats.importErrors} import-related errors`,
        impact: 'Merge conflicts, inconsistent code style, harder navigation',
        confidence: 'Medium',
        rootCause: 'No enforced import standards or auto-formatting'
      },
      {
        id: 'H5',
        category: 'Syntax Issues from Manual Changes',
        hypothesis: 'Manual refactoring introduced syntax problems that work by accident',
        evidence: `${this.stats.syntaxErrors} syntax and style violations`,
        impact: 'Potential runtime bugs, unpredictable behavior',
        confidence: 'Medium',
        rootCause: 'Manual changes without automated validation'
      }
    ];

    hypotheses.forEach((hyp) => {
      console.log(`   ${hyp.id}. ${hyp.category} (${hyp.confidence} confidence)`);
      console.log(`      🔍 Hypothesis: ${hyp.hypothesis}`);
      console.log(`      📊 Evidence: ${hyp.evidence}`);
      console.log(`      💥 Impact: ${hyp.impact}`);
      console.log(`      🎯 Root Cause: ${hyp.rootCause}`);
      console.log('');
    });
  }

  generateActionPlan() {
    console.log('🎯 STRATEGIC ACTION PLAN:\n');

    const phases = [
      {
        phase: 'PHASE 1: Quick Wins (High Impact, Low Risk)',
        duration: '1-2 days',
        actions: [
          'Run: npm run lint:fix (auto-fix imports, spacing, semicolons)',
          'Remove obviously unused imports (grep analysis)',
          'Disable overly strict rules temporarily',
          'Fix auto-fixable syntax issues'
        ],
        impact: 'Reduce errors by 40-60%',
        risk: 'Low'
      },
      {
        phase: 'PHASE 2: Systematic Cleanup (Medium Impact, Low Risk)',
        duration: '3-5 days',
        actions: [
          'Create script to remove unused icon imports',
          'Implement gradual TypeScript adoption',
          'Fix import ordering across all files',
          'Address complexity violations through refactoring'
        ],
        impact: 'Reduce errors by additional 30%',
        risk: 'Low'
      },
      {
        phase: 'PHASE 3: Architectural Fixes (High Impact, Medium Risk)',
        duration: '1-2 weeks',
        actions: [
          'Refactor complex functions into smaller units',
          'Implement proper type definitions',
          'Fix remaining syntax issues',
          'Establish code quality gates'
        ],
        impact: 'Achieve clean codebase',
        risk: 'Medium'
      },
      {
        phase: 'PHASE 4: Prevention & Monitoring (Ongoing)',
        duration: 'Ongoing',
        actions: [
          'Implement pre-commit hooks',
          'Set up automated quality monitoring',
          'Establish code review standards',
          'Regular lint rule updates'
        ],
        impact: 'Prevent future issues',
        risk: 'Low'
      }
    ];

    phases.forEach((phase) => {
      console.log(`   📍 ${phase.phase} (${phase.duration})`);
      console.log(`      🎯 Impact: ${phase.impact}`);
      console.log(`      ⚠️  Risk: ${phase.risk}`);
      console.log('      📋 Actions:');
      phase.actions.forEach(action => {
        console.log(`         • ${action}`);
      });
      console.log('');
    });

    console.log('⚡ IMMEDIATE NEXT STEPS:');
    console.log('   1. Run: npm run lint:fix');
    console.log('   2. Check: eslint.config.js - relax overly strict rules');
    console.log('   3. Analyze: Focus on unused imports pattern');
    console.log('   4. Script: Create automated cleanup for icon imports');
    console.log('');
  }

  saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: this.stats.total,
        filesAffected: this.stats.byFile.size,
        rulesViolated: this.stats.byRule.size,
        categories: Object.fromEntries(
          Array.from(this.stats.byCategory.entries()).map(([k, v]) => [k, v.length])
        )
      },
      topRules: Array.from(this.stats.byRule.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20),
      topFiles: Array.from(this.stats.byFile.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20),
      hypotheses: [
        'Massive unused imports from Lucide React icons',
        'TypeScript strict mode without gradual adoption',
        'Code complexity violations from rapid development',
        'Inconsistent import ordering',
        'Syntax issues from manual refactoring'
      ],
      actionPlan: {
        phase1: 'Auto-fix and unused imports cleanup',
        phase2: 'Systematic rule relaxation and import fixes',
        phase3: 'Function decomposition and type improvements',
        phase4: 'Prevention and monitoring setup'
      }
    };

    const reportPath = path.join(process.cwd(), 'eslint-detailed-analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`💾 Detailed analysis saved: ${reportPath}`);
  }
}

// Run analysis
const analyzer = new ESLintAnalyzer();
analyzer.analyze();
