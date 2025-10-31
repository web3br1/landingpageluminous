#!/usr/bin/env node

/**
 * Add Tracking Defaults Safely
 * Adds tracking.sectionId to content variants without breaking syntax
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const CONTENT_DIR = 'domains/marketing/content';

function addTrackingToVariant(content, variantName, sectionName) {
  // Find the variant object and add tracking at the end
  const variantRegex = new RegExp(`(${variantName}:\\s*\\{[^}]*})\\}`, 's');
  const replacement = `$1,
    tracking: {
      section: "${sectionName}",
      sectionId: "${sectionName}",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    },
  }`;

  return content.replace(variantRegex, replacement);
}

async function processContentFile(filePath) {
  const fullPath = path.join(CONTENT_DIR, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  // Skip hero as it already has tracking
  if (filePath.includes('hero')) {
    return false;
  }

  const sectionName = filePath.replace('-content.ts', '').replace('-', '-');

  // Add tracking to default variant if it exists
  if (content.includes('default: {')) {
    content = addTrackingToVariant(content, 'default', sectionName);
    changed = true;
  }

  // Add tracking to other variants
  const variantNames = ['enterprise', 'videoOnly', 'interactiveTour', 'minimal'];
  for (const variantName of variantNames) {
    if (content.includes(`${variantName}: {`)) {
      content = addTrackingToVariant(content, variantName, sectionName);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Added tracking to ${filePath}`);
  }

  return changed;
}

async function addTrackingSafely() {
  const files = await glob('*-content.ts', { cwd: CONTENT_DIR });

  let changedCount = 0;
  for (const file of files) {
    if (await processContentFile(file)) {
      changedCount++;
    }
  }

  console.log(`\n📊 SUMMARY: Added tracking to ${changedCount} section files`);
  return changedCount;
}

addTrackingSafely().catch(console.error);
