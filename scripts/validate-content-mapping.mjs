#!/usr/bin/env node

/**
 * Content Mapping Validator
 * Validates that all sections have proper tracking and can be normalized
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const CONTENT_DIR = 'domains/marketing/content';

async function validateContentMapping() {
  console.log('🔍 Validating content mapping across all sections...');

  const contentFiles = await glob('*-content.ts', { cwd: CONTENT_DIR });
  const results = {
    totalSections: contentFiles.length,
    sectionsWithTracking: 0,
    sectionsWithSectionId: 0,
    sectionsWithValidTracking: 0,
    errors: [],
    warnings: [],
    fallbackUsage: 0
  };

  for (const file of contentFiles) {
    const fullPath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const sectionName = file.replace('-content.ts', '').replace('-', '-');

    // Check for tracking object
    const hasTracking = content.includes('tracking:');
    if (hasTracking) {
      results.sectionsWithTracking++;
    }

    // Check for sectionId
    const hasSectionId = content.includes('sectionId:');
    if (hasSectionId) {
      results.sectionsWithSectionId++;
    }

    // Validate tracking structure
    if (hasTracking) {
      const trackingBlocks = content.match(/tracking:\s*\{[^}]*\}/g) || [];

      for (const block of trackingBlocks) {
        const hasValidSectionId = block.includes('sectionId:');
        const hasEventCategory = block.includes('eventCategory:');
        const hasEventAction = block.includes('eventAction:');

        if (hasValidSectionId && hasEventCategory && hasEventAction) {
          results.sectionsWithValidTracking++;
        } else {
          results.errors.push({
            section: sectionName,
            file,
            issue: 'Incomplete tracking structure',
            missing: [
              !hasValidSectionId && 'sectionId',
              !hasEventCategory && 'eventCategory',
              !hasEventAction && 'eventAction'
            ].filter(Boolean)
          });
        }
      }
    } else {
      results.errors.push({
        section: sectionName,
        file,
        issue: 'Missing tracking object'
      });
    }

    // Check for potential fallback usage indicators
    if (content.includes('fallback') || content.includes('default')) {
      results.warnings.push({
        section: sectionName,
        file,
        type: 'potential_fallback_usage'
      });
    }
  }

  // Calculate percentages
  const errorCount = results.errors.length;
  const validSections = results.totalSections - errorCount;
  const fallbackUsagePercent = (results.fallbackUsage / results.totalSections) * 100;

  // Report results
  console.log('\n📊 CONTENT MAPPING VALIDATION RESULTS:');
  console.log(`   Total sections: ${results.totalSections}`);
  console.log(`   Sections with tracking: ${results.sectionsWithTracking}`);
  console.log(`   Sections with sectionId: ${results.sectionsWithSectionId}`);
  console.log(`   Sections with valid tracking: ${results.sectionsWithValidTracking}`);
  console.log(`   Error count: ${errorCount}`);
  console.log(`   Fallback usage: ${fallbackUsagePercent.toFixed(1)}%`);

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    results.errors.forEach(error => {
      console.log(`   - ${error.section} (${error.file}): ${error.issue}`);
      if (error.missing) {
        console.log(`     Missing: ${error.missing.join(', ')}`);
      }
    });
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach(warning => {
      console.log(`   - ${warning.section} (${warning.file}): ${warning.type}`);
    });
  }

  // Exit with appropriate code
  if (errorCount > 0) {
    console.log(`\n❌ VALIDATION FAILED: ${errorCount} errors found`);
    process.exit(1);
  } else {
    console.log('\n✅ VALIDATION PASSED: All sections have proper tracking');
    process.exit(0);
  }
}

validateContentMapping().catch(error => {
  console.error('Validation script failed:', error);
  process.exit(1);
});
