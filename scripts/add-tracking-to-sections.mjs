#!/usr/bin/env node

/**
 * Add Tracking Defaults to All Sections
 * Adds tracking.sectionId to all content variants that don't have it
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const CONTENT_DIR = 'domains/marketing/content';

async function addTrackingToSection(filePath) {
  const fullPath = path.join(CONTENT_DIR, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  // Skip hero as it already has tracking
  if (filePath.includes('hero')) {
    return false;
  }

  // Find all variant objects and add tracking
  const variantRegex = /(\w+):\s*\{([^}]+)\}/g;
  content = content.replace(variantRegex, (match, variantName, variantContent) => {
    // Skip if already has tracking
    if (variantContent.includes('tracking:')) {
      return match;
    }

    // Add tracking at the end of the variant object
    const trackingAddition = `,
    tracking: {
      section: "${filePath.replace('-content.ts', '').replace('-', '-')}",
      sectionId: "${filePath.replace('-content.ts', '').replace('-', '-')}",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }`;

    // Insert before the closing brace
    return match.replace(/\s*\}\s*$/, trackingAddition + '\n    }');
  });

  if (content !== fs.readFileSync(fullPath, 'utf8')) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Added tracking to ${filePath}`);
    changed = true;
  }

  return changed;
}

async function processAllSections() {
  const files = await glob('*-content.ts', { cwd: CONTENT_DIR });

  let changedCount = 0;
  for (const file of files) {
    if (await addTrackingToSection(file)) {
      changedCount++;
    }
  }

  console.log(`\n📊 SUMMARY: Added tracking to ${changedCount} section files`);
  return changedCount;
}

processAllSections().catch(console.error);
