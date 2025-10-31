#!/usr/bin/env node

/**
 * Update Script Registry
 * Fase 4: Registrar todos os scripts no Compliance Engine com status apropriados
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CATALOG_PATH = './scripts/catalog-pre-migration.json';
const REGISTRY_PATH = './compliance-engine/data/script-registry.json';

function generateRegistryEntry(script, status, approvedBy = 'system') {
  const now = new Date().toISOString();
  const baseEntry = {
    id: script.filename.replace(/\.[^.]+$/, ''), // Remove extension
    name: script.filename.replace(/\.[^.]+$/, '').replace(/-/g, '').replace(/^./, str => str.toUpperCase()),
    path: script.path,
    purpose: script.purpose || 'utility',
    category: script.purpose || 'utility',
    owner: 'Quality Team',
    created: now,
    lastUsed: null,
    status: status,
    strikes: status === 'legacy' ? 1 : 0,
    approvedAt: now,
    approvedBy: approvedBy,
    quarantinedAt: status === 'quarantined' ? now : null,
    quarantinedBy: status === 'quarantined' ? approvedBy : null,
    quarantineReason: status === 'quarantined' ? 'Script não catalogado ou com risco identificado' : null,
    lastModifiedBy: approvedBy,
    policyVersion: '2.0.0',
    metadata: {
      avgRuntime: null,
      dependencies: [],
      replaces: [],
      tags: [script.purpose || 'utility'],
      originalSize: script.size,
      modified: script.modified
    }
  };

  // Customize based on status
  if (status === 'active') {
    baseEntry.metadata.tags.push('official', 'approved');
  } else if (status === 'legacy') {
    baseEntry.metadata.tags.push('deprecated', 'replaced');
    if (script.notes && script.notes.length > 0) {
      baseEntry.metadata.replaces = [script.notes[0].replace('Será absorvido por script oficial consolidado', '').trim()];
    }
  } else if (status === 'quarantined') {
    baseEntry.metadata.tags.push('blocked', 'risk');
  }

  return baseEntry;
}

function main() {
  console.log('📋 Updating script registry...');

  // Load catalog
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  console.log(`📊 Loaded catalog with ${catalog.scripts.length} scripts`);

  // Load existing registry
  let existingRegistry = {};
  try {
    existingRegistry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
  } catch (error) {
    console.log('📝 Creating new registry');
  }

  const newRegistry = { ...existingRegistry };
  let updated = 0;
  let added = 0;

  // Process each script from catalog
  for (const script of catalog.scripts) {
    const scriptId = script.filename.replace(/\.[^.]+$/, '');

    // Skip directories and non-script files
    if (script.filename === 'README.md' || script.filename === 'POLITICA_SCRIPTS_OFICIAIS.md') {
      continue;
    }

    // Determine registry status based on catalog status
    let registryStatus;
    switch (script.status) {
      case 'keep':
        registryStatus = 'active';
        break;
      case 'legacy':
        registryStatus = 'legacy';
        break;
      case 'quarantine':
        registryStatus = 'quarantined';
        break;
      case 'merge':
        registryStatus = 'legacy'; // Scripts merged go to legacy
        break;
      case 'kill':
        continue; // Don't register killed scripts
      default:
        registryStatus = 'quarantined';
    }

    // Update or add entry
    if (newRegistry[scriptId]) {
      // Update existing
      newRegistry[scriptId].status = registryStatus;
      newRegistry[scriptId].strikes = registryStatus === 'legacy' ? 1 : 0;
      newRegistry[scriptId].path = script.path;
      newRegistry[scriptId].lastModifiedBy = 'migration-script';
      newRegistry[scriptId].policyVersion = '2.0.0';
      updated++;
    } else {
      // Add new
      newRegistry[scriptId] = generateRegistryEntry(script, registryStatus, 'migration-script');
      added++;
    }
  }

  // Special handling for official scripts - ensure they're active
  const officialScripts = [
    'quality-gate', 'ci-gate', 'quality-fixer',
    'dashboard-quality', 'dashboard-tdd', 'dashboard-audit', 'dashboard-trends',
    'perf-monitor', 'bundle-analyze', 'analytics-monitor',
    'deploy', 'post-deploy'
  ];

  for (const scriptId of officialScripts) {
    if (newRegistry[scriptId]) {
      newRegistry[scriptId].status = 'active';
      newRegistry[scriptId].strikes = 0;
      newRegistry[scriptId].path = `scripts/official/${scriptId}.mjs`;
      newRegistry[scriptId].approvedBy = 'Quality Team';
      newRegistry[scriptId].metadata.tags = ['official', 'approved', 'core'];
    }
  }

  // Write updated registry
  writeFileSync(REGISTRY_PATH, JSON.stringify(newRegistry, null, 2));
  console.log(`✅ Registry updated: ${added} added, ${updated} updated`);
  console.log(`📊 Total scripts in registry: ${Object.keys(newRegistry).length}`);

  // Summary
  const statusCounts = Object.values(newRegistry).reduce((acc, script) => {
    acc[script.status] = (acc[script.status] || 0) + 1;
    return acc;
  }, {});

  console.log('📈 Registry status summary:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
}

main();
