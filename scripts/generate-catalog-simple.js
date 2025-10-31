#!/usr/bin/env node

/**
 * Generate Pre-Migration Catalog (Simple Version)
 * Fase 1: Catalogar e rotular todos os scripts antes da migração
 */

const fs = require('fs');
const path = require('path');

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
    'test-quality-dashboard.mjs': 'kill',

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

    // READMEs - keep
    'README.md': 'keep',
    'README-post-deploy.md': 'merge',
    'README-playwright.md': 'keep',
    'monitoring-guide.md': 'keep',
    'tdd-quality-checklist.md': 'keep',
    'improvement-hypotheses.md': 'keep'
  };

  if (classifications[filename]) {
    return classifications[filename];
  }

  // Scripts experimentais - quarantine
  if (filename.includes('debug-') ||
      filename.includes('demo-') ||
      filename.includes('test-') ||
      filename.includes('temp') ||
      filename.includes('simple') ||
      filename.includes('quick') ||
      filename.includes('baseline')) {
    return 'quarantine';
  }

  // Scripts de análise - legacy
  if (filename.includes('analyze-') ||
      filename.includes('audit-') ||
      filename.includes('check-') ||
      filename.includes('validate-') ||
      filename.includes('verify-')) {
    return 'legacy';
  }

  // Scripts de correção - merge
  if (filename.includes('fix-') ||
      filename.includes('migrate-') ||
      filename.includes('cleanup-')) {
    return 'merge';
  }

  // Default quarantine
  return 'quarantine';
}

function inferPurpose(filename) {
  const purposes = {
    'quality-gate': 'gate',
    'ci-gate': 'gate',
    'fix-': 'correction',
    'dashboard': 'dashboard',
    'performance': 'performance',
    'bundle': 'performance',
    'deploy': 'deployment',
    'test': 'testing',
    'debug': 'diagnostic',
    'analyze': 'diagnostic',
    'setup': 'setup'
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

  if (filename.includes('README')) {
    notes.push('Documentação - será preservada');
  }

  return notes;
}

function scanDirectory(dir, basePath = '') {
  const items = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relativePath = path.join(basePath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip certain directories
      if (file === 'official' || file === 'legacy') continue;
      items.push(...scanDirectory(fullPath, relativePath));
    } else {
      const ext = path.extname(file);
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
          owner: 'unknown',
          notes: generateNotes(file, status)
        });
      }
    }
  }

  return items;
}

function main() {
  console.log('🔍 Scanning scripts directory...');

  try {
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

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalog, null, 2));

    console.log(`✅ Catalog generated: ${OUTPUT_FILE}`);
    console.log(`📊 Total scripts: ${scripts.length}`);
    console.log(`✅ Keep: ${catalog.summary.keep}`);
    console.log(`🔄 Merge: ${catalog.summary.merge}`);
    console.log(`📜 Legacy: ${catalog.summary.legacy}`);
    console.log(`🗑️  Kill: ${catalog.summary.kill}`);
    console.log(`🚨 Quarantine: ${catalog.summary.quarantine}`);

  } catch (error) {
    console.error('❌ Error generating catalog:', error.message);
    process.exit(1);
  }
}

main();
