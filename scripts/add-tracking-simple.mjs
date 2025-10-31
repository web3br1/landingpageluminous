#!/usr/bin/env node

/**
 * Add Tracking Simple
 * Adds tracking object to the end of content variants
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const CONTENT_DIR = 'domains/marketing/content';

function addTrackingToContent(content, sectionName) {
  // Find content objects that don't have tracking and add it
  // Look for patterns like: } (end of object) followed by comma or closing
  const trackingObject = `,
    tracking: {
      section: "${sectionName}",
      sectionId: "${sectionName}",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }`;

  // This is a simple approach - add tracking before the last } of objects
  // We'll do this carefully to avoid breaking syntax

  // For variant objects like "default: { ... }"
  let modified = false;

  // Find all variant objects and add tracking if missing
  const lines = content.split('\n');
  const newLines = [];
  let inVariant = false;
  let braceCount = 0;
  let variantName = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    newLines.push(line);

    // Detect start of variant
    const variantMatch = line.match(/^(\w+):\s*\{$/);
    if (variantMatch && !line.includes('tracking')) {
      variantName = variantMatch[1];
      inVariant = true;
      braceCount = 1;
    }

    // Track braces
    if (inVariant) {
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceCount += openBraces - closeBraces;

      // If we're back to brace count 0, we just closed the variant
      if (braceCount === 0 && inVariant) {
        // Add tracking before the closing brace
        newLines[newLines.length - 1] = trackingObject;
        modified = true;
        inVariant = false;
      }
    }
  }

  return newLines.join('\n');
}

async function processFile(filePath) {
  const fullPath = path.join(CONTENT_DIR, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Skip hero as it already has tracking
  if (filePath.includes('hero')) {
    return false;
  }

  const sectionName = filePath.replace('-content.ts', '').replace('-', '-');
  const newContent = addTrackingToContent(content, sectionName);

  if (newContent !== content) {
    fs.writeFileSync(fullPath, newContent);
    console.log(`✅ Added tracking to ${filePath}`);
    return true;
  }

  return false;
}

async function addTrackingSimple() {
  const files = await glob('*-content.ts', { cwd: CONTENT_DIR });

  let changedCount = 0;
  for (const file of files) {
    if (await processFile(file)) {
      changedCount++;
    }
  }

  console.log(`\n📊 SUMMARY: Added tracking to ${changedCount} section files`);
  return changedCount;
}

addTrackingSimple().catch(console.error);
