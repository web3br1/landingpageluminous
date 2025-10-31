#!/usr/bin/env node

/**
 * ESLint Error Analysis Script
 * Analyzes ESLint errors and categorizes them by type and frequency
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class ESLintErrorAnalyzer {
  constructor() {
    this.errors = [];
    this.errorCounts = new Map();
    this.fileErrors = new Map();
    this.ruleErrors = new Map();
  }

  async analyze() {
    console.log('🔍 Analyzing ESLint errors...\n');

    try {
      // Run ESLint and capture output
      const eslintOutput = execSync('npm run lint 2>&1', {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      this.parseESLintOutput(eslintOutput);
      this.generateReport();

    } catch (error) {
      console.log('ESLint analysis completed with errors (expected)');
      this.parseESLintOutput(error.stdout || error.stderr || '');
      this.generateReport();
    }
  }

  parseESLintOutput(output) {
    const lines = output.split('\n');

    for (const line of lines) {
      // Match ESLint error format: file:line:col: error message rule
      const errorMatch = line.match(/^(.+?):(\d+):(\d+):\s+(error|warning)\s+(.+?)(?:\s+(.+))?$/);

      if (errorMatch) {
        const [, file, lineNum, col, level, message, rule] = errorMatch;

        const error = {
          file: path.relative(process.cwd(), file),
          line: parseInt(lineNum),
          col: parseInt(col),
          level,
          message: message.trim(),
          rule: rule || 'unknown'
        };

        this.errors.push(error);

        // Count by rule
        const ruleKey = rule || 'unknown-rule';
        this.ruleErrors.set(ruleKey, (this.ruleErrors.get(ruleKey) || 0) + 1);

        // Count by file
        const fileKey = error.file;
        if (!this.fileErrors.has(fileKey)) {
          this.fileErrors.set(fileKey, []);
        }
        this.fileErrors.get(fileKey).push(error);

        // Count total
        this.errorCounts.set(level, (this.errorCounts.get(level) || 0) + 1);
      }
    }
  }

  generateReport() {
    console.log('📊 ESLint Error Analysis Report\n');
    console.log('='.repeat(60));

    // Summary
    console.log('📈 SUMMARY:');
    console.log(`   Total Files: ${this.fileErrors.size}`);
    console.log(`   Total Errors: ${this.errors.length}`);
    console.log(`   Errors: ${this.errorCounts.get('error') || 0}`);
    console.log(`   Warnings: ${this.errorCounts.get('warning') || 0}`);
    console.log('');

    // Top 10 rules
    console.log('🎯 TOP 10 ERROR RULES:');
    const sortedRules = Array.from(this.ruleErrors.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    sortedRules.forEach(([rule, count], index) => {
      const percentage = ((count / this.errors.length) * 100).toFixed(1);
      console.log(`   ${index + 1}. ${rule}: ${count} (${percentage}%)`);
    });
    console.log('');

    // Top 10 files with most errors
    console.log('📁 TOP 10 FILES WITH MOST ERRORS:');
    const sortedFiles = Array.from(this.fileErrors.entries())
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 10);

    sortedFiles.forEach(([file, errors], index) => {
      console.log(`   ${index + 1}. ${file}: ${errors.length} errors`);
    });
    console.log('');

    // Categorize errors
    this.categorizeErrors();

    // Hypotheses and recommendations
    this.generateHypotheses();

    // Save detailed report
    this.saveDetailedReport();
  }

  categorizeErrors() {
    console.log('📂 ERROR CATEGORIES:');

    const categories = {
      'Unused Variables/Imports': ['@typescript-eslint/no-unused-vars', 'no-unused-vars'],
      'Type Issues': ['@typescript-eslint/explicit-function-return-type', '@typescript-eslint/no-explicit-any'],
      'Code Complexity': ['complexity'],
      'Import/Export': ['import/order', 'import/no-unresolved'],
      'Syntax/Style': ['no-case-declarations', 'no-useless-escape', '@typescript-eslint/no-property-access-from-index-signature'],
      'Accessibility': ['jsx-a11y/', 'react/'],
      'Other': []
    };

    const categoryCounts = new Map();

    for (const [rule, count] of this.ruleErrors.entries()) {
      let categorized = false;
      for (const [category, patterns] of Object.entries(categories)) {
        if (patterns.some(pattern => rule.includes(pattern))) {
          categoryCounts.set(category, (categoryCounts.get(category) || 0) + count);
          categorized = true;
          break;
        }
      }
      if (!categorized) {
        categoryCounts.set('Other', (categoryCounts.get('Other') || 0) + count);
      }
    }

    Array.from(categoryCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        const percentage = ((count / this.errors.length) * 100).toFixed(1);
        console.log(`   ${category}: ${count} (${percentage}%)`);
      });

    console.log('');
  }

  generateHypotheses() {
    console.log('🔍 HYPOTHESES AND ROOT CAUSES:');

    const hypotheses = [
      {
        category: 'Unused Variables/Imports (Majority)',
        hypothesis: 'Massive code refactoring left many unused imports and variables',
        evidence: 'High percentage of @typescript-eslint/no-unused-vars errors',
        impact: 'Code bloat, slower builds, confusion for developers',
        solution: 'Automated removal or systematic cleanup'
      },
      {
        category: 'Type Issues',
        hypothesis: 'TypeScript strict mode enabled without gradual migration',
        evidence: 'explicit-function-return-type and no-explicit-any errors',
        impact: 'Type safety compromised, potential runtime errors',
        solution: 'Gradual type adoption or rule relaxation'
      },
      {
        category: 'Code Complexity',
        hypothesis: 'Functions grew too complex during development',
        evidence: 'complexity rule violations',
        impact: 'Hard to maintain, test, and debug',
        solution: 'Function decomposition and refactoring'
      },
      {
        category: 'Import Order',
        hypothesis: 'Multiple developers with different import styles',
        evidence: 'import/order violations across many files',
        impact: 'Inconsistent code style, merge conflicts',
        solution: 'Auto-fix imports or team standards'
      },
      {
        category: 'Syntax Issues',
        hypothesis: 'Manual code changes introduced syntax problems',
        evidence: 'no-case-declarations, no-useless-escape errors',
        impact: 'Potential runtime bugs, code that works by accident',
        solution: 'Systematic syntax cleanup'
      }
    ];

    hypotheses.forEach((hyp, index) => {
      console.log(`   ${index + 1}. ${hyp.category}`);
      console.log(`      Hypothesis: ${hyp.hypothesis}`);
      console.log(`      Evidence: ${hyp.evidence}`);
      console.log(`      Impact: ${hyp.impact}`);
      console.log(`      Solution: ${hyp.solution}`);
      console.log('');
    });
  }

  saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.fileErrors.size,
        totalErrors: this.errors.length,
        errorBreakdown: Object.fromEntries(this.errorCounts)
      },
      topRules: Array.from(this.ruleErrors.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20),
      topFiles: Array.from(this.fileErrors.entries())
        .sort(([,a], [,b]) => b.length - a.length)
        .slice(0, 20)
        .map(([file, errors]) => ({ file, errorCount: errors.length })),
      hypotheses: [
        'Massive unused imports from refactoring',
        'TypeScript strict mode without gradual adoption',
        'Complex functions need decomposition',
        'Inconsistent import ordering',
        'Syntax issues from manual changes'
      ],
      recommendations: [
        'Phase 1: Auto-remove unused imports (safe)',
        'Phase 2: Relax overly strict TypeScript rules',
        'Phase 3: Fix import ordering automatically',
        'Phase 4: Address complexity violations',
        'Phase 5: Fix remaining syntax issues'
      ]
    };

    const reportPath = path.join(process.cwd(), 'eslint-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`💾 Detailed report saved: ${reportPath}`);
    console.log('');

    console.log('🎯 RECOMMENDED ACTION PLAN:');
    console.log('   Phase 1: Auto-remove unused imports (safe, high impact)');
    console.log('   Phase 2: Relax overly strict TypeScript rules');
    console.log('   Phase 3: Fix import ordering automatically');
    console.log('   Phase 4: Address complexity violations');
    console.log('   Phase 5: Fix remaining syntax issues');
    console.log('');

    console.log('⚡ QUICK WINS:');
    console.log('   1. Run: npm run lint:fix (auto-fix what\'s possible)');
    console.log('   2. Disable: @typescript-eslint/explicit-function-return-type');
    console.log('   3. Increase: complexity limit from 10 to 15');
    console.log('   4. Enable: import/order auto-fix');
  }
}

// Run analysis
const analyzer = new ESLintErrorAnalyzer();
analyzer.analyze().catch(console.error);