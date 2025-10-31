#!/usr/bin/env node

/**
 * Content Mapping Inventory Script
 * Maps all sections with potential tracking/mapping issues
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const CONTENT_DIR = 'domains/marketing/content';
const TMP_FILE = 'tmp/content-sweep.json';

async function scanContentFiles() {
  const files = await glob('**/*.{ts,tsx}', { cwd: CONTENT_DIR });
  const inventory = [];

  for (const file of files) {
    const fullPath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Extract section key from filename
    const sectionKey = file.replace(/[-_]content\.ts$/, '').replace(/\.ts$/, '');

    // Check for tracking properties
    const hasTracking = content.includes('tracking:');
    const hasSectionId = content.includes('sectionId:') || content.includes('sectionId');
    const hasSection = content.includes('section:') || content.includes('section');

    // Check for potential issues
    const issues = [];
    if (hasTracking && !hasSectionId) {
      issues.push('missing_sectionId');
    }
    if (hasTracking && !hasSection) {
      issues.push('missing_section');
    }

    // Check if file exports variants or direct content
    const hasVariants = content.includes('variants:') || content.includes('export const') && content.includes(': {');
    const hasDefaultExport = content.includes('export default');

    inventory.push({
      sectionKey,
      filePath: file,
      hasTracking,
      hasSectionId,
      hasSection,
      hasVariants,
      hasDefaultExport,
      issues,
      fileSize: content.length,
      lastModified: fs.statSync(fullPath).mtime.toISOString()
    });
  }

  return inventory;
}

async function checkNormalizerIssues() {
  const normalizerPath = 'lib/composition/content/content-normalizer.ts';
  if (!fs.existsSync(normalizerPath)) {
    return { normalizerExists: false, requiredFields: [] };
  }

  const content = fs.readFileSync(normalizerPath, 'utf8');

  // Extract required fields from schema
  const requiredFields = [];
  const schemaMatches = content.match(/(\w+):\s*z\.\w+\(\)/g);
  if (schemaMatches) {
    requiredFields.push(...schemaMatches.map(match => match.split(':')[0].trim()));
  }

  return {
    normalizerExists: true,
    requiredFields: [...new Set(requiredFields)],
    hasDefaults: content.includes('.default('),
    hasOptional: content.includes('.optional()')
  };
}

async function generateReport() {
  console.log('🔍 Scanning content mapping issues...');

  const inventory = await scanContentFiles();
  const normalizer = await checkNormalizerIssues();

  const report = {
    generatedAt: new Date().toISOString(),
    totalFiles: inventory.length,
    sectionsWithIssues: inventory.filter(item => item.issues.length > 0).length,
    normalizer,
    inventory: inventory.sort((a, b) => a.sectionKey.localeCompare(b.sectionKey)),
    summary: {
      sectionsWithTracking: inventory.filter(item => item.hasTracking).length,
      sectionsWithSectionId: inventory.filter(item => item.hasSectionId).length,
      sectionsWithSection: inventory.filter(item => item.hasSection).length,
      sectionsMissingSectionId: inventory.filter(item => item.issues.includes('missing_sectionId')).length,
      sectionsMissingSection: inventory.filter(item => item.issues.includes('missing_section')).length
    }
  };

  // Ensure tmp directory exists
  const tmpDir = path.dirname(TMP_FILE);
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  fs.writeFileSync(TMP_FILE, JSON.stringify(report, null, 2));
  console.log(`✅ Inventory saved to ${TMP_FILE}`);

  // Console summary
  console.log('\n📊 CONTENT MAPPING INVENTORY SUMMARY:');
  console.log(`   Total files: ${report.totalFiles}`);
  console.log(`   Sections with tracking: ${report.summary.sectionsWithTracking}`);
  console.log(`   Sections with sectionId: ${report.summary.sectionsWithSectionId}`);
  console.log(`   Sections missing sectionId: ${report.summary.sectionsMissingSectionId}`);
  console.log(`   Sections missing section: ${report.summary.sectionsMissingSection}`);

  if (report.summary.sectionsMissingSectionId > 0) {
    console.log('\n⚠️  SECTIONS NEEDING FIXES:');
    inventory
      .filter(item => item.issues.includes('missing_sectionId'))
      .forEach(item => {
        console.log(`   - ${item.sectionKey} (${item.filePath})`);
      });
  }

  return report;
}

generateReport().catch(console.error);
