#!/usr/bin/env node

/**
 * Migrate Scripts to Legacy
 * Move classified scripts to appropriate folders with headers
 */

import { readdirSync, readFileSync, writeFileSync, renameSync } from 'fs';
import { join } from 'path';

const SCRIPTS_DIR = './scripts';
const LEGACY_DIR = './scripts/legacy';

// Scripts to move to legacy (from catalog analysis)
const LEGACY_SCRIPTS = [
  // Gates
  'ci-quality-gate-check.mjs',
  'run-quality-gates.mjs',
  'run-quality-gates-simple.mjs',

  // Performance (some)
  'performance-optimization.mjs',
  'performance-real-validation.mjs',
  'bundle-analysis-report.mjs',

  // Deployment
  'post-deploy-checklist.mjs',
  'deploy-vercel.js',
  'ci-deployment-ready.mjs',

  // Dashboards (some)
  'test-quality-dashboard.mjs'
];

function addLegacyHeader(content, replacement, owner = 'Quality Team') {
  const header = `/**
 * STATUS: LEGACY
 * NÃO USAR EM PRODUÇÃO
 * SUBSTITUÍDO POR ${replacement}
 * OWNER: ${owner}
 * DATA DE QUARENTENA: 2025-10-31
 *
 * Original:`;

  // Add header after the opening /**
  return content.replace(/\/\*\*/, header);
}

function migrateToLegacy(filename, replacement) {
  const sourcePath = join(SCRIPTS_DIR, filename);
  const destPath = join(LEGACY_DIR, filename);

  try {
    console.log(`📜 Migrating ${filename} to legacy...`);

    let content = readFileSync(sourcePath, 'utf8');
    content = addLegacyHeader(content, replacement);

    writeFileSync(sourcePath, content);
    renameSync(sourcePath, destPath);

    console.log(`✅ ${filename} moved to legacy`);
  } catch (error) {
    console.error(`❌ Error migrating ${filename}:`, error.message);
  }
}

function main() {
  console.log('🏛️  Starting legacy migration...');

  // Migrate gates
  migrateToLegacy('ci-quality-gate-check.mjs', '../official/ci-gate.mjs');
  migrateToLegacy('run-quality-gates.mjs', '../official/ci-gate.mjs');
  migrateToLegacy('run-quality-gates-simple.mjs', '../official/ci-gate.mjs');

  // Migrate performance scripts
  migrateToLegacy('performance-optimization.mjs', '../official/perf-monitor.mjs');
  migrateToLegacy('performance-real-validation.mjs', '../official/perf-monitor.mjs');
  migrateToLegacy('bundle-analysis-report.mjs', '../official/bundle-analyze.mjs');

  // Migrate deployment scripts
  migrateToLegacy('post-deploy-checklist.mjs', '../official/post-deploy.mjs');
  migrateToLegacy('deploy-vercel.js', '../official/deploy.mjs');
  migrateToLegacy('ci-deployment-ready.mjs', '../official/deploy.mjs');

  // Migrate dashboard
  migrateToLegacy('test-quality-dashboard.mjs', '../official/dashboard-quality.mjs');

  console.log('✅ Legacy migration completed');
}

main();
