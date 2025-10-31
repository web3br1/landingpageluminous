#!/usr/bin/env node

/**
 * Generate Pre-Migration Catalog
 * Fase 1: Catalogar e rotular todos os scripts antes da migração
 */

import { readdirSync, statSync, writeFileSync } from 'fs';
import { join, extname } from 'path';

const SCRIPTS_DIR = './scripts';
const OUTPUT_FILE = './scripts/catalog-pre-migration.json';

function classifyScript(filename) {
  const classifications = {
    // Gates - keep
    'quality-gate.mjs': 'keep',
    'ci-quality-gate.mjs': 'keep',
    'ci-quality-gates-v2.mjs': 'kill',
    'ci-quality-gate-check.mjs': 'kill',
    'run-quality-gates.mjs': 'kill',
    'run-quality-gates-simple.mjs': 'kill',

    // Correções automáticas - merge into quality-fixer.mjs
    'bulk-quality-fixes.mjs': 'merge',
    'fix-critical-ts-errors.mjs': 'merge',
    'eslint-systematic-fixes.mjs': 'merge',
    'quick-unused-vars-fix.mjs': 'merge',
    'fix-unused-vars.mjs': 'merge',
    'lote-1-unused-vars-fix.mjs': 'merge',
    'code-quality-fix.mjs': 'merge',

    // Dashboards - keep
    'quality-dashboard.mjs': 'keep',
    'tdd-dashboard.mjs': 'keep',
    'audit-dashboard.mjs': 'keep',
    'quality-progress-dashboard.mjs': 'keep',
    'dashboard-trends.mjs': 'keep', // será renomeado
    'test-quality-dashboard.mjs': 'kill', // redundante

    // Performance/Bundle - keep
    'performance-monitoring.js': 'keep',
    'bundle-analyzer.mjs': 'keep',
    'analytics-monitoring.mjs': 'keep',
    'performance-optimization.mjs': 'legacy',
    'performance-real-validation.mjs': 'legacy',
    'bundle-analysis-report.mjs': 'legacy',

    // Deployment - keep
    'deployment-automation.mjs': 'keep',
    'post-deploy-validation.mjs': 'keep',
    'post-deploy-checklist.mjs': 'merge',
    'deploy-vercel.js': 'merge',
    'ci-deployment-ready.mjs': 'legacy',

    // Outros - analyze individually
    'README.md': 'keep',
    'README-post-deploy.md': 'merge',
    'README-playwright.md': 'keep',
    'monitoring-guide.md': 'keep',
    'tdd-quality-checklist.md': 'keep',
    'improvement-hypotheses.md': 'keep'
  };

  // Classificação padrão baseada em padrões
  if (classifications[filename]) {
    return classifications[filename];
  }

  // Scripts experimentais/diagnósticos - quarantine
  if (filename.includes('debug-') ||
      filename.includes('demo-') ||
      filename.includes('test-') ||
      filename.includes('temp') ||
      filename.includes('simple') ||
      filename.includes('quick') ||
      filename.includes('baseline')) {
    return 'quarantine';
  }

  // Scripts de análise/avaliação - legacy
  if (filename.includes('analyze-') ||
      filename.includes('audit-') ||
      filename.includes('check-') ||
      filename.includes('validate-') ||
      filename.includes('verify-')) {
    return 'legacy';
  }

  // Scripts de correção específicos - merge
  if (filename.includes('fix-') ||
      filename.includes('migrate-') ||
      filename.includes('cleanup-')) {
    return 'merge';
  }

  // Scripts de relatório/dashboard - keep if not already classified
  if (filename.includes('dashboard') ||
      filename.includes('report') ||
      filename.includes('progress')) {
    return 'keep';
  }

  // Scripts de setup/configuração - legacy
  if (filename.includes('setup-') ||
      filename.includes('config')) {
    return 'legacy';
  }

  // Default: quarantine for safety
  return 'quarantine';
}

function scanDirectory(dir, basePath = '') {
  const items = [];
  const files = readdirSync(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const relativePath = join(basePath, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursively scan subdirectories
      items.push(...scanDirectory(fullPath, relativePath));
    } else {
      // Only include script files
      const ext = extname(file);
      if (['.mjs', '.js', '.ts', '.ps1', '.sh', '.md'].includes(ext)) {
        const status = classifyScript(file);
        items.push({
          filename: file,
          path: relativePath,
          extension: ext,
          size: stat.size,
          modified: stat.mtime.toISOString(),
          status: status,
          purpose: inferPurpose(file),
          owner: 'unknown', // Will be filled manually if known
          notes: generateNotes(file, status)
        });
      }
    }
  }

  return items;
}

function inferPurpose(filename) {
  const purposes = {
    // Gates
    'quality-gate': 'gate',
    'ci-gate': 'gate',
    'ci-quality-gate': 'gate',

    // Correções
    'fix-': 'correction',
    'bulk-quality-fixes': 'correction',
    'eslint-systematic-fixes': 'correction',

    // Dashboards
    'dashboard': 'dashboard',
    'report': 'dashboard',
    'progress': 'dashboard',

    // Performance
    'performance': 'performance',
    'bundle': 'performance',
    'analytics': 'performance',

    // Deployment
    'deploy': 'deployment',
    'post-deploy': 'deployment',
    'deployment-automation': 'deployment',

    // Testes
    'test': 'testing',
    'tdd': 'testing',

    // Debug/Diagnóstico
    'debug': 'diagnostic',
    'analyze': 'diagnostic',
    'check': 'diagnostic',

    // Setup
    'setup': 'setup',
    'config': 'setup'
  };

  for (const [pattern, purpose] of Object.entries(purposes)) {
    if (filename.includes(pattern)) {
      return purpose;
    }
  }

  return 'utility';
}

function generateNotes(filename, status) {
  const notes = [];

  if (status === 'keep') {
    notes.push('Será movido para /scripts/official/');
  } else if (status === 'merge') {
    notes.push('Será absorvido por script oficial consolidado');
  } else if (status === 'legacy') {
    notes.push('Será movido para /scripts/legacy/ com cabeçalho de status');
  } else if (status === 'kill') {
    notes.push('Será removido - funcionalidade obsoleta');
  } else if (status === 'quarantine') {
    notes.push('Será movido para quarentena - requer análise de risco');
  }

  // Specific notes
  if (filename.includes('README')) {
    notes.push('Documentação - será preservada');
  }

  return notes;
}

function main() {
  console.log('🔍 Scanning scripts directory...');

  const scripts = scanDirectory(SCRIPTS_DIR);

  const catalog = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalScripts: scripts.length,
      phase: 'pre-migration-catalog',
      version: '1.0'
    },
    summary: {
      keep: scripts.filter(s => s.status === 'keep').length,
      merge: scripts.filter(s => s.status === 'merge').length,
      legacy: scripts.filter(s => s.status === 'legacy').length,
      kill: scripts.filter(s => s.status === 'kill').length,
      quarantine: scripts.filter(s => s.status === 'quarantine').length
    },
    scripts: scripts.sort((a, b) => a.filename.localeCompare(b.filename))
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(catalog, null, 2));

  console.log(`✅ Catalog generated: ${OUTPUT_FILE}`);
  console.log(`📊 Total scripts: ${scripts.length}`);
  console.log(`✅ Keep: ${catalog.summary.keep}`);
  console.log(`🔄 Merge: ${catalog.summary.merge}`);
  console.log(`📜 Legacy: ${catalog.summary.legacy}`);
  console.log(`🗑️  Kill: ${catalog.summary.kill}`);
  console.log(`🚨 Quarantine: ${catalog.summary.quarantine}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, classifyScript, inferPurpose };
